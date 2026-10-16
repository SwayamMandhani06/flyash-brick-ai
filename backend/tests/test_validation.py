import pytest
from httpx import AsyncClient
from sqlalchemy.orm import Session

from backend.app.persistence.models import ExperimentalRecord, Paper, ValidationRun
from backend.app.persistence.repositories import PaperRepository, RecordRepository, ValidationRepository
from backend.app.services.validator import validate_and_normalize_record, convert_unit, STRENGTH_CONVERSION_TO_MPA


@pytest.fixture
def sample_paper(db_session: Session) -> Paper:
    paper = Paper(
        title="Experimental Study on Fly Ash Lime Gypsum Bricks",
        authors="Sharma, R., and Kumar, A.",
        journal="Journal of Sustainable Construction",
        publication_year=2021,
        doi_or_url="10.1016/j.jsc.2021.05.001",
        material_system="fly_ash_lime_gypsum_brick",
    )
    return PaperRepository.create(db_session, paper)


@pytest.fixture
def nominal_record(db_session: Session, sample_paper: Paper) -> ExperimentalRecord:
    rec = ExperimentalRecord(
        paper_id=sample_paper.paper_id,
        source_title=sample_paper.title,
        source_page="142",
        source_table_or_figure="Table 2",
        material_system="fly_ash_lime_gypsum_brick",
        fly_ash_fraction=0.60,
        lime_fraction=0.10,
        gypsum_fraction=0.05,
        sand_fraction=0.25,
        water_content_or_ratio=0.22,
        water_basis="water_binder_ratio",
        curing_duration_days=28,
        compressive_strength_mpa=8.5,
        water_absorption_pct=14.2,
        review_status="accepted",
        value_origin="literature_extracted",
    )
    return RecordRepository.create(db_session, rec, reviewer="test_curator", reason="Verified fixture")


# ---------------------------------------------------------------------------
# 1. Structural & Provenance Checks
# ---------------------------------------------------------------------------

def test_structural_validation_clean_record(db_session: Session, nominal_record: ExperimentalRecord):
    """Verifies that a well-formed accepted record passes validation and is model-ready eligible."""
    run, findings = validate_and_normalize_record(nominal_record, db_session)
    assert run.status == "passed"
    assert run.is_eligible_for_model_ready is True
    assert run.is_eligible_for_compressive_strength is True
    assert run.is_eligible_for_water_absorption is True
    assert run.rule_version == "v1.0.0-rules"
    assert any(f.finding_code == "DRY_MASS_SUM_NOMINAL_CONSISTENT" for f in findings)


def test_missing_paper_foreign_key_fails(db_session: Session):
    """Verifies that a record referencing a non-existent paper is flagged with an error."""
    rec = ExperimentalRecord(
        paper_id="non_existent_paper_id",
        source_page="10",
        material_system="fly_ash_lime_gypsum_brick",
        fly_ash_fraction=0.60,
        sand_fraction=0.40,
        compressive_strength_mpa=5.0,
        review_status="candidate",
    )
    run, findings = validate_and_normalize_record(rec, db_session)
    assert run.status == "failed"
    assert run.is_eligible_for_model_ready is False
    assert run.is_eligible_for_compressive_strength is False
    assert any(f.finding_code == "INVALID_FOREIGN_KEY_PAPER" and f.severity == "error" for f in findings)


def test_negative_values_trigger_errors(db_session: Session, sample_paper: Paper):
    """Verifies that physical non-negativity constraints trigger error-level findings."""
    rec = ExperimentalRecord(
        paper_id=sample_paper.paper_id,
        source_page="15",
        material_system="fly_ash_lime_gypsum_brick",
        fly_ash_fraction=-0.10,
        compressive_strength_mpa=-4.2,
        review_status="candidate",
    )
    run, findings = validate_and_normalize_record(rec, db_session)
    assert run.status == "failed"
    error_codes = [f.finding_code for f in findings if f.severity == "error"]
    assert "NEGATIVE_PHYSICAL_VALUE" in error_codes


