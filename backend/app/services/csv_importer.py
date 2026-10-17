import csv
import io
import math
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.persistence.models import ExperimentalRecord, Paper, gen_record_id
from backend.app.persistence.repositories import PaperRepository, RecordRepository
from backend.app.schemas.csv_import import CSVImportResponse, CSVImportRowResult

# Canonical CSV headers required or supported by the curation import engine
CANONICAL_CSV_COLUMNS = [
    "paper_id",
    "source_page",
    "source_table_or_figure",
    "source_excerpt_or_cell_reference",
    "experiment_group_id",
    "material_system",
    "mix_basis",
    "fly_ash_fraction",
    "lime_fraction",
    "cement_fraction",
    "gypsum_fraction",
    "sand_fraction",
    "stone_dust_fraction",
    "quarry_dust_fraction",
    "water_content_or_ratio",
    "water_basis",
    "curing_duration_days",
    "curing_temperature_c",
    "test_age_days",
    "compaction_pressure_mpa",
    "density_kg_m3",
    "compressive_strength_mpa",
    "water_absorption_pct",
    "reported_value_type",
    "specimen_count_n",
]

SUPPORTED_MATERIAL_SYSTEMS = {
    "fly_ash_lime_gypsum_brick",
    "cement_fly_ash_brick",
    "fly_ash_clay_brick",
    "geopolymer_brick",
    "soil_stabilized_brick",
}


def generate_sample_csv_template() -> str:
    """Generates a fully documented, downloadable CSV template for researcher data curation.

    Contains standard column headers and clearly marked illustrative placeholders only.
    Contains NO fabricated empirical measurements.
    """
    lines = [
        "# ==============================================================================",
        "# FLYASH INTEL — RESEARCHER-CURATED EXPERIMENTAL DATA IMPORT TEMPLATE",
        "# ==============================================================================",
        "# PROTOCOL INSTRUCTIONS:",
        "# 1. Every row MUST correspond to a verified, peer-reviewed academic publication.",
        "# 2. 'paper_id' must reference an already registered paper in the paper registry.",
        "# 3. 'source_page' or 'source_table_or_figure' is MANDATORY for provenance.",
        "# 4. Proportions: Use 'dry_mass_fraction' (decimal 0.0-1.0) or 'percentage' (0-100).",
        "# 5. Target Units: Compressive strength in MPa; water absorption in % by dry mass.",
        "# 6. Missing values: Leave cells completely BLANK. Do NOT enter 0.0 for unmeasured data.",
        "# 7. All imported records enter 'needs_review' status for human verification.",
        "# ==============================================================================",
        ",".join(CANONICAL_CSV_COLUMNS),
        "# --- ILLUSTRATIVE PLACEHOLDER (Do not import as genuine empirical evidence) ---",
        (
            "paper_example_001,"
            "Page 5,"
            "Table 3,"
            "Mix M1,"
            "Batch_A,"
            "fly_ash_lime_gypsum_brick,"
            "dry_mass_fraction,"
            "0.60,"
            "0.15,"
            "0.00,"
            "0.05,"
            "0.20,"
            ","
            ","
            "0.24,"
            "water_binder_ratio,"
            "28,"
            "27.0,"
            "28,"
            "12.0,"
            "1820,"
            "15.8,"
            "11.5,"
            "mean,"
            "3"
        ),
    ]
    return "\n".join(lines) + "\n"


def _is_numeric(s: str) -> bool:
    try:
        float(s)
        return True
    except ValueError:
        return False


def _clean_str(val: Any) -> Optional[str]:
    """Cleans string cell input, converting empty strings to None and neutralizing CSV formula injection."""
    if val is None:
        return None
    s = str(val).strip()
    if not s:
        return None
    # Neutralize spreadsheet formula injection triggers (=, @, tab, cr, or non-numeric +/-)
    if s.startswith(("=", "@", "\t", "\r")) or (s.startswith(("+", "-")) and not _is_numeric(s)):
        s = "'" + s
    return s


def _parse_float(val: Any, field_name: str, row_errors: List[str]) -> Optional[float]:
    """Parses a float cell value. Empty cells remain None (never silently 0.0)."""
    s = _clean_str(val)
    if s is None:
        return None
    try:
        f = float(s)
        if math.isnan(f) or math.isinf(f):
            row_errors.append(f"INVALID_VALUE: Field '{field_name}' contains NaN or Inf.")
            return None
        return f
    except ValueError:
        row_errors.append(f"NON_NUMERIC_VALUE: Field '{field_name}' expected a number, got '{s}'.")
        return None


def _parse_int(val: Any, field_name: str, row_errors: List[str]) -> Optional[int]:
    """Parses an integer cell value."""
    s = _clean_str(val)
    if s is None:
        return None
    try:
        return int(float(s))
    except ValueError:
        row_errors.append(f"NON_INTEGER_VALUE: Field '{field_name}' expected an integer, got '{s}'.")
        return None


