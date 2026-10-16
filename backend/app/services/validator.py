"""Scientific data validation and normalization service for experimental fly ash brick data.

Adheres strictly to PLAN.md Section 11 (Phase 4):
- Layered separation between raw evidence, candidate values, reviewed canonical values,
  validation findings, derived/normalized values, and model-readiness eligibility.
- Preserves original reported values without destructive overwrites or zero-fabrication.
- Traceable conversion registry for units, mass basis, and water/binder ratios.
- Evidence-based findings aligned with civil engineering standards (IS 12894:2002, IS 3812 Part 1).
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy import select, and_
from sqlalchemy.orm import Session

from backend.app.persistence.models import (
    ExperimentalRecord,
    Paper,
    ValidationRun,
    ValidationFinding,
    gen_run_id,
    gen_finding_id,
)
from backend.app.schemas.validation import NormalizationResponse

VALIDATION_RULE_VERSION = "v1.0.0-rules"
CANONICAL_SCHEMA_VERSION = "v1.0.0-canonical"

# Controlled Unit Conversion Registry
STRENGTH_CONVERSION_TO_MPA = {
    "mpa": 1.0,
    "n/mm2": 1.0,
    "n/mm^2": 1.0,
    "psi": 0.006894757,
    "kgf/cm2": 0.0980665,
    "kg/cm2": 0.0980665,
    "kgf/cm^2": 0.0980665,
    "bar": 0.1,
    "kpa": 0.001,
}

DENSITY_CONVERSION_TO_KG_M3 = {
    "kg/m3": 1.0,
    "kg/m^3": 1.0,
    "g/cm3": 1000.0,
    "g/cc": 1000.0,
    "g/cm^3": 1000.0,
}

PRESSURE_CONVERSION_TO_MPA = {
    "mpa": 1.0,
    "n/mm2": 1.0,
    "bar": 0.1,
    "psi": 0.006894757,
}


def convert_unit(value: float, unit_str: Optional[str], conversion_table: Dict[str, float]) -> Tuple[Optional[float], Optional[str], Optional[str]]:
    """Converts a numeric value to canonical unit using controlled conversion table.
    
    Returns:
        (converted_value, canonical_unit, rule_applied)
    """
    if unit_str is None or not unit_str.strip():
        return value, None, None
    clean = unit_str.strip().lower()
    if clean in conversion_table:
        factor = conversion_table[clean]
        converted = round(value * factor, 4)
        return converted, "MPa" if conversion_table is STRENGTH_CONVERSION_TO_MPA else "kg/m³", f"factor_{factor}"
    return None, None, None


def validate_and_normalize_record(record: ExperimentalRecord, db_session: Session) -> Tuple[ValidationRun, List[ValidationFinding]]:
    """Executes deterministic scientific validation and normalization for an experimental record.
    
    Produces a versioned ValidationRun and granular ValidationFinding items.
    Does NOT modify the original ExperimentalRecord in place.
    """
    findings: List[ValidationFinding] = []
    run_id = gen_run_id()
    record_id = record.record_id
    now = datetime.now(timezone.utc)

    def add_finding(
        rule_id: str,
        severity: str,
        finding_code: str,
        message: str,
        field_name: Optional[str] = None,
        original_value: Optional[Any] = None,
        original_unit: Optional[str] = None,
        normalized_value: Optional[Any] = None,
        normalized_unit: Optional[str] = None,
        evidence_rationale: Optional[str] = None,
        suggested_action: Optional[str] = None,
    ):
        findings.append(
            ValidationFinding(
                finding_id=gen_finding_id(),
                run_id=run_id,
                record_id=record_id,
                rule_id=rule_id,
                severity=severity,
                finding_code=finding_code,
                message=message,
                field_name=field_name,
                original_value=str(original_value) if original_value is not None else None,
                original_unit=original_unit,
                normalized_value=str(normalized_value) if normalized_value is not None else None,
                normalized_unit=normalized_unit,
                evidence_rationale=evidence_rationale,
                suggested_action=suggested_action,
                created_at=now,
            )
        )

    # =========================================================================
    # A. Structural & Provenance Checks (STRUCT_*)
    # =========================================================================
    # 1. Foreign key paper verification
    paper = db_session.get(Paper, record.paper_id)
    if not paper:
        add_finding(
            rule_id="STRUCT_001",
            severity="error",
            finding_code="INVALID_FOREIGN_KEY_PAPER",
            message=f"Referenced paper_id '{record.paper_id}' does not exist in literature registry.",
            field_name="paper_id",
            original_value=record.paper_id,
            suggested_action="Link to an existing registered paper in the paper registry.",
        )

    # 2. Source-location provenance
    has_location = bool(record.source_page or record.source_table_or_figure or record.source_excerpt_or_cell_reference)
    if not has_location:
        add_finding(
            rule_id="STRUCT_002",
            severity="warning",
            finding_code="MISSING_SOURCE_LOCATION_PROVENANCE",
            message="Record lacks specific source page, table, figure, or excerpt reference.",
            suggested_action="Provide source page or table number from the primary publication.",
        )

    # 3. Schema version verification
    if record.schema_version != CANONICAL_SCHEMA_VERSION:
        add_finding(
            rule_id="STRUCT_003",
            severity="warning",
            finding_code="SCHEMA_VERSION_MISMATCH",
            message=f"Record schema version '{record.schema_version}' differs from canonical '{CANONICAL_SCHEMA_VERSION}'.",
            field_name="schema_version",
            original_value=record.schema_version,
            normalized_value=CANONICAL_SCHEMA_VERSION,
        )

    # 4. Review status validity
    valid_statuses = {"candidate", "needs_review", "accepted", "rejected"}
    if record.review_status not in valid_statuses:
        add_finding(
            rule_id="STRUCT_004",
            severity="error",
            finding_code="INVALID_REVIEW_STATUS",
            message=f"Review status '{record.review_status}' is not in approved state transitions: {sorted(valid_statuses)}.",
            field_name="review_status",
            original_value=record.review_status,
        )

    # 5. Non-negative constraints
    numeric_fields = [
        ("fly_ash_fraction", record.fly_ash_fraction),
        ("cement_fraction", record.cement_fraction),
        ("lime_fraction", record.lime_fraction),
        ("gypsum_fraction", record.gypsum_fraction),
        ("sand_fraction", record.sand_fraction),
        ("quarry_dust_fraction", record.quarry_dust_fraction),
        ("stone_dust_fraction", record.stone_dust_fraction),
        ("water_content_or_ratio", record.water_content_or_ratio),
        ("compaction_pressure_mpa", record.compaction_pressure_mpa),
        ("density_kg_m3", record.density_kg_m3),
        ("compressive_strength_mpa", record.compressive_strength_mpa),
        ("water_absorption_pct", record.water_absorption_pct),
    ]
    for fn, val in numeric_fields:
        if val is not None and val < 0.0:
            add_finding(
                rule_id="STRUCT_005",
                severity="error",
                finding_code="NEGATIVE_PHYSICAL_VALUE",
                message=f"Physical parameter '{fn}' has invalid negative value: {val}.",
                field_name=fn,
                original_value=val,
                evidence_rationale="Physical mass fractions, pressures, and mechanical properties cannot be negative.",
            )

    # 6. Potential duplicate record detection
    dup_stmt = select(ExperimentalRecord).where(
        and_(
            ExperimentalRecord.paper_id == record.paper_id,
            ExperimentalRecord.record_id != record.record_id,
            ExperimentalRecord.fly_ash_fraction == record.fly_ash_fraction,
            ExperimentalRecord.cement_fraction == record.cement_fraction,
            ExperimentalRecord.lime_fraction == record.lime_fraction,
            ExperimentalRecord.gypsum_fraction == record.gypsum_fraction,
            ExperimentalRecord.sand_fraction == record.sand_fraction,
            ExperimentalRecord.curing_duration_days == record.curing_duration_days,
            ExperimentalRecord.compressive_strength_mpa == record.compressive_strength_mpa,
        )
    )
    dup_match = db_session.execute(dup_stmt).scalars().first()
    if dup_match:
        add_finding(
            rule_id="STRUCT_006",
            severity="warning",
            finding_code="POTENTIAL_DUPLICATE_RECORD",
            message=f"Identical formulation and strength found in record '{dup_match.record_id}' within the same paper.",
            suggested_action="Review whether this is a duplicate ingestion or a distinct experimental specimen.",
        )

    # =========================================================================
    # B. Unit Validation & Conversion Registry (UNIT_*)
    # =========================================================================
    normalized_values: Dict[str, Any] = {}
    conversions_applied: List[Dict[str, Any]] = []

    # Compressive strength unit check
    if record.compressive_strength_mpa is not None:
        normalized_values["compressive_strength_mpa"] = record.compressive_strength_mpa
        normalized_values["compressive_strength_unit"] = "MPa"

    # Water absorption unit check
    if record.water_absorption_pct is not None:
        normalized_values["water_absorption_pct"] = record.water_absorption_pct
        normalized_values["water_absorption_unit"] = "%"

    # Check raw_reported_values for unstandardized units needing conversion
    if record.raw_reported_values and isinstance(record.raw_reported_values, dict):
        raw_strength_unit = record.raw_reported_values.get("strength_unit")
        raw_strength_val = record.raw_reported_values.get("strength_val")
        if raw_strength_unit and raw_strength_val is not None:
            try:
                numeric_val = float(raw_strength_val)
                conv_val, conv_unit, rule = convert_unit(numeric_val, str(raw_strength_unit), STRENGTH_CONVERSION_TO_MPA)
                if conv_val is not None:
                    conversions_applied.append(
                        {
                            "field": "compressive_strength_mpa",
                            "from_unit": str(raw_strength_unit),
                            "to_unit": conv_unit,
                            "original_value": numeric_val,
                            "converted_value": conv_val,
                            "rule": rule,
                        }
                    )
                    normalized_values["compressive_strength_mpa"] = conv_val
                else:
                    add_finding(
                        rule_id="UNIT_001",
                        severity="warning",
                        finding_code="UNSUPPORTED_STRENGTH_UNIT",
                        message=f"Strength unit '{raw_strength_unit}' is ambiguous or unsupported in conversion registry.",
                        field_name="compressive_strength_mpa",
                        original_value=raw_strength_val,
                        original_unit=str(raw_strength_unit),
                    )
            except (ValueError, TypeError):
                pass

    # =========================================================================
    # C. Composition & Mass-Basis Checks (COMP_*)
    # =========================================================================
    constituents = {
        "fly_ash_fraction": record.fly_ash_fraction,
        "cement_fraction": record.cement_fraction,
        "lime_fraction": record.lime_fraction,
        "gypsum_fraction": record.gypsum_fraction,
        "sand_fraction": record.sand_fraction,
        "quarry_dust_fraction": record.quarry_dust_fraction,
        "stone_dust_fraction": record.stone_dust_fraction,
    }

    norm_constituents: Dict[str, Optional[float]] = {}
    basis = (record.mix_basis or "dry_mass_fraction").strip().lower()

    if basis == "percentage":
        # Proportions explicitly declared as percentages (0-100%)
        has_invalid_pct = False
        for k, v in constituents.items():
            if v is not None:
                if 0.0 <= v <= 100.0:
                    norm_constituents[k] = round(v / 100.0, 4)
                else:
                    has_invalid_pct = True
                    norm_constituents[k] = None
                    add_finding(
                        rule_id="COMP_001",
                        severity="error",
                        finding_code="INVALID_PERCENTAGE_VALUE",
                        message=f"Constituent '{k}' has value {v} outside valid percentage range [0, 100].",
                        field_name=k,
                        original_value=v,
                    )
            else:
                norm_constituents[k] = None

        if not has_invalid_pct and any(v is not None for v in norm_constituents.values()):
            add_finding(
                rule_id="COMP_001",
                severity="info",
                finding_code="PERCENTAGE_BASIS_CONVERTED_TO_FRACTION",
                message="Reported proportions explicitly specified on 'percentage' basis; converted to decimal fractions for derived mass calculations.",
                evidence_rationale="Canonical schema standardizes constituent proportions as decimal dry mass fractions (0.0-1.0).",
            )

    elif basis == "dry_mass_fraction":
        # Proportions declared as decimal fractions (0.0-1.0)
        has_ambiguous_value = False
        for k, v in constituents.items():
            if v is not None:
                if 0.0 <= v <= 1.0:
                    norm_constituents[k] = v
                else:
                    # Value exceeds 1.0 under dry_mass_fraction: do NOT silently convert!
                    has_ambiguous_value = True
                    norm_constituents[k] = None
                    add_finding(
                        rule_id="COMP_001",
                        severity="warning",
                        finding_code="AMBIGUOUS_FRACTION_VALUE_EXCEEDS_UNITY",
                        message=f"Constituent '{k}' has value {v} > 1.0 under mix_basis 'dry_mass_fraction'. Value is ambiguous or contradictory; not assumed to be percentage without explicit basis notation.",
                        field_name=k,
                        original_value=v,
                        suggested_action="Verify if the publication mix table was reported in weight percent or batch weights.",
                    )
            else:
                norm_constituents[k] = None

    else:
        # Non-fractional or unstandardized mix basis (e.g. mass_ratio, volume_fraction, batch_weight, unknown)
        norm_constituents = {k: None for k in constituents}
        add_finding(
            rule_id="COMP_001",
            severity="info",
            finding_code="COMP_BASIS_NON_FRACTIONAL_OR_UNSTANDARDIZED",
            message=f"Mix basis is '{record.mix_basis or 'unspecified'}'. Stoichiometric dry mass summation cannot be evaluated on non-fractional or unstandardized basis.",
            field_name="mix_basis",
            original_value=record.mix_basis,
        )

    normalized_values["constituents"] = norm_constituents

    # Count specified solid constituents
    specified_constituents = {k: v for k, v in norm_constituents.items() if v is not None}
    dry_mass_total: Optional[float] = None
    dry_mass_balance_status: str = "indeterminate"

    if len(specified_constituents) == 0:
        if basis in {"dry_mass_fraction", "percentage"}:
            add_finding(
                rule_id="COMP_002",
                severity="error",
                finding_code="NO_CONSTITUENTS_SPECIFIED",
                message="No valid solid mix constituent proportions are specified in this record.",
            )
    elif len(specified_constituents) < 2:
        dry_mass_balance_status = "indeterminate"
        add_finding(
            rule_id="COMP_003",
            severity="warning",
            finding_code="INCOMPLETE_COMPOSITION_INDETERMINATE",
            message=f"Only {len(specified_constituents)} constituent specified ({list(specified_constituents.keys())}). Mass balance cannot be reliably calculated and is marked indeterminate.",
            evidence_rationale="Fly ash masonry mixes require at least binder and aggregate/filler to form a coherent matrix.",
        )
    elif basis in {"dry_mass_fraction", "percentage"}:
        # Calculate sum of specified solid fractions
        total_sum = sum(specified_constituents.values())
        dry_mass_total = round(total_sum, 4)
        normalized_values["dry_mass_total"] = dry_mass_total

        # Nominal mass balance check (0.95 - 1.05 tolerance)
        if 0.95 <= total_sum <= 1.05:
            dry_mass_balance_status = "nominal"
            add_finding(
                rule_id="COMP_004",
                severity="info",
                finding_code="DRY_MASS_SUM_NOMINAL_CONSISTENT",
                message=f"Sum of reported solid fractions is {dry_mass_total:.4f}. This satisfies nominal batch mass balance (within +/- 5% tolerance, accommodating minor inert trace elements, loss-on-ignition, or moisture adjustments), but does not substitute for chemical or pozzolanic reactivity verification.",
                evidence_rationale="IS 12894:2002 dry batch proportions nominally sum to 100% mass balance.",
            )
        elif total_sum < 0.95:
            dry_mass_balance_status = "under_sum"
            add_finding(
                rule_id="COMP_005",
                severity="warning",
                finding_code="DRY_MASS_TOTAL_UNDER_SUM",
                message=f"Sum of reported dry fractions is {dry_mass_total:.4f} (< 0.95). Incomplete formulation or unspecified filler/aggregate content.",
                suggested_action="Verify whether sand, quarry dust, or water was omitted from the reported mix table.",
            )
        else:
            dry_mass_balance_status = "over_sum"
            add_finding(
                rule_id="COMP_006",
                severity="warning",
                finding_code="DRY_MASS_TOTAL_OVER_SUM",
                message=f"Sum of reported dry fractions is {dry_mass_total:.4f} (> 1.05). Proportions exceed 100% mass balance.",
                suggested_action="Check if components represent ratios rather than mass fractions.",
            )

    normalized_values["dry_mass_balance_status"] = dry_mass_balance_status

    # =========================================================================
    # D. Water & Binder Information (WATER_*)
    # =========================================================================
    derived_wb: Optional[float] = None

    # Compute binder fraction based on material system
    fa_norm = norm_constituents.get("fly_ash_fraction") or 0.0
    lime_norm = norm_constituents.get("lime_fraction") or 0.0
    gypsum_norm = norm_constituents.get("gypsum_fraction") or 0.0
    cement_norm = norm_constituents.get("cement_fraction") or 0.0

    if record.material_system == "fly_ash_lime_gypsum_brick":
        binder_fraction = fa_norm + lime_norm + gypsum_norm
    elif record.material_system == "fly_ash_cement_brick":
        binder_fraction = fa_norm + cement_norm
    else:
        binder_fraction = fa_norm

    if record.water_content_or_ratio is not None:
        wb_basis = (record.water_basis or "").strip().lower()
        if wb_basis == "water_binder_ratio":
            derived_wb = round(record.water_content_or_ratio, 4)
        elif wb_basis == "percentage_of_dry_mix":
            if binder_fraction > 0.05:
                derived_wb = round((record.water_content_or_ratio / 100.0) / binder_fraction, 4)
                add_finding(
                    rule_id="WATER_002",
                    severity="info",
                    finding_code="DERIVED_WATER_BINDER_RATIO",
                    message=f"Calculated water/binder ratio {derived_wb:.4f} from reported water % of dry mix ({record.water_content_or_ratio}%) and binder fraction ({binder_fraction:.4f}).",
                    field_name="water_content_or_ratio",
                    original_value=record.water_content_or_ratio,
                    normalized_value=derived_wb,
                )
            else:
                add_finding(
                    rule_id="WATER_003",
                    severity="warning",
                    finding_code="AMBIGUOUS_WATER_BINDER_CALCULATION",
                    message="Water is reported as percentage of dry mix, but binder fraction is indeterminate. w/b ratio cannot be calculated.",
                )
        else:
            add_finding(
                rule_id="WATER_005",
                severity="warning",
                finding_code="AMBIGUOUS_WATER_BASIS",
                message=f"Water basis '{record.water_basis}' is unrecognized or ambiguous. w/b ratio is retained as null.",
            )
    else:
        add_finding(
            rule_id="WATER_004",
            severity="info",
            finding_code="WATER_CONTENT_UNREPORTED",
            message="Water content or w/b ratio was not reported in the primary source. Retained as null (no zero-fabrication).",
        )

    normalized_values["derived_water_binder_ratio"] = derived_wb

    # =========================================================================
    # E. Performance Target Checks (PERF_*)
    # =========================================================================
    # Compressive strength
    cs = record.compressive_strength_mpa
    if cs is None:
        add_finding(
            rule_id="PERF_001",
            severity="warning",
            finding_code="MISSING_PRIMARY_TARGET_STRENGTH",
            message="Record lacks primary target compressive strength (MPa).",
            field_name="compressive_strength_mpa",
        )
    elif cs < 0.0:
        pass  # Caught in STRUCT_005
    elif cs > 150.0:
        add_finding(
            rule_id="PERF_002",
            severity="warning",
            finding_code="UNUSUALLY_HIGH_STRENGTH",
            message=f"Compressive strength of {cs} MPa is exceptionally high for masonry bricks.",
            field_name="compressive_strength_mpa",
            original_value=cs,
            evidence_rationale="Unreinforced commercial fly ash masonry bricks rarely exceed 50 MPa without autoclaving.",
        )
    elif cs < 3.5:
        add_finding(
            rule_id="PERF_003",
            severity="info",
            finding_code="IS12894_REFERENCE_CLASS_BENCHMARK",
            message=f"Reference benchmark comparison: Compressive strength of {cs} MPa is below 3.5 MPa. For context, IS 12894:2002 Clause 4.1 designates Class 3.5 (minimum 3.5 MPa at 28 days under IS 3495 Part 1) as the baseline commercial masonry brick class. This is an informational reference comparison and does not assert regulatory non-compliance unless formal IS 12894 conformity testing is documented.",
            field_name="compressive_strength_mpa",
            original_value=cs,
            evidence_rationale="IS 12894:2002 Clause 4.1 defines Class 3.5 as lowest designated structural class.",
        )

    # Water absorption
    wa = record.water_absorption_pct
    if wa is not None:
        if wa > 50.0:
            add_finding(
                rule_id="PERF_004",
                severity="warning",
                finding_code="UNUSUALLY_HIGH_WATER_ABSORPTION",
                message=f"Water absorption of {wa}% is unusually high; indicates porous or uncompacted matrix.",
                field_name="water_absorption_pct",
                original_value=wa,
            )
        elif wa > 20.0:
            add_finding(
                rule_id="PERF_005",
                severity="info",
                finding_code="IS12894_REFERENCE_WATER_ABSORPTION_BENCHMARK",
                message=f"Reference benchmark comparison: Reported water absorption of {wa}% exceeds 20.0%. For context, IS 12894:2002 Clause 7.2 specifies a 20.0% maximum threshold for 24-hour cold immersion (tested as per IS 3495 Part 2). This is an informational reference benchmark.",
                field_name="water_absorption_pct",
                original_value=wa,
                evidence_rationale="IS 12894:2002 Clause 7.2 specifies maximum 20% water absorption by mass after 24h immersion.",
            )

    # Curing duration
    if record.curing_duration_days is None:
        add_finding(
            rule_id="PERF_006",
            severity="warning",
            finding_code="MISSING_CURING_DURATION",
            message="Curing duration is not specified. Pozzolanic reactions require known curing age.",
            field_name="curing_duration_days",
        )

    # =========================================================================
    # F. Material-System Compatibility (MAT_*)
    # =========================================================================
    if record.material_system == "fly_ash_lime_gypsum_brick":
        fa_val = record.fly_ash_fraction
        if fa_val is None or fa_val <= 0.0:
            add_finding(
                rule_id="MAT_001",
                severity="error",
                finding_code="MISSING_FLY_ASH_IN_FALG",
                message="FaL-G material system requires fly ash proportion > 0.",
                field_name="fly_ash_fraction",
            )
        l_val = record.lime_fraction
        c_val = record.cement_fraction
        if (l_val is None or l_val <= 0.0) and (c_val is None or c_val <= 0.0):
            add_finding(
                rule_id="MAT_002",
                severity="warning",
                finding_code="MISSING_ACTIVATOR_IN_FALG",
                message="FaL-G material system has neither lime nor cement activator specified.",
                evidence_rationale="Fly ash pozzolanic reaction requires calcium hydroxide (lime) or OPC activator.",
            )
    elif record.material_system not in {
        "fly_ash_lime_gypsum_brick",
        "fly_ash_cement_brick",
        "geopolymer_brick",
        "fly_ash_clay_brick",
        "soil_stabilized_brick",
    }:
        add_finding(
            rule_id="MAT_004",
            severity="info",
            finding_code="UNVERIFIED_OR_CUSTOM_MATERIAL_SYSTEM",
            message=f"Material system '{record.material_system}' is not one of the standard baseline systems; system-specific binder heuristics will not be applied without explicit domain specification.",
            field_name="material_system",
            original_value=record.material_system,
        )

    # =========================================================================
    # G. Target-Specific Model-Readiness Eligibility Decision
    # =========================================================================
    has_errors = any(f.severity == "error" for f in findings)
    has_warnings = any(f.severity == "warning" for f in findings)

    if has_errors:
        status = "failed"
    elif has_warnings:
        status = "passed_with_warnings"
    else:
        status = "passed"

    # Base conditions required for all model training:
    base_eligible = (
        not has_errors
        and record.review_status == "accepted"
        and record.value_origin != "synthetic"
        and paper is not None
        and has_location
        and (record.fly_ash_fraction is not None and record.fly_ash_fraction > 0)
    )

    is_eligible_cs = base_eligible and (record.compressive_strength_mpa is not None and record.compressive_strength_mpa > 0)
    is_eligible_wa = base_eligible and (record.water_absorption_pct is not None and record.water_absorption_pct > 0)
    is_eligible = is_eligible_cs or is_eligible_wa

    summary_text = (
        f"Validation {status}: {len(findings)} findings "
        f"({sum(1 for f in findings if f.severity == 'error')} errors, "
        f"{sum(1 for f in findings if f.severity == 'warning')} warnings, "
        f"{sum(1 for f in findings if f.severity == 'info')} info). "
        f"Model ready eligible: {is_eligible} (CS: {is_eligible_cs}, WA: {is_eligible_wa})."
    )

    run = ValidationRun(
        run_id=run_id,
        record_id=record_id,
        rule_version=VALIDATION_RULE_VERSION,
        schema_version=CANONICAL_SCHEMA_VERSION,
        status=status,
        is_eligible_for_model_ready=is_eligible,
        is_eligible_for_compressive_strength=is_eligible_cs,
        is_eligible_for_water_absorption=is_eligible_wa,
        normalized_values=normalized_values,
        summary=summary_text,
        created_at=now,
    )

    return run, findings


def build_normalization_response(
    record: ExperimentalRecord,
    run: ValidationRun,
) -> NormalizationResponse:
    """Builds a structured NormalizationResponse from record and validation run."""
    norm_vals = run.normalized_values or {}
    orig_vals = {
        "fly_ash_fraction": record.fly_ash_fraction,
        "cement_fraction": record.cement_fraction,
        "lime_fraction": record.lime_fraction,
        "gypsum_fraction": record.gypsum_fraction,
        "sand_fraction": record.sand_fraction,
        "quarry_dust_fraction": record.quarry_dust_fraction,
        "stone_dust_fraction": record.stone_dust_fraction,
        "water_content_or_ratio": record.water_content_or_ratio,
        "water_basis": record.water_basis,
        "mix_basis": record.mix_basis,
        "compressive_strength_mpa": record.compressive_strength_mpa,
        "water_absorption_pct": record.water_absorption_pct,
        "curing_duration_days": record.curing_duration_days,
    }

    return NormalizationResponse(
        record_id=record.record_id,
        run_id=run.run_id,
        original_values=orig_vals,
        normalized_values=norm_vals,
        conversions_applied=norm_vals.get("conversions", []),
        dry_mass_total=norm_vals.get("dry_mass_total"),
        dry_mass_balance_status=norm_vals.get("dry_mass_balance_status", "indeterminate"),
        derived_water_binder_ratio=norm_vals.get("derived_water_binder_ratio"),
        is_eligible_for_model_ready=run.is_eligible_for_model_ready,
        is_eligible_for_compressive_strength=run.is_eligible_for_compressive_strength,
        is_eligible_for_water_absorption=run.is_eligible_for_water_absorption,
    )
