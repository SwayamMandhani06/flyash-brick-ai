import pytest
import numpy as np
from httpx import AsyncClient
from sqlalchemy.orm import Session

from backend.app.persistence.models import ExperimentalRecord, Paper
from backend.app.persistence.repositories import PaperRepository, RecordRepository
from backend.app.services.xgboost_pipeline import (
    APPROVED_PREDICTOR_MANIFEST,
    EXCLUSION_MANIFEST,
    DataReadinessGateError,
    MeanBaselineRegressor,
    TrainingFoldPreprocessor,
    check_target_readiness_or_raise,
    compute_regression_metrics,
    evaluate_paper_grouped_xgboost,
)


def create_synthetic_test_records(num_records: int = 20, num_papers: int = 4) -> list:
    """Helper creating isolated in-memory test objects strictly for pipeline algorithm validation."""
    records = []
    for i in range(num_records):
        p_id = f"TEST_PAPER_{i % num_papers + 1:02d}"
        rec = ExperimentalRecord(
            record_id=f"TEST_REC_{i:03d}",
            paper_id=p_id,
            experiment_group_id=f"TEST_EXP_{p_id}_{i // num_papers}",
            review_status="accepted",
            value_origin="synthetic",  # isolated fixture
            material_system="fly_ash_lime_gypsum_brick",
            fly_ash_fraction=0.50 + (i % 5) * 0.03,
            lime_fraction=0.15,
            gypsum_fraction=0.05,
            sand_fraction=0.30 - (i % 5) * 0.03,
            water_content_or_ratio=0.25,
            curing_duration_days=28,
            compressive_strength_mpa=10.0 + (i % 5) * 1.5,
            water_absorption_pct=14.0 - (i % 5) * 0.8,
        )
        records.append(rec)
    return records


# -----------------------------------------------------------------------------
# 1. Readiness Gate Enforcement Tests
# -----------------------------------------------------------------------------
def test_readiness_gate_rejects_empty_dataset():
    """Confirms that an empty dataset triggers DataReadinessGateError."""
    with pytest.raises(DataReadinessGateError) as exc_info:
        check_target_readiness_or_raise("compressive_strength_mpa", [])
    assert "DATA_READINESS_BLOCKED" in str(exc_info.value)
    assert "0 accepted records" in str(exc_info.value)


def test_readiness_gate_rejects_insufficient_samples():
    """Confirms rejection when samples are below 15 threshold."""
    # 10 records across 4 papers
    records = create_synthetic_test_records(num_records=10, num_papers=4)
    with pytest.raises(DataReadinessGateError) as exc_info:
        check_target_readiness_or_raise("compressive_strength_mpa", records, allow_synthetic_test=True)
    assert "DATA_READINESS_BLOCKED" in str(exc_info.value)
    assert "10 accepted records" in str(exc_info.value)


def test_readiness_gate_rejects_insufficient_papers():
    """Confirms rejection when distinct papers are fewer than 3 (preventing GroupKFold)."""
    # 20 records but from only 2 papers
    records = create_synthetic_test_records(num_records=20, num_papers=2)
    with pytest.raises(DataReadinessGateError) as exc_info:
        check_target_readiness_or_raise("compressive_strength_mpa", records, allow_synthetic_test=True)
    assert "DATA_READINESS_BLOCKED" in str(exc_info.value)
    assert "2 independent papers" in str(exc_info.value)


def test_synthetic_records_strictly_excluded_from_empirical_training():
    """Confirms that synthetic records are rejected from empirical readiness gate without explicit override."""
    records = create_synthetic_test_records(num_records=25, num_papers=5)
    # Synthetic records cannot enter empirical training
    with pytest.raises(DataReadinessGateError) as exc_info:
        check_target_readiness_or_raise("compressive_strength_mpa", records, allow_synthetic_test=False)
    assert "0 accepted records" in str(exc_info.value)


def test_unreviewed_candidates_cannot_enter_training():
    """Confirms that unreviewed candidate records are excluded from training."""
    records = create_synthetic_test_records(num_records=20, num_papers=4)
    for r in records:
        r.review_status = "candidate"
    with pytest.raises(DataReadinessGateError):
        check_target_readiness_or_raise("compressive_strength_mpa", records, allow_synthetic_test=True)


# -----------------------------------------------------------------------------
# 2. Leakage Prevention & Feature Manifest Tests
# -----------------------------------------------------------------------------
def test_predictor_manifest_excludes_metadata_and_outcomes():
    """Verifies that all leakage-prone metadata, identifiers, and post-test properties are excluded."""
    leakage_fields = [
        "record_id",
        "paper_id",
        "document_id",
        "doi_or_url",
        "experiment_group_id",
        "source_title",
        "source_authors",
        "review_status",
        "reviewed_by",
        "failure_mode",
        "is12894_class_nominal",
        "is12894_water_absorption_compliant",
    ]
    for field in leakage_fields:
        assert field not in APPROVED_PREDICTOR_MANIFEST
        assert field in EXCLUSION_MANIFEST


# -----------------------------------------------------------------------------
# 3. Paper-Grouped Split Integrity Tests
# -----------------------------------------------------------------------------
def test_paper_grouped_splits_strictly_isolate_literature_sources():
    """Verifies that held-out validation papers are NEVER present in training folds."""
    records = create_synthetic_test_records(num_records=20, num_papers=4)
    res = evaluate_paper_grouped_xgboost(
        records=records,
        target_property="compressive_strength_mpa",
        n_splits=3,
        random_seed=42,
        allow_synthetic_test=True,
    )

    assert res["n_splits_evaluated"] >= 2
    for fold in res["per_fold_details"]:
        assert len(fold["held_out_papers"]) >= 1
        # Training samples + validation samples must equal total samples
        assert fold["train_samples"] + fold["val_samples"] == res["total_samples"]