def import_curated_csv(
    db: Session,
    file_content: bytes,
    curator_name: str,
    filename: str = "curated_data.csv",
    fallback_paper_id: Optional[str] = None,
    fallback_source_page: Optional[str] = None,
    fallback_source_table: Optional[str] = None,
) -> CSVImportResponse:
    """Parses, validates, and ingests researcher-curated experimental CSV data.

    Enforces provenance, checks for likely duplicates, preserves nulls without zero-fabrication,
    and assigns all created records to 'needs_review' status.
    """
    if not curator_name or not curator_name.strip():
        raise ValueError("CURATOR_REQUIRED: A responsible researcher/curator name must be provided for audit provenance.")

    # Decode file content (handle UTF-8 with or without BOM)
    try:
        text = file_content.decode("utf-8-sig")
    except UnicodeDecodeError:
        text = file_content.decode("latin-1", errors="replace")

    # Filter out comment lines starting with '#'
    data_lines = [line for line in text.splitlines() if not line.strip().startswith("#")]
    if not data_lines:
        return CSVImportResponse(
            curator_name=curator_name,
            filename=filename,
            total_rows_processed=0,
            imported_records_count=0,
            rows_with_warnings_count=0,
            rows_failed_count=0,
            created_record_ids=[],
            row_results=[],
            summary="CSV file contained no data rows (only header comments or blank lines).",
        )

    reader = csv.DictReader(data_lines)
    if not reader.fieldnames:
        return CSVImportResponse(
            curator_name=curator_name,
            filename=filename,
            total_rows_processed=0,
            imported_records_count=0,
            rows_with_warnings_count=0,
            rows_failed_count=0,
            created_record_ids=[],
            row_results=[],
            summary="CSV file lacks valid column header row.",
        )

    # Normalize header column names (lowercase, stripped)
    header_map = {col: col.strip().lower() for col in reader.fieldnames if col}

    row_results: List[CSVImportRowResult] = []
    created_records: List[ExperimentalRecord] = []
    created_ids: List[str] = []

    paper_cache: Dict[str, Optional[Paper]] = {}

    for idx, raw_row in enumerate(reader, start=1):
        row = {header_map.get(k, k): v for k, v in raw_row.items() if k}
        row_errors: List[str] = []
        row_warnings: List[str] = []
        duplicate_suspect = False
        matched_rec_id: Optional[str] = None

        # 1. Paper Provenance Validation & Template Placeholder Safeguard
        paper_id = _clean_str(row.get("paper_id")) or fallback_paper_id
        if not paper_id:
            row_errors.append("MISSING_PAPER_ID: 'paper_id' is mandatory to link experimental measurements to a published source.")
        elif paper_id.lower() in {"paper_example_001", "paper_sample_001", "placeholder_paper", "example_paper"} or (
            paper_id.lower().startswith("paper_example")
        ):
            row_errors.append(
                f"TEMPLATE_PLACEHOLDER_REJECTED: Row references template placeholder '{paper_id}' which cannot be ingested as empirical evidence."
            )
        else:
            if paper_id not in paper_cache:
                paper_cache[paper_id] = PaperRepository.get_by_id(db, paper_id)
            if not paper_cache[paper_id]:
                row_errors.append(f"PAPER_NOT_FOUND: Referenced paper_id '{paper_id}' does not exist in the database. Register the paper first.")

        # 2. Citation Provenance within Publication
        source_page = _clean_str(row.get("source_page")) or fallback_source_page
        source_table = _clean_str(row.get("source_table_or_figure")) or _clean_str(row.get("source_table")) or fallback_source_table
        source_excerpt = (
            _clean_str(row.get("source_excerpt_or_cell_reference"))
            or _clean_str(row.get("mix_identifier"))
            or _clean_str(row.get("mix_id"))
        )
        if not source_page and not source_table:
            row_errors.append("MISSING_PROVENANCE: Must provide 'source_page' or 'source_table_or_figure' for citation verification.")

        # 3. Material System & Mix Basis
        material_sys = _clean_str(row.get("material_system")) or "fly_ash_lime_gypsum_brick"
        if material_sys not in SUPPORTED_MATERIAL_SYSTEMS:
            row_warnings.append(
                f"UNVERIFIED_MATERIAL_SYSTEM: '{material_sys}' is not in standard catalog ({list(SUPPORTED_MATERIAL_SYSTEMS)})."
            )

        mix_basis = _clean_str(row.get("mix_basis")) or "dry_mass_fraction"
        if mix_basis not in {"dry_mass_fraction", "percentage", "mass_ratio", "volume_fraction"}:
            row_warnings.append(f"UNRECOGNIZED_MIX_BASIS: '{mix_basis}'. Standard bases are 'dry_mass_fraction' or 'percentage'.")

        # 4. Parse Formulation Fractions
        fa_frac = _parse_float(row.get("fly_ash_fraction"), "fly_ash_fraction", row_errors)
        lime_frac = _parse_float(row.get("lime_fraction"), "lime_fraction", row_errors)
        cement_frac = _parse_float(row.get("cement_fraction"), "cement_fraction", row_errors)
        gyp_frac = _parse_float(row.get("gypsum_fraction"), "gypsum_fraction", row_errors)
        sand_frac = _parse_float(row.get("sand_fraction"), "sand_fraction", row_errors)
        stone_dust_frac = _parse_float(row.get("stone_dust_fraction"), "stone_dust_fraction", row_errors)
        quarry_dust_frac = _parse_float(row.get("quarry_dust_fraction"), "quarry_dust_fraction", row_errors)

        if fa_frac is None or fa_frac <= 0.0:
            row_errors.append("INVALID_FLY_ASH: 'fly_ash_fraction' is mandatory and must be greater than 0.0.")

        # Check for values exceeding 1.0 under dry_mass_fraction
        if mix_basis == "dry_mass_fraction":
            for f_name, f_val in [
                ("fly_ash_fraction", fa_frac),
                ("lime_fraction", lime_frac),
                ("cement_fraction", cement_frac),
                ("gypsum_fraction", gyp_frac),
                ("sand_fraction", sand_frac),
            ]:
                if f_val is not None and f_val > 1.0:
                    row_warnings.append(
                        f"AMBIGUOUS_FRACTION_EXCEEDS_UNITY: '{f_name}' has value {f_val} > 1.0 under dry_mass_fraction basis. Verify if reported in wt%."
                    )

        # 5. Mass Balance Check
        solid_constituents = [f for f in [fa_frac, lime_frac, cement_frac, gyp_frac, sand_frac, stone_dust_frac, quarry_dust_frac] if f is not None]
        if len(solid_constituents) >= 2 and mix_basis == "dry_mass_fraction":
            total_sum = round(sum(solid_constituents), 4)
            if total_sum > 1.15 or total_sum < 0.85:
                row_warnings.append(
                    f"MASS_BALANCE_WARNING: Dry mass fractions sum to {total_sum}, which deviates from nominal 1.0 (100%)."
                )

        # 6. Parse Water, Curing, and Testing Parameters
        w_val = _parse_float(row.get("water_content_or_ratio") or row.get("water_binder_ratio"), "water_content_or_ratio", row_errors)
        w_basis = _clean_str(row.get("water_basis")) or "water_binder_ratio"
        curing_days = (
            _parse_int(row.get("curing_duration_days"), "curing_duration_days", row_errors)
            or _parse_int(row.get("curing_days"), "curing_days", row_errors)
            or _parse_int(row.get("test_age_days"), "test_age_days", row_errors)
        )
        curing_temp = _parse_float(row.get("curing_temperature_c"), "curing_temperature_c", row_errors)
        test_age = _parse_int(row.get("test_age_days"), "test_age_days", row_errors) or curing_days
        press_val = _parse_float(row.get("compaction_pressure_mpa"), "compaction_pressure_mpa", row_errors)
        dens_val = _parse_float(row.get("density_kg_m3"), "density_kg_m3", row_errors)

        # 7. Parse Target Performance Outcomes
        cs_val = _parse_float(row.get("compressive_strength_mpa"), "compressive_strength_mpa", row_errors)
        wa_val = _parse_float(row.get("water_absorption_pct"), "water_absorption_pct", row_errors)
        rep_type = _clean_str(row.get("reported_value_type")) or "mean"
        specimen_n = _parse_int(row.get("specimen_count_n"), "specimen_count_n", row_errors)
        exp_group_id = _clean_str(row.get("experiment_group_id")) or source_excerpt

        if cs_val is not None and cs_val <= 0.0:
            row_errors.append("INVALID_STRENGTH: 'compressive_strength_mpa' must be greater than 0.0 MPa.")
        if wa_val is not None and wa_val < 0.0:
            row_errors.append("INVALID_ABSORPTION: 'water_absorption_pct' cannot be negative.")

        # 8. Duplicate Detection (within same paper)
        if not row_errors and paper_id and fa_frac is not None:
            # Check existing records in DB for this paper
            existing_recs = db.scalars(
                select(ExperimentalRecord).where(ExperimentalRecord.paper_id == paper_id)
            ).all()
            for er in existing_recs:
                if er.fly_ash_fraction is not None and abs(er.fly_ash_fraction - fa_frac) <= 0.005:
                    # Check lime / cement matching
                    lime_match = (er.lime_fraction is None and lime_frac is None) or (
                        er.lime_fraction is not None and lime_frac is not None and abs(er.lime_fraction - lime_frac) <= 0.005
                    )
                    cs_match = (er.compressive_strength_mpa is None and cs_val is None) or (
                        er.compressive_strength_mpa is not None and cs_val is not None and abs(er.compressive_strength_mpa - cs_val) <= 0.2
                    )
                    if lime_match and cs_match:
                        duplicate_suspect = True
                        matched_rec_id = er.record_id
                        row_warnings.append(
                            f"DUPLICATE_SUSPECT: Row has near-identical formulation and strength to existing record '{er.record_id}' in paper '{paper_id}'. Record created as unreviewed draft for human deduplication."
                        )
                        break

        # 9. Ingest Record If Validation Passed
        if row_errors:
            row_results.append(
                CSVImportRowResult(
                    row_number=idx,
                    record_id=None,
                    paper_id=paper_id,
                    status="error",
                    errors=row_errors,
                    warnings=row_warnings,
                    duplicate_suspect=duplicate_suspect,
                    matched_existing_record_id=matched_rec_id,
                )
            )
        else:
            rec_id = gen_record_id()
            record_obj = ExperimentalRecord(
                record_id=rec_id,
                paper_id=paper_id,
                document_id=None,
                experiment_group_id=exp_group_id,
                source_page=source_page,
                source_table_or_figure=source_table,
                source_excerpt_or_cell_reference=source_excerpt,
                value_origin="manual_entry",
                schema_version=settings.CANONICAL_SCHEMA_VERSION,
                review_status="needs_review",  # Strict scientific safeguard: NEVER auto-accepted
                reviewed_by=curator_name,
                reviewed_at=datetime.now(timezone.utc),
                material_system=material_sys,
                mix_basis=mix_basis,
                fly_ash_fraction=fa_frac,
                lime_fraction=lime_frac,
                cement_fraction=cement_frac,
                gypsum_fraction=gyp_frac,
                sand_fraction=sand_frac,
                stone_dust_fraction=stone_dust_frac,
                quarry_dust_fraction=quarry_dust_frac,
                water_content_or_ratio=w_val,
                water_basis=w_basis,
                curing_duration_days=curing_days,
                curing_temperature_c=curing_temp,
                test_age_days=test_age,
                compaction_pressure_mpa=press_val,
                density_kg_m3=dens_val,
                compressive_strength_mpa=cs_val,
                water_absorption_pct=wa_val,
                reported_value_type=rep_type,
                specimen_count_n=specimen_n,
                raw_reported_values={k: str(v) for k, v in raw_row.items() if v is not None and str(v).strip()},
            )

            # Persist with audit history and transaction rollback safety
            provenance_desc = f"Batch CSV curation import from file '{filename}' by {curator_name}"
            if source_table or source_page:
                provenance_desc += f" (Source: {source_table or ''} p. {source_page or ''})".replace("  ", " ")
            try:
                RecordRepository.create(
                    db=db,
                    record=record_obj,
                    reviewer=curator_name,
                    reason=provenance_desc,
                )
                created_ids.append(rec_id)

                status_str = "warning" if row_warnings else "created"
                row_results.append(
                    CSVImportRowResult(
                        row_number=idx,
                        record_id=rec_id,
                        paper_id=paper_id,
                        status=status_str,
                        errors=[],
                        warnings=row_warnings,
                        duplicate_suspect=duplicate_suspect,
                        matched_existing_record_id=matched_rec_id,
                    )
                )
            except Exception as exc:
                db.rollback()
                row_results.append(
                    CSVImportRowResult(
                        row_number=idx,
                        record_id=None,
                        paper_id=paper_id,
                        status="error",
                        errors=[f"PERSISTENCE_ERROR: Failed to save record to database: {exc}"],
                        warnings=row_warnings,
                        duplicate_suspect=duplicate_suspect,
                        matched_existing_record_id=matched_rec_id,
                    )
                )

    imported_n = len(created_ids)
    failed_n = sum(1 for r in row_results if r.status == "error")
    warning_n = sum(1 for r in row_results if len(r.warnings) > 0)

    summary = (
        f"Processed {len(row_results)} rows: {imported_n} records created under 'needs_review' status; "
        f"{failed_n} rows failed; {warning_n} rows had warnings. "
        f"All created records require scientific validation and human acceptance before entering model readiness."
    )

    return CSVImportResponse(
        curator_name=curator_name,
        filename=filename,
        total_rows_processed=len(row_results),
        imported_records_count=imported_n,
        rows_with_warnings_count=warning_n,
        rows_failed_count=failed_n,
        created_record_ids=created_ids,
        row_results=row_results,
        summary=summary,
    )
