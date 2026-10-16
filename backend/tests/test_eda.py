from datetime import datetime, timezone
import pytest
from httpx import AsyncClient
from sqlalchemy.orm import Session

from backend.app.persistence.models import (
    DatasetVersion,
    DatasetVersionRecord,
    ExperimentalRecord,
    Paper,
)
from backend.app.schemas.eda import AnalysisRunCreate
from backend.app.services.eda import EDAService


def create_paper_and_record(
    db: Session,
    paper_id: str,
    record_id: str,
    comp_strength: float = 12.5,
    water_abs: float = 14.2,
    fly_ash: float = 0.55,
    cement: float = 0.10,
    lime: float = 0.15,
    gypsum: float = 0.05,
    water_ratio: float = 0.35,
    curing_days: int = 28,
    review_status: str = "accepted",
    value_origin: str = "literature_extracted",
    material_system: str = "fly_ash_lime_gypsum_brick",
    experiment_group_id: str = "grp_1",
) -> ExperimentalRecord:
    # Ensure paper exists
    paper = db.get(Paper, paper_id)
    if not paper:
        paper = Paper(
            paper_id=paper_id,
            doi_or_url=f"10.1016/j.test.{paper_id}",
            title=f"Study on Fly Ash Bricks {paper_id}",
            authors="Test Author et al.",
            material_system=material_system,
        )
        db.add(paper)
        db.commit()

    rec = ExperimentalRecord(
        record_id=record_id,
        paper_id=paper_id,
        experiment_group_id=experiment_group_id,
        material_system=material_system,
        mix_basis="dry_mass_fraction",
        fly_ash_fraction=fly_ash,
        cement_fraction=cement,
        lime_fraction=lime,
        gypsum_fraction=gypsum,
        water_content_or_ratio=water_ratio,
        water_basis="water_binder_ratio",
        curing_duration_days=curing_days,
        curing_temperature_c=27.0,
        test_age_days=curing_days,
        compressive_strength_mpa=comp_strength,
        water_absorption_pct=water_abs,
        review_status=review_status,
        value_origin=value_origin,
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return rec


# -------------------------------------------------------------------------
# Synchronous Core Service Tests
# -------------------------------------------------------------------------


def test_empty_corpus_reports_honest_insufficient_data(db_session: Session):
    """If no empirical records are present, analysis must report zero counts and unsupported status."""
    config = AnalysisRunCreate(exclude_synthetic=True, require_accepted_review=True)
    res = EDAService.execute_analysis(db_session, config)

    assert res.sample_summary["evaluated_records_count"] == 0
    assert res.sample_summary["distinct_papers_count"] == 0
    assert res.target_readiness["compressive_strength_mpa"].readiness_status == "unsupported_insufficient_data"
    assert res.target_readiness["water_absorption_pct"].readiness_status == "unsupported_insufficient_data"
    assert not res.target_readiness["compressive_strength_mpa"].grouped_evaluation_feasible
    assert any("No empirical research records available" in lim for lim in res.limitations)


def test_synthetic_data_isolation_safeguard(db_session: Session):
    """Synthetic fixtures must be excluded from empirical research analysis."""
    # 2 real accepted records
    create_paper_and_record(db_session, "p1", "r1", value_origin="literature_extracted", review_status="accepted")
    create_paper_and_record(db_session, "p1", "r2", value_origin="literature_extracted", review_status="accepted")
    # 3 synthetic records
    create_paper_and_record(db_session, "p_synth", "s1", value_origin="synthetic", review_status="accepted")
    create_paper_and_record(db_session, "p_synth", "s2", value_origin="synthetic", review_status="accepted")
    create_paper_and_record(db_session, "p_synth", "s3", value_origin="synthetic", review_status="accepted")

    config = AnalysisRunCreate(exclude_synthetic=True)
    res = EDAService.execute_analysis(db_session, config)

    assert res.sample_summary["total_raw_records"] == 5
    assert res.sample_summary["synthetic_excluded_count"] == 3
    assert res.sample_summary["evaluated_records_count"] == 2
    assert res.sample_summary["distinct_papers_count"] == 1


def test_dataset_version_filtering_and_snapshot_isolation(db_session: Session):
    """Analysis targeting a frozen dataset snapshot must only evaluate records inside that version."""
    r1 = create_paper_and_record(db_session, "p1", "r1", comp_strength=10.0)
    r2 = create_paper_and_record(db_session, "p2", "r2", comp_strength=20.0)
    r3 = create_paper_and_record(db_session, "p3", "r3", comp_strength=30.0)

    # Version 1 includes r1 and r2 only
    v1 = DatasetVersion(
        version_id="dset_v1",
        schema_version="v1.0.0-canonical",
        lifecycle_state="reviewed",
        description="Version 1 Snapshot",
        record_count=2,
        is_frozen=True,
    )
    db_session.add(v1)
    db_session.flush()
    db_session.add(DatasetVersionRecord(version_id="dset_v1", record_id=r1.record_id))
    db_session.add(DatasetVersionRecord(version_id="dset_v1", record_id=r2.record_id))
    db_session.commit()

    config = AnalysisRunCreate(dataset_version_id="dset_v1")
    res = EDAService.execute_analysis(db_session, config)

    assert res.sample_summary["evaluated_records_count"] == 2
    assert res.descriptive_statistics["compressive_strength_mpa"].valid_count == 2
    assert res.descriptive_statistics["compressive_strength_mpa"].mean == 15.0
    assert res.descriptive_statistics["compressive_strength_mpa"].max == 20.0


def test_material_system_separation(db_session: Session):
    """Material systems must be analyzed separately when requested."""
    create_paper_and_record(db_session, "p1", "r1", material_system="fly_ash_lime_gypsum_brick")
    create_paper_and_record(db_session, "p1", "r2", material_system="fly_ash_clay_brick")

    config = AnalysisRunCreate(material_system="fly_ash_lime_gypsum_brick")
    res = EDAService.execute_analysis(db_session, config)

    assert res.sample_summary["evaluated_records_count"] == 1
    assert "fly_ash_lime_gypsum_brick" in res.sample_summary["material_systems_distribution"]
    assert "fly_ash_clay_brick" not in res.sample_summary["material_systems_distribution"]


def test_missingness_and_summary_statistics_exactness(db_session: Session):
    """Summary statistics (mean, std, min, q1, median, q3, max) must match exact sample math."""
    strengths = [10.0, 20.0, 30.0, 40.0]
    for i, s in enumerate(strengths):
        qd = 0.15 if i % 2 == 0 else None
        rec = create_paper_and_record(db_session, f"p{i}", f"rec_{i}", comp_strength=s)
        rec.quarry_dust_fraction = qd
        db_session.commit()

    config = AnalysisRunCreate()
    res = EDAService.execute_analysis(db_session, config)

    comp_stat = res.descriptive_statistics["compressive_strength_mpa"]
    assert comp_stat.valid_count == 4
    assert comp_stat.missing_count == 0
    assert comp_stat.missing_pct == 0.0
    assert comp_stat.mean == 25.0
    assert comp_stat.min == 10.0
    assert comp_stat.max == 40.0
    assert comp_stat.median == 25.0

    # Quarry dust missingness
    qd_stat = res.descriptive_statistics["quarry_dust_fraction"]
    assert qd_stat.total_count == 4
    assert qd_stat.valid_count == 2
    assert qd_stat.missing_count == 2
    assert qd_stat.missing_pct == 50.0
    assert qd_stat.mean == 0.15


def test_constant_and_near_constant_feature_detection(db_session: Session):
    """Constant and near-constant features must be flagged and excluded from candidate predictors."""
    for i in range(20):
        rec = create_paper_and_record(
            db_session, f"p_{i % 3}", f"r_{i}", cement=0.10 if i < 19 else 0.12
        )
        rec.curing_temperature_c = 27.0
        db_session.commit()

    config = AnalysisRunCreate()
    res = EDAService.execute_analysis(db_session, config)

    # Constant feature
    temp_assess = res.feature_assessments["curing_temperature_c"]
    assert temp_assess.is_constant
    assert temp_assess.suitability == "excluded_low_variance"

    # Near-constant feature (95% same value)
    cement_assess = res.feature_assessments["cement_fraction"]
    assert cement_assess.is_near_constant
    assert cement_assess.suitability == "excluded_low_variance"


def test_leakage_prone_metadata_exclusion(db_session: Session):
    """Identifiers, provenance notes, and post-test metadata must be strictly excluded from features."""
    create_paper_and_record(db_session, "p1", "r1")

    config = AnalysisRunCreate()
    res = EDAService.execute_analysis(db_session, config)

    # Identifiers
    for id_field in ["record_id", "paper_id", "document_id", "doi_or_url", "experiment_group_id"]:
        assess = res.feature_assessments[id_field]
        assert assess.is_leakage_risk
        assert assess.suitability == "excluded_leakage"

    # Post-test outcomes
    for post_field in ["failure_mode", "is12894_class_nominal", "is12894_water_absorption_compliant"]:
        assess = res.feature_assessments[post_field]
        assert assess.is_leakage_risk
        assert assess.leakage_category == "post_test_outcome"
        assert assess.suitability == "excluded_leakage"


def test_target_specific_readiness_differentiation(db_session: Session):
    """Eligibility and readiness for compressive strength must not automatically imply readiness for water absorption."""
    for i in range(16):
        wa = 14.0 if i < 2 else None
        create_paper_and_record(db_session, f"p_{i % 4}", f"r_{i}", comp_strength=15.0 + i, water_abs=wa)

    config = AnalysisRunCreate(min_papers_for_grouped_eval=3, min_samples_for_evaluation=15)
    res = EDAService.execute_analysis(db_session, config)

    comp_readiness = res.target_readiness["compressive_strength_mpa"]
    water_readiness = res.target_readiness["water_absorption_pct"]

    # Compressive strength: 16 samples across 4 papers -> preliminary_limited_evidence
    assert comp_readiness.eligible_sample_count == 16
    assert comp_readiness.distinct_paper_count == 4
    assert comp_readiness.grouped_evaluation_feasible
    assert comp_readiness.readiness_status == "preliminary_limited_evidence"

    # Water absorption: only 2 samples across 2 papers -> unsupported_insufficient_data
    assert water_readiness.eligible_sample_count == 2
    assert water_readiness.distinct_paper_count == 2
    assert not water_readiness.grouped_evaluation_feasible
    assert water_readiness.readiness_status == "unsupported_insufficient_data"


def test_collinearity_detection(db_session: Session):
    """Highly collinear features (|r| >= threshold) must be flagged for review without silent dropping."""
    for i in range(10):
        fa = 0.40 + i * 0.02
        rec = create_paper_and_record(db_session, f"p_{i % 3}", f"r_{i}", fly_ash=fa)
        rec.sand_fraction = round(1.0 - fa - 0.15 - 0.05, 4)
        db_session.commit()

    config = AnalysisRunCreate(correlation_threshold=0.95)
    res = EDAService.execute_analysis(db_session, config)

    found_corr = False
    for finding in res.correlation_findings:
        pair = {finding.feature_a, finding.feature_b}
        if "fly_ash_fraction" in pair and "sand_fraction" in pair:
            assert abs(finding.pearson_r) >= 0.99
            assert "collinearity" in finding.interpretation.lower()
            found_corr = True
            break
    assert found_corr


def test_no_mutation_of_records_or_snapshots(db_session: Session):
    """EDA execution must be strictly read-only with respect to canonical records and snapshots."""
    rec = create_paper_and_record(db_session, "p1", "r1", comp_strength=15.0, water_abs=12.0)

    config = AnalysisRunCreate()
    EDAService.execute_analysis(db_session, config)

    reloaded = db_session.get(ExperimentalRecord, "r1")
    assert reloaded.compressive_strength_mpa == 15.0
    assert reloaded.water_absorption_pct == 12.0
    assert reloaded.review_status == "accepted"


def test_reproducibility_for_identical_snapshots(db_session: Session):
    """Running EDA twice with identical parameters on the same snapshot must yield identical metrics."""
    create_paper_and_record(db_session, "p1", "r1", comp_strength=10.0)
    create_paper_and_record(db_session, "p2", "r2", comp_strength=20.0)

    config = AnalysisRunCreate()
    run1 = EDAService.execute_analysis(db_session, config)
    run2 = EDAService.execute_analysis(db_session, config)

    assert run1.sample_summary == run2.sample_summary
    assert run1.descriptive_statistics["compressive_strength_mpa"].mean == run2.descriptive_statistics["compressive_strength_mpa"].mean
    assert run1.target_readiness["compressive_strength_mpa"].readiness_status == run2.target_readiness["compressive_strength_mpa"].readiness_status


# -------------------------------------------------------------------------
# Asynchronous API Integration Tests
# -------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_api_post_eda_run(async_client: AsyncClient, db_session: Session):
    create_paper_and_record(db_session, "p1", "r1", comp_strength=14.0)

    response = await async_client.post("/api/datasets/eda", json={"exclude_synthetic": True})
    assert response.status_code == 201
    data = response.json()
    assert "analysis_id" in data
    assert data["sample_summary"]["evaluated_records_count"] == 1
    assert "compressive_strength_mpa" in data["target_readiness"]


@pytest.mark.asyncio
async def test_api_get_latest_eda(async_client: AsyncClient, db_session: Session):
    create_paper_and_record(db_session, "p1", "r1", comp_strength=18.0)
    await async_client.post("/api/datasets/eda", json={})

    response = await async_client.get("/api/datasets/eda/latest")
    assert response.status_code == 200
    data = response.json()
    assert data["sample_summary"]["evaluated_records_count"] == 1


@pytest.mark.asyncio
async def test_api_get_analysis_by_id(async_client: AsyncClient, db_session: Session):
    create_paper_and_record(db_session, "p1", "r1")
    post_res = await async_client.post("/api/datasets/eda", json={})
    analysis_id = post_res.json()["analysis_id"]

    get_res = await async_client.get(f"/api/datasets/eda/{analysis_id}")
    assert get_res.status_code == 200
    assert get_res.json()["analysis_id"] == analysis_id


@pytest.mark.asyncio
async def test_api_get_analysis_not_found(async_client: AsyncClient):
    response = await async_client.get("/api/datasets/eda/nonexistent_id")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_api_get_readiness_overview(async_client: AsyncClient, db_session: Session):
    response = await async_client.get("/api/datasets/readiness")
    assert response.status_code == 200
    data = response.json()
    assert "compressive_strength" in data
    assert "water_absorption" in data
    assert data["compressive_strength"]["readiness_status"] in [
        "ready_for_evaluation",
        "preliminary_limited_evidence",
        "unsupported_insufficient_data",
    ]