def test_potential_duplicate_detection_without_deletion(db_session: Session, sample_paper: Paper, nominal_record: ExperimentalRecord):
    """Verifies that duplicate formulations within the same paper generate warnings without silent deletion."""
    dup_rec = ExperimentalRecord(
        paper_id=sample_paper.paper_id,
        source_page="145",
        material_system="fly_ash_lime_gypsum_brick",
        fly_ash_fraction=nominal_record.fly_ash_fraction,
        cement_fraction=nominal_record.cement_fraction,
        lime_fraction=nominal_record.lime_fraction,
        gypsum_fraction=nominal_record.gypsum_fraction,
        sand_fraction=nominal_record.sand_fraction,
        curing_duration_days=nominal_record.curing_duration_days,
        compressive_strength_mpa=nominal_record.compressive_strength_mpa,
        review_status="candidate",
    )
    dup_created = RecordRepository.create(db_session, dup_rec, reviewer="test", reason="Duplicate test")

    run, findings = validate_and_normalize_record(dup_created, db_session)
    dup_warnings = [f for f in findings if f.finding_code == "POTENTIAL_DUPLICATE_RECORD"]
    assert len(dup_warnings) == 1
    assert nominal_record.record_id in dup_warnings[0].message
    # Both records still exist in database
    assert db_session.get(ExperimentalRecord, nominal_record.record_id) is not None
    assert db_session.get(ExperimentalRecord, dup_created.record_id) is not None


# ---------------------------------------------------------------------------
# 2. Unit Conversions & Conversion Registry
# ---------------------------------------------------------------------------

def test_unit_conversion_registry_precision():
    """Tests accuracy of mathematical unit conversions."""
    # 1000 psi to MPa
    val_mpa, unit, rule = convert_unit(1000.0, "psi", STRENGTH_CONVERSION_TO_MPA)
    assert val_mpa == 6.8948
    assert unit == "MPa"

    # 100 kgf/cm² to MPa (100 * 0.0980665 = 9.80665 -> 9.8066)
    val_mpa_kg, _, _ = convert_unit(100.0, "kgf/cm2", STRENGTH_CONVERSION_TO_MPA)
    assert val_mpa_kg == pytest.approx(9.8066, abs=1e-4)

    # 10 N/mm² to MPa (1:1 equivalence)
    val_n_mm2, _, _ = convert_unit(10.0, "n/mm2", STRENGTH_CONVERSION_TO_MPA)
    assert val_n_mm2 == 10.0


def test_unit_conversion_from_raw_reported_values(db_session: Session, sample_paper: Paper):
    """Verifies that non-standard strength units reported in raw extraction are converted cleanly."""
    rec = ExperimentalRecord(
        paper_id=sample_paper.paper_id,
        source_page="55",
        material_system="fly_ash_lime_gypsum_brick",
        fly_ash_fraction=0.50,
        lime_fraction=0.15,
        sand_fraction=0.35,
        compressive_strength_mpa=13.79,
        raw_reported_values={"strength_val": "2000", "strength_unit": "psi"},
        review_status="accepted",
        value_origin="literature_extracted",
    )
    run, findings = validate_and_normalize_record(rec, db_session)
    norm = run.normalized_values or {}
    assert norm["compressive_strength_mpa"] == 13.7895  # 2000 * 0.006894757
    assert norm["compressive_strength_unit"] == "MPa"


# ---------------------------------------------------------------------------
# 3. Composition & Mass-Basis Checks
# ---------------------------------------------------------------------------

def test_incomplete_composition_marked_indeterminate(db_session: Session, sample_paper: Paper):
    """Verifies that incomplete compositions are not assumed zero and are marked indeterminate."""
    rec = ExperimentalRecord(
        paper_id=sample_paper.paper_id,
        source_page="88",
        material_system="fly_ash_lime_gypsum_brick",
        fly_ash_fraction=0.60,
        # aggregates and binder missing
        compressive_strength_mpa=6.0,
        review_status="candidate",
    )
    run, findings = validate_and_normalize_record(rec, db_session)
    assert any(f.finding_code == "INCOMPLETE_COMPOSITION_INDETERMINATE" for f in findings)
    norm = run.normalized_values or {}
    assert norm.get("dry_mass_total") is None
    assert norm.get("dry_mass_balance_status") == "indeterminate"