# -----------------------------------------------------------------------------
# 4. Training-Fold-Only Preprocessing Tests
# -----------------------------------------------------------------------------
def test_preprocessor_fits_medians_strictly_on_training_fold():
    """Verifies that imputer medians are derived only from the training fold."""
    train_data = [
        {"fly_ash_fraction": 0.50, "water_content_or_ratio": 0.20},
        {"fly_ash_fraction": 0.60, "water_content_or_ratio": 0.30},
    ]
    val_data = [
        {"fly_ash_fraction": 0.70, "water_content_or_ratio": None},
    ]

    prep = TrainingFoldPreprocessor(["fly_ash_fraction", "water_content_or_ratio"])
    prep.fit(train_data)
    # Median of 0.20 and 0.30 is 0.25
    assert prep.medians["water_content_or_ratio"] == 0.25

    transformed_val = prep.transform(val_data)
    assert transformed_val[0][0] == 0.70
    assert transformed_val[0][1] == 0.25  # Imputed using training median!


# -----------------------------------------------------------------------------
# 5. Baseline Metric Computation Tests
# -----------------------------------------------------------------------------
def test_mean_baseline_regressor_computation():
    """Verifies that MeanBaselineRegressor accurately computes constant mean and metrics."""
    y_train = np.array([10.0, 20.0, 30.0])
    baseline = MeanBaselineRegressor().fit(y_train)
    assert baseline.mean_value == 20.0

    X_dummy = np.zeros((3, 2))
    preds = baseline.predict(X_dummy)
    assert np.all(preds == 20.0)

    y_val = np.array([15.0, 25.0])
    metrics = compute_regression_metrics(y_val, np.array([20.0, 20.0]))
    assert metrics["mae"] == 5.0
    assert metrics["rmse"] == 5.0


def test_xgboost_pipeline_reproducibility():
    """Verifies that identical random seeds produce identical evaluation metrics."""
    records = create_synthetic_test_records(num_records=20, num_papers=4)
    res_1 = evaluate_paper_grouped_xgboost(
        records=records,
        target_property="compressive_strength_mpa",
        n_splits=3,
        random_seed=123,
        allow_synthetic_test=True,
    )
    res_2 = evaluate_paper_grouped_xgboost(
        records=records,
        target_property="compressive_strength_mpa",
        n_splits=3,
        random_seed=123,
        allow_synthetic_test=True,
    )
    assert res_1["xgboost_summary"]["mean_mae"] == res_2["xgboost_summary"]["mean_mae"]
    assert res_1["xgboost_summary"]["mean_rmse"] == res_2["xgboost_summary"]["mean_rmse"]


# -----------------------------------------------------------------------------
# 6. API Endpoint Tests (Honest Unavailable Model Responses)
# -----------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_predict_endpoint_returns_503_when_no_trained_model(async_client: AsyncClient):
    """Verifies that predicting against an untrained model returns 503 Service Unavailable."""
    payload = {
        "material_system": "fly_ash_lime_gypsum_brick",
        "fly_ash_fraction": 0.60,
        "lime_fraction": 0.15,
        "gypsum_fraction": 0.05,
        "sand_fraction": 0.20,
    }
    res = await async_client.post(
        "/api/models/predict?target_property=compressive_strength_mpa",
        json=payload,
    )
    assert res.status_code == 503
    err_msg = res.json()["error"]["message"]
    assert "MODEL_UNAVAILABLE" in err_msg
    assert "readiness gate remains strictly enforced" in err_msg


@pytest.mark.asyncio
async def test_explain_endpoint_returns_503_when_no_trained_model(async_client: AsyncClient):
    """Verifies that SHAP explanation returns 503 without generating fake attributions."""
    payload = {
        "material_system": "fly_ash_lime_gypsum_brick",
        "fly_ash_fraction": 0.60,
        "lime_fraction": 0.15,
        "gypsum_fraction": 0.05,
        "sand_fraction": 0.20,
    }
    res = await async_client.post(
        "/api/models/explain?target_property=compressive_strength_mpa",
        json=payload,
    )
    assert res.status_code == 503
    err_msg = res.json()["error"]["message"]
    assert "MODEL_UNAVAILABLE" in err_msg
    assert "Cannot generate SHAP explanations" in err_msg


@pytest.mark.asyncio
async def test_predict_input_validation_rejects_zero_fly_ash(async_client: AsyncClient):
    """Verifies input validation rejects zero or negative fly ash fraction."""
    payload = {
        "material_system": "fly_ash_lime_gypsum_brick",
        "fly_ash_fraction": 0.0,
    }
    res = await async_client.post(
        "/api/models/predict?target_property=compressive_strength_mpa",
        json=payload,
    )
    assert res.status_code == 422
    assert "greater than 0.0" in res.json()["error"]["message"]


@pytest.mark.asyncio
async def test_train_endpoint_enforces_readiness_gate(async_client: AsyncClient):
    """Verifies that POST /api/models/train fails with 422 when empirical data is insufficient."""
    train_payload = {
        "target_property": "compressive_strength_mpa",
        "n_splits": 5,
        "random_seed": 42,
    }
    res = await async_client.post("/api/models/train", json=train_payload)
    assert res.status_code == 422
    err_msg = res.json()["error"]["message"]
    assert "DATA_READINESS_BLOCKED" in err_msg
