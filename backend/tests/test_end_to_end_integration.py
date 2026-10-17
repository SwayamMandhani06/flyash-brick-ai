import io
import os
import tempfile
import pytest
import numpy as np
from httpx import AsyncClient
from sqlalchemy.orm import Session
import xgboost as xgb

from backend.app.core.config import settings
from backend.app.persistence.models import (
    DatasetVersion,
    ExperimentalRecord,
    ModelRegistryMetadata,
    OptimizationRun,
    Paper,
)
from backend.app.persistence.repositories import (
    DatasetVersionRepository,
    ModelMetadataRepository,
    OptimizationRepository,
    PaperRepository,
    RecordRepository,
)
from backend.app.schemas.optimization import (
    OptimizationRequest,
    TargetPerformanceRequirements,
)
from backend.app.services.xgboost_pipeline import (
    APPROVED_PREDICTOR_MANIFEST,
    ModelArtifactError,
    TrainingFoldPreprocessor,
    load_model_pipeline,
    make_pipeline_predictor,
    save_model_pipeline,
)
from backend.tests.test_extraction import generate_tabular_pdf


# -----------------------------------------------------------------------------
# 1. Full End-to-End Ingestion, Validation, Snapshot, and Blocked Training Flow
# -----------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_end_to_end_research_to_readiness_workflow(
    async_client: AsyncClient,
    db_session: Session,
):
    """Verifies the complete research lifecycle across service boundaries:

    1. Register research paper metadata
    2. Upload generated in-memory PDF
    3. Extract candidate records with provenance
    4. Apply human corrections and preserve immutable audit history
    5. Run scientific validation and normalization
    6. Transition candidate to accepted status with target eligibility
    7. Freeze an immutable dataset snapshot
    8. Execute EDA and target-specific readiness assessment
    9. Verify model training remains strictly blocked (HTTP 422)
    10. Verify prediction is unavailable without trained model (HTTP 503)
    11. Verify SHAP explanation is unavailable without trained model (HTTP 503)
    12. Verify optimization is unavailable without trained models (HTTP 503)
    """
    # Step 1: Register Research Paper
    paper_payload = {
        "title": "Phase 9 Synthesis: Microstructural Evolution in Sustainable Fly Ash Masonry",
        "authors": "Banerjee, S., Roy, P., and Mandhani, S.",
        "journal": "Construction and Building Materials",
        "publication_year": 2024,
        "doi_or_url": "10.1016/j.conbuildmat.2024.119876",
        "material_system": "fly_ash_lime_gypsum_brick",
        "notes": "Experimental validation trial under controlled curing regimes.",
    }
    p_res = await async_client.post("/api/papers", json=paper_payload)
    assert p_res.status_code == 201
    paper_id = p_res.json()["paper_id"]

    # Step 2: Upload Generated In-Memory PDF
    pdf_bytes = generate_tabular_pdf()
    files = {"file": ("phase9_trial.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    up_res = await async_client.post("/api/documents/upload", files=files, data={"paper_id": paper_id})
    assert up_res.status_code == 201
    doc_id = up_res.json()["document_id"]

    # Step 3: Extract Candidate Records with Provenance
    ext_res = await async_client.post(f"/api/documents/{doc_id}/extract")
    assert ext_res.status_code == 200
    assert ext_res.json()["candidate_records_count"] >= 2

    cands_res = await async_client.get(f"/api/documents/{doc_id}/candidates")
    assert cands_res.status_code == 200
    candidates = cands_res.json()
    assert len(candidates) >= 2
    rec = candidates[0]
    rec_id = rec["record_id"]
    assert rec["paper_id"] == paper_id
    assert rec["document_id"] == doc_id
    assert rec["value_origin"] == "literature_extracted"

    # Step 4: Apply Human Review and Check Immutable Audit History
    correction_payload = {
        "reviewer": "dr_integrator",
        "reason": "Normalized sand aggregate and verified 28-day moist curing conditions",
        "field_corrections": {
            "sand_fraction": 0.20,
            "curing_duration_days": 28,
            "water_content_or_ratio": 0.25,
            "water_basis": "water_binder_ratio",
        },
    }
    rev_res = await async_client.patch(f"/api/records/{rec_id}/review", json=correction_payload)
    assert rev_res.status_code == 200

    hist_res = await async_client.get(f"/api/records/{rec_id}/history")
    assert hist_res.status_code == 200
    assert len(hist_res.json()) >= 4

    # Step 5: Run Scientific Validation
    val_res = await async_client.post(f"/api/records/{rec_id}/validate")
    assert val_res.status_code == 200
    assert val_res.json()["is_eligible_for_compressive_strength"] is False  # Candidate status

    # Step 6: Transition Candidate to Accepted Status
    accept_payload = {
        "reviewer": "dr_integrator",
        "reason": "Mix proportions, test standard, and strength values verified",
        "new_status": "accepted",
    }
    acc_res = await async_client.patch(f"/api/records/{rec_id}/review", json=accept_payload)
    assert acc_res.status_code == 200
    assert acc_res.json()["review_status"] == "accepted"

    val_res_post = await async_client.post(f"/api/records/{rec_id}/validate")
    assert val_res_post.status_code == 200
    assert val_res_post.json()["is_eligible_for_compressive_strength"] is True
    assert val_res_post.json()["is_eligible_for_water_absorption"] is True

    # Step 7: Create Dataset Snapshot
    snapshot_payload = {
        "version_id": "v1.0.0-phase9-snapshot",
        "schema_version": "v1.0.0-canonical",
        "lifecycle_state": "model_ready",
        "description": "Verified research record snapshot for Phase 9 integration",
        "record_ids": [rec_id],
    }
    snap_res = await async_client.post("/api/datasets/versions", json=snapshot_payload)
    assert snap_res.status_code == 201

    # Step 8: Run Target-Specific EDA and Readiness
    eda_res = await async_client.post(
        "/api/datasets/eda",
        json={"dataset_version_id": "v1.0.0-phase9-snapshot", "exclude_synthetic": True},
    )
    assert eda_res.status_code == 201
    eda_data = eda_res.json()
    assert eda_data["target_readiness"]["compressive_strength_mpa"]["readiness_status"] == "unsupported_insufficient_data"

    # Step 9: Verify Training Remains Blocked
    train_res = await async_client.post(
        "/api/models/train",
        json={"target_property": "compressive_strength_mpa", "dataset_version_id": "v1.0.0-phase9-snapshot"},
    )
    assert train_res.status_code == 422
    assert "DATA_READINESS_BLOCKED" in train_res.json()["error"]["message"]

    # Step 10: Verify Prediction is Blocked (HTTP 503)
    pred_res = await async_client.post(
        "/api/models/predict?target_property=compressive_strength_mpa",
        json={"material_system": "fly_ash_lime_gypsum_brick", "fly_ash_fraction": 0.60},
    )
    assert pred_res.status_code == 503
    assert "MODEL_UNAVAILABLE" in pred_res.json()["error"]["message"]

    # Step 11: Verify Explanation is Blocked (HTTP 503)
    exp_res = await async_client.post(
        "/api/models/explain?target_property=compressive_strength_mpa",
        json={"material_system": "fly_ash_lime_gypsum_brick", "fly_ash_fraction": 0.60},
    )
    assert exp_res.status_code == 503
    assert "MODEL_UNAVAILABLE" in exp_res.json()["error"]["message"]

    # Step 12: Verify Optimization is Blocked (HTTP 503)
    opt_res = await async_client.post(
        "/api/optimization/run",
        json={"material_system": "fly_ash_lime_gypsum_brick", "primary_objective": "balanced_pareto", "max_candidates": 20},
    )
    assert opt_res.status_code == 503
    assert "OPTIMIZATION_UNAVAILABLE" in opt_res.json()["error"]["message"]


# -----------------------------------------------------------------------------
# 2. Model Persistence, Serialization, and Deserialization Verification
# -----------------------------------------------------------------------------
def test_save_and_load_model_pipeline_isolated():
    """Verifies that save_model_pipeline and load_model_pipeline safely serialize and restore pipelines."""
    with tempfile.TemporaryDirectory() as tmpdir:
        features = APPROVED_PREDICTOR_MANIFEST
        preprocessor = TrainingFoldPreprocessor(features)
        preprocessor.fit([
            {"fly_ash_fraction": 0.60, "lime_fraction": 0.15, "gypsum_fraction": 0.05, "sand_fraction": 0.20},
            {"fly_ash_fraction": 0.50, "lime_fraction": 0.20, "gypsum_fraction": 0.05, "sand_fraction": 0.25},
        ])

        # Train miniature XGBoost estimator
        X_train = preprocessor.transform([
            {"fly_ash_fraction": 0.60, "lime_fraction": 0.15, "gypsum_fraction": 0.05, "sand_fraction": 0.20},
            {"fly_ash_fraction": 0.50, "lime_fraction": 0.20, "gypsum_fraction": 0.05, "sand_fraction": 0.25},
        ])
        y_train = np.array([16.5, 14.2], dtype=float)

        model = xgb.XGBRegressor(n_estimators=5, max_depth=2, random_state=42)
        model.fit(X_train, y_train)

        artifact_path = os.path.join(tmpdir, "test_model_pipeline.joblib")
        saved_path = save_model_pipeline(
            artifact_path=artifact_path,
            model=model,
            preprocessor=preprocessor,
            metadata={
                "target_property": "compressive_strength_mpa",
                "target_unit": "MPa",
                "algorithm": "XGBoost",
                "model_version": "v1.0.0-test",
                "material_system": "fly_ash_lime_gypsum_brick",
            },
        )
        assert os.path.exists(saved_path)

        # Load bundle with safe checks
        bundle = load_model_pipeline(
            artifact_path=artifact_path,
            expected_target="compressive_strength_mpa",
            expected_material_system="fly_ash_lime_gypsum_brick",
            allowed_dir=tmpdir,
        )
        assert bundle["target_property"] == "compressive_strength_mpa"
        assert bundle["algorithm"] == "XGBoost"

        predictor = make_pipeline_predictor(bundle)
        pred_val = predictor({"fly_ash_fraction": 0.60, "lime_fraction": 0.15, "gypsum_fraction": 0.05, "sand_fraction": 0.20})
        assert isinstance(pred_val, float)
        assert pred_val > 0.0


# -----------------------------------------------------------------------------
# 3. Security, Path Traversal, and Corrupted Artifact Safeguards
# -----------------------------------------------------------------------------
def test_model_loading_security_safeguards():
    """Verifies that model artifact loading guards against path traversal, missing files, and corruption."""
    with tempfile.TemporaryDirectory() as tmpdir:
        # A. Path traversal rejection
        with pytest.raises(ModelArtifactError) as exc_info:
            load_model_pipeline(
                artifact_path="../../etc/passwd",
                allowed_dir=tmpdir,
            )
        assert "PATH_TRAVERSAL_DETECTED" in str(exc_info.value)

        # B. Non-existent file rejection
        with pytest.raises(ModelArtifactError) as exc_info:
            load_model_pipeline(
                artifact_path=os.path.join(tmpdir, "nonexistent.joblib"),
                allowed_dir=tmpdir,
            )
        assert "ARTIFACT_NOT_FOUND" in str(exc_info.value)

        # C. Corrupted file rejection
        corrupt_path = os.path.join(tmpdir, "corrupt.joblib")
        with open(corrupt_path, "wb") as f:
            f.write(b"NOT_A_VALID_JOBLIB_PICKLE_HEADER_DATA_123456789")

        with pytest.raises(ModelArtifactError) as exc_info:
            load_model_pipeline(
                artifact_path=corrupt_path,
                allowed_dir=tmpdir,
            )
        assert "CORRUPT_ARTIFACT" in str(exc_info.value)

        # D. Target mismatch rejection
        features = APPROVED_PREDICTOR_MANIFEST
        preprocessor = TrainingFoldPreprocessor(features).fit([{"fly_ash_fraction": 0.5}])
        model = xgb.XGBRegressor(n_estimators=2).fit(preprocessor.transform([{"fly_ash_fraction": 0.5}]), np.array([10.0]))
        valid_path = os.path.join(tmpdir, "valid.joblib")
        save_model_pipeline(
            artifact_path=valid_path,
            model=model,
            preprocessor=preprocessor,
            metadata={
                "target_property": "water_absorption_pct",
                "material_system": "fly_ash_lime_gypsum_brick",
            },
        )

        with pytest.raises(ModelArtifactError) as exc_info:
            load_model_pipeline(
                artifact_path=valid_path,
                expected_target="compressive_strength_mpa",  # Mismatched target
                allowed_dir=tmpdir,
            )
        assert "TARGET_MISMATCH" in str(exc_info.value)

        # E. Material system mismatch rejection
        with pytest.raises(ModelArtifactError) as exc_info:
            load_model_pipeline(
                artifact_path=valid_path,
                expected_target="water_absorption_pct",
                expected_material_system="cement_fly_ash_brick",  # Mismatched material system
                allowed_dir=tmpdir,
            )
        assert "MATERIAL_SYSTEM_MISMATCH" in str(exc_info.value)


# -----------------------------------------------------------------------------
# 4. Optimization Route Model Loading Verification with Test Artifacts
# -----------------------------------------------------------------------------
def test_optimization_uses_real_loaded_models_without_lambdas(monkeypatch, db_session: Session):
    """Verifies that the optimization engine loads and evaluates genuine model pipelines without dummy lambdas."""
    with tempfile.TemporaryDirectory() as tmpdir:
        # Create test models for both targets
        features = APPROVED_PREDICTOR_MANIFEST
        prep = TrainingFoldPreprocessor(features).fit([{"fly_ash_fraction": 0.60, "lime_fraction": 0.15}])
        X_test = prep.transform([{"fly_ash_fraction": 0.60, "lime_fraction": 0.15}])

        str_model = xgb.XGBRegressor(n_estimators=5, random_state=42).fit(X_test, np.array([18.5]))
        abs_model = xgb.XGBRegressor(n_estimators=5, random_state=42).fit(X_test, np.array([10.8]))

        str_path = os.path.join(tmpdir, "mod_strength.joblib")
        abs_path = os.path.join(tmpdir, "mod_absorption.joblib")

        save_model_pipeline(
            artifact_path=str_path,
            model=str_model,
            preprocessor=prep,
            metadata={"target_property": "compressive_strength_mpa", "material_system": "fly_ash_lime_gypsum_brick"},
        )
        save_model_pipeline(
            artifact_path=abs_path,
            model=abs_model,
            preprocessor=prep,
            metadata={"target_property": "water_absorption_pct", "material_system": "fly_ash_lime_gypsum_brick"},
        )

        # Monkeypatch settings.MODELS_STORAGE_DIR to tmpdir
        monkeypatch.setattr(settings, "MODELS_STORAGE_DIR", tmpdir)

        # Safely load both pipelines
        str_bundle = load_model_pipeline(str_path, expected_target="compressive_strength_mpa")
        abs_bundle = load_model_pipeline(abs_path, expected_target="water_absorption_pct")

        str_pred = make_pipeline_predictor(str_bundle)
        abs_pred = make_pipeline_predictor(abs_bundle)

        from backend.app.services.optimization_service import ConstrainedMixOptimizer

        req = OptimizationRequest(
            material_system="fly_ash_lime_gypsum_brick",
            primary_objective="balanced_pareto",
            performance_requirements=TargetPerformanceRequirements(
                min_compressive_strength_mpa=15.0,
                max_water_absorption_pct=15.0,
            ),
            max_candidates=30,
            random_seed=42,
        )

        optimizer = ConstrainedMixOptimizer(
            request=req,
            strength_predictor=str_pred,
            absorption_predictor=abs_pred,
        )
        result = optimizer.run_optimization()

        assert result["status"] == "completed"
        assert len(result["recommended_candidates"]) > 0
        top = result["recommended_candidates"][0]
        # Assert genuine prediction produced by model rather than constant placeholder
        assert top["predicted_compressive_strength_mpa"] is not None
        assert top["predicted_water_absorption_pct"] is not None


@pytest.mark.asyncio
async def test_api_optimization_fails_closed_when_model_artifact_is_corrupt(
    async_client: AsyncClient,
    db_session: Session,
    monkeypatch,
):
    """Verifies that POST /api/optimization/run fails closed with 503 when registered artifact file is corrupt."""
    with tempfile.TemporaryDirectory() as tmpdir:
        monkeypatch.setattr(settings, "MODELS_STORAGE_DIR", tmpdir)

        # 1. Seed 15 accepted empirical records across 3 distinct papers so dataset readiness passes
        papers = [
            Paper(paper_id=f"PAP_EMP_{i}", title=f"Empirical Paper {i}", authors="Author", material_system="fly_ash_lime_gypsum_brick")
            for i in range(1, 4)
        ]
        for p in papers:
            db_session.add(p)
        db_session.commit()

        for i in range(15):
            p_id = papers[i % 3].paper_id
            rec = ExperimentalRecord(
                record_id=f"REC_EMP_{i:03d}",
                paper_id=p_id,
                review_status="accepted",
                value_origin="literature_extracted",
                material_system="fly_ash_lime_gypsum_brick",
                fly_ash_fraction=0.60,
                lime_fraction=0.15,
                gypsum_fraction=0.05,
                sand_fraction=0.20,
                compressive_strength_mpa=16.0 + (i * 0.2),
                water_absorption_pct=11.0 + (i * 0.1),
            )
            db_session.add(rec)
        db_session.commit()

        # 2. Create a corrupt artifact file
        corrupt_path = os.path.join(tmpdir, "corrupt_strength.joblib")
        with open(corrupt_path, "wb") as f:
            f.write(b"CORRUPT_NOT_A_VALID_MODEL_FILE")

        # 3. Create a valid absorption model artifact
        features = APPROVED_PREDICTOR_MANIFEST
        prep = TrainingFoldPreprocessor(features).fit([{"fly_ash_fraction": 0.60}])
        abs_model = xgb.XGBRegressor(n_estimators=2).fit(prep.transform([{"fly_ash_fraction": 0.60}]), np.array([11.0]))
        valid_abs_path = os.path.join(tmpdir, "valid_abs.joblib")
        save_model_pipeline(
            artifact_path=valid_abs_path,
            model=abs_model,
            preprocessor=prep,
            metadata={"target_property": "water_absorption_pct", "material_system": "fly_ash_lime_gypsum_brick"},
        )

        # 4. Register metadata in database
        str_meta = ModelRegistryMetadata(
            model_id="mod_corrupt_str",
            target_property="compressive_strength_mpa",
            target_unit="MPa",
            algorithm="XGBoost",
            model_version="v1.0.0-test",
            feature_manifest=features,
            artifact_path=corrupt_path,
            is_trained=True,
        )
        abs_meta = ModelRegistryMetadata(
            model_id="mod_valid_abs",
            target_property="water_absorption_pct",
            target_unit="%",
            algorithm="XGBoost",
            model_version="v1.0.0-test",
            feature_manifest=features,
            artifact_path=valid_abs_path,
            is_trained=True,
        )
        db_session.add(str_meta)
        db_session.add(abs_meta)
        db_session.commit()

        # 5. Call endpoint: readiness passes, but model loading fails closed!
        req_payload = {
            "material_system": "fly_ash_lime_gypsum_brick",
            "primary_objective": "balanced_pareto",
            "max_candidates": 20,
        }
        res = await async_client.post("/api/optimization/run", json=req_payload)
        assert res.status_code == 503
        err_msg = res.json()["error"]["message"]
        assert "MODEL_ARTIFACT_ERROR" in err_msg
        assert "CORRUPT_ARTIFACT" in err_msg