def test_over_sum_mass_balance_flagged(db_session: Session, sample_paper: Paper):
    """Verifies that compositions exceeding 100% mass balance generate an explicit warning."""
    rec = ExperimentalRecord(
        paper_id=sample_paper.paper_id,
        source_page="90",
        material_system="fly_ash_lime_gypsum_brick",
        mix_basis="dry_mass_fraction",
        fly_ash_fraction=0.70,
        lime_fraction=0.20,
        sand_fraction=0.30,  # Total = 1.20 (120%)
        compressive_strength_mpa=7.5,
        review_status="candidate",
    )
    run, findings = validate_and_normalize_record(rec, db_session)
    assert any(f.finding_code == "DRY_MASS_TOTAL_OVER_SUM" for f in findings)
    norm = run.normalized_values or {}
    assert norm.get("dry_mass_total") == 1.20
    assert norm.get("dry_mass_balance_status") == "over_sum"


def test_percentage_basis_normalized_without_in_place_overwrite(db_session: Session, sample_paper: Paper):
    """Verifies that explicit percentage basis converts to fractions in derived output without overwriting source."""
    rec = ExperimentalRecord(
        paper_id=sample_paper.paper_id,
        source_page="95",
        material_system="fly_ash_lime_gypsum_brick",
        mix_basis="percentage",  # Explicit basis
        fly_ash_fraction=60.0,
        lime_fraction=10.0,
        sand_fraction=30.0,
        compressive_strength_mpa=8.0,
        review_status="candidate",
    )
    run, findings = validate_and_normalize_record(rec, db_session)
    assert any(f.finding_code == "PERCENTAGE_BASIS_CONVERTED_TO_FRACTION" for f in findings)
    norm = run.normalized_values or {}
    constituents = norm.get("constituents", {})
    assert constituents.get("fly_ash_fraction") == 0.60
    assert constituents.get("lime_fraction") == 0.10
    assert constituents.get("sand_fraction") == 0.30
    # Original record in DB retains 60.0
    assert rec.fly_ash_fraction == 60.0


def test_ambiguous_fraction_value_exceeds_unity_flagged(db_session: Session, sample_paper: Paper):
    """Verifies that values > 1.0 under dry_mass_fraction basis are NOT silently converted and are flagged as ambiguous."""
    rec = ExperimentalRecord(
        paper_id=sample_paper.paper_id,
        source_page="96",
        material_system="fly_ash_lime_gypsum_brick",
        mix_basis="dry_mass_fraction",  # Contradictory: basis is fraction, but value is 60.0
        fly_ash_fraction=60.0,
        lime_fraction=10.0,
        sand_fraction=30.0,
        compressive_strength_mpa=8.0,
        review_status="candidate",
    )
    run, findings = validate_and_normalize_record(rec, db_session)
    assert any(f.finding_code == "AMBIGUOUS_FRACTION_VALUE_EXCEEDS_UNITY" for f in findings)
    norm = run.normalized_values or {}
    constituents = norm.get("constituents", {})
    # Not silently divided by 100
    assert constituents.get("fly_ash_fraction") is None


def test_non_fractional_mix_basis_handled(db_session: Session, sample_paper: Paper):
    """Verifies that non-fractional mix basis (e.g. mass_ratio) reports mass balance as indeterminate."""
    rec = ExperimentalRecord(
        paper_id=sample_paper.paper_id,
        source_page="97",
        material_system="fly_ash_lime_gypsum_brick",
        mix_basis="mass_ratio",
        fly_ash_fraction=1.0,
        sand_fraction=2.0,
        lime_fraction=0.5,
        compressive_strength_mpa=8.0,
        review_status="candidate",
    )
    run, findings = validate_and_normalize_record(rec, db_session)
    assert any(f.finding_code == "COMP_BASIS_NON_FRACTIONAL_OR_UNSTANDARDIZED" for f in findings)
    norm = run.normalized_values or {}
    assert norm.get("dry_mass_total") is None
    assert norm.get("dry_mass_balance_status") == "indeterminate"


# ---------------------------------------------------------------------------
# 4. Water & Binder Information
# ---------------------------------------------------------------------------

def test_water_percentage_derives_water_binder_ratio(db_session: Session, sample_paper: Paper):
    """Verifies derivation of w/b when water is reported as percentage of dry mix."""
    rec = ExperimentalRecord(
        paper_id=sample_paper.paper_id,
        source_page="101",
        material_system="fly_ash_lime_gypsum_brick",
        mix_basis="dry_mass_fraction",
        fly_ash_fraction=0.50,
        lime_fraction=0.10,
        sand_fraction=0.40,
        # Binder = 0.50 + 0.10 = 0.60. Water = 12% of dry mix -> w/b = 0.12 / 0.60 = 0.20
        water_content_or_ratio=12.0,
        water_basis="percentage_of_dry_mix",
        compressive_strength_mpa=9.0,
        review_status="candidate",
    )
    run, findings = validate_and_normalize_record(rec, db_session)
    assert any(f.finding_code == "DERIVED_WATER_BINDER_RATIO" for f in findings)
    norm = run.normalized_values or {}
    assert norm.get("derived_water_binder_ratio") == 0.20


def test_unreported_water_preserved_as_null(db_session: Session, sample_paper: Paper):
    """Verifies that missing water content is not defaulted to 0.0 or arbitrarily inferred."""
    rec = ExperimentalRecord(
        paper_id=sample_paper.paper_id,
        source_page="102",
        material_system="fly_ash_lime_gypsum_brick",
        fly_ash_fraction=0.60,
        lime_fraction=0.15,
        sand_fraction=0.25,
        water_content_or_ratio=None,
        compressive_strength_mpa=7.0,
        review_status="candidate",
    )
    run, findings = validate_and_normalize_record(rec, db_session)
    assert any(f.finding_code == "WATER_CONTENT_UNREPORTED" for f in findings)
    norm = run.normalized_values or {}
    assert norm.get("derived_water_binder_ratio") is None


# ---------------------------------------------------------------------------
# 5. Performance Targets & Standards Alignment (IS 12894:2002)
# ---------------------------------------------------------------------------

def test_substandard_compressive_strength_flagged_with_is12894_evidence(db_session: Session, sample_paper: Paper):
    """Verifies that strength below 3.5 MPa is flagged with reference benchmark comparison."""
    rec = ExperimentalRecord(
        paper_id=sample_paper.paper_id,
        source_page="110",
        material_system="fly_ash_lime_gypsum_brick",
        fly_ash_fraction=0.50,
        lime_fraction=0.10,
        sand_fraction=0.40,
        compressive_strength_mpa=2.8,  # Below 3.5 MPa minimum
        review_status="candidate",
    )
    run, findings = validate_and_normalize_record(rec, db_session)
    is_findings = [f for f in findings if f.finding_code == "IS12894_REFERENCE_CLASS_BENCHMARK"]
    assert len(is_findings) == 1
    assert "IS 12894:2002" in is_findings[0].evidence_rationale
    assert is_findings[0].severity == "info"  # Informational benchmark, not error


def test_excessive_water_absorption_flagged_with_is12894_limit(db_session: Session, sample_paper: Paper):
    """Verifies that water absorption above 20% is flagged against IS 12894:2002 reference benchmark."""
    rec = ExperimentalRecord(
        paper_id=sample_paper.paper_id,
        source_page="112",
        material_system="fly_ash_lime_gypsum_brick",
        fly_ash_fraction=0.50,
        lime_fraction=0.10,
        sand_fraction=0.40,
        compressive_strength_mpa=6.0,
        water_absorption_pct=24.5,  # Exceeds 20.0% standard limit
        review_status="candidate",
    )
    run, findings = validate_and_normalize_record(rec, db_session)
    wa_findings = [f for f in findings if f.finding_code == "IS12894_REFERENCE_WATER_ABSORPTION_BENCHMARK"]
    assert len(wa_findings) == 1
    assert "20.0%" in wa_findings[0].message


# ---------------------------------------------------------------------------
# 6. Target-Specific Model-Ready Eligibility Gates
# ---------------------------------------------------------------------------

def test_unaccepted_record_cannot_be_model_ready_eligible(db_session: Session, sample_paper: Paper):
    """Verifies that unreviewed candidate records cannot be marked model-ready eligible."""
    rec = ExperimentalRecord(
        paper_id=sample_paper.paper_id,
        source_page="120",
        material_system="fly_ash_lime_gypsum_brick",
        fly_ash_fraction=0.60,
        lime_fraction=0.10,
        sand_fraction=0.30,
        compressive_strength_mpa=8.0,
        review_status="candidate",  # NOT accepted
    )
    run, _ = validate_and_normalize_record(rec, db_session)
    assert run.is_eligible_for_model_ready is False
    assert run.is_eligible_for_compressive_strength is False
    assert run.is_eligible_for_water_absorption is False


def test_synthetic_record_cannot_be_model_ready_eligible(db_session: Session, sample_paper: Paper):
    """Verifies that synthetic data is strictly excluded from model-ready eligibility."""
    rec = ExperimentalRecord(
        paper_id=sample_paper.paper_id,
        source_page="synthetic_generator",
        material_system="fly_ash_lime_gypsum_brick",
        fly_ash_fraction=0.60,
        lime_fraction=0.10,
        sand_fraction=0.30,
        compressive_strength_mpa=8.0,
        review_status="accepted",
        value_origin="synthetic",  # Synthetic origin
    )
    run, _ = validate_and_normalize_record(rec, db_session)
    assert run.is_eligible_for_model_ready is False
    assert run.is_eligible_for_compressive_strength is False


def test_target_specific_eligibility_differentiation(db_session: Session, sample_paper: Paper):
    """Verifies that a record with compressive strength but no water absorption is eligible only for CS."""
    rec = ExperimentalRecord(
        paper_id=sample_paper.paper_id,
        source_page="125",
        material_system="fly_ash_lime_gypsum_brick",
        fly_ash_fraction=0.60,
        lime_fraction=0.10,
        sand_fraction=0.30,
        compressive_strength_mpa=12.5,
        water_absorption_pct=None,  # No water absorption
        review_status="accepted",
        value_origin="literature_extracted",
    )
    run, _ = validate_and_normalize_record(rec, db_session)
    assert run.is_eligible_for_model_ready is True
    assert run.is_eligible_for_compressive_strength is True
    assert run.is_eligible_for_water_absorption is False


# ---------------------------------------------------------------------------
# 7. API Integration Endpoints
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_api_validate_record(async_client: AsyncClient, nominal_record: ExperimentalRecord):
    """Tests POST /api/records/{record_id}/validate."""
    response = await async_client.post(f"/api/records/{nominal_record.record_id}/validate")
    assert response.status_code == 200
    data = response.json()
    assert data["record_id"] == nominal_record.record_id
    assert data["status"] == "passed"
    assert data["is_eligible_for_model_ready"] is True
    assert len(data["findings"]) > 0


@pytest.mark.asyncio
async def test_api_get_validation_latest(async_client: AsyncClient, nominal_record: ExperimentalRecord):
    """Tests GET /api/records/{record_id}/validation."""
    # First validate
    await async_client.post(f"/api/records/{nominal_record.record_id}/validate")

    # Then retrieve latest run
    response = await async_client.get(f"/api/records/{nominal_record.record_id}/validation")
    assert response.status_code == 200
    data = response.json()
    assert data["record_id"] == nominal_record.record_id
    assert "findings" in data


@pytest.mark.asyncio
async def test_api_get_validation_by_run_id(async_client: AsyncClient, nominal_record: ExperimentalRecord):
    """Tests GET /api/validation/runs/{run_id}."""
    val_resp = await async_client.post(f"/api/records/{nominal_record.record_id}/validate")
    run_id = val_resp.json()["run_id"]

    response = await async_client.get(f"/api/validation/runs/{run_id}")
    assert response.status_code == 200
    assert response.json()["run_id"] == run_id


@pytest.mark.asyncio
async def test_api_normalize_record(async_client: AsyncClient, nominal_record: ExperimentalRecord):
    """Tests POST /api/records/{record_id}/normalize."""
    response = await async_client.post(f"/api/records/{nominal_record.record_id}/normalize")
    assert response.status_code == 200
    data = response.json()
    assert data["record_id"] == nominal_record.record_id
    assert data["dry_mass_balance_status"] == "nominal"
    assert data["dry_mass_total"] == 1.00
    assert data["is_eligible_for_model_ready"] is True
    assert "original_values" in data
    assert "normalized_values" in data


@pytest.mark.asyncio
async def test_api_get_normalized_record(async_client: AsyncClient, nominal_record: ExperimentalRecord):
    """Tests GET /api/records/{record_id}/normalized."""
    response = await async_client.get(f"/api/records/{nominal_record.record_id}/normalized")
    assert response.status_code == 200
    data = response.json()
    assert data["record_id"] == nominal_record.record_id
    assert data["dry_mass_total"] == 1.00


@pytest.mark.asyncio
async def test_api_validation_nonexistent_record_returns_404(async_client: AsyncClient):
    """Verifies that attempting to validate a non-existent record returns 404."""
    response = await async_client.post("/api/records/rec_nonexistent/validate")
    assert response.status_code == 404
