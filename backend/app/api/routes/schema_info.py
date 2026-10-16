from fastapi import APIRouter
from backend.app.core.config import settings
from backend.app.schemas.schema_info import DataDictionaryResponse, FieldDictionaryEntry

router = APIRouter(prefix="/schema", tags=["Schema & Data Dictionary"])


@router.get("", response_model=DataDictionaryResponse, summary="Get canonical schema metadata and data dictionary")
def get_schema_data_dictionary() -> DataDictionaryResponse:
    fields = [
        FieldDictionaryEntry(
            name="record_id", data_type="string", unit="dimensionless", nullable=False, description="Stable primary identifier"
        ),
        FieldDictionaryEntry(
            name="paper_id", data_type="string", unit="dimensionless", nullable=False, description="DOI or stable bibliographic identifier"
        ),
        FieldDictionaryEntry(
            name="experiment_group_id", data_type="string", unit="dimensionless", nullable=True, description="Cluster grouping identical physical experiments across papers"
        ),
        FieldDictionaryEntry(
            name="source_title", data_type="string", unit="dimensionless", nullable=True, description="Source publication title for provenance verification"
        ),
        FieldDictionaryEntry(
            name="source_authors", data_type="string", unit="dimensionless", nullable=True, description="Publication authors"
        ),
        FieldDictionaryEntry(
            name="publication_year", data_type="integer", unit="year", nullable=True, description="Publication calendar year"
        ),
        FieldDictionaryEntry(
            name="doi_or_url", data_type="string", unit="dimensionless", nullable=True, description="Digital Object Identifier or stable URL"
        ),
        FieldDictionaryEntry(
            name="source_page", data_type="string", unit="dimensionless", nullable=True, description="Page number where the result is reported"
        ),
        FieldDictionaryEntry(
            name="source_table_or_figure", data_type="string", unit="dimensionless", nullable=True, description="Specific table or figure identifier"
        ),
        FieldDictionaryEntry(
            name="value_origin", data_type="string", unit="dimensionless", nullable=False, description="literature_extracted | manual_entry | derived | synthetic"
        ),
        FieldDictionaryEntry(
            name="material_system", data_type="string", unit="dimensionless", nullable=False, description="Must remain distinct (e.g. fly_ash_lime_gypsum_brick)"
        ),
        FieldDictionaryEntry(
            name="fly_ash_fraction", data_type="float", unit="dry mass fraction [0.0 - 1.0]", nullable=True, description="Normalized dry mass fraction of pulverized fuel ash"
        ),
        FieldDictionaryEntry(
            name="cement_fraction", data_type="float", unit="dry mass fraction [0.0 - 1.0]", nullable=True, description="Normalized dry mass fraction of OPC clinker"
        ),
        FieldDictionaryEntry(
            name="lime_fraction", data_type="float", unit="dry mass fraction [0.0 - 1.0]", nullable=True, description="Normalized dry mass fraction of hydrated lime Ca(OH)2"
        ),
        FieldDictionaryEntry(
            name="gypsum_fraction", data_type="float", unit="dry mass fraction [0.0 - 1.0]", nullable=True, description="Normalized dry mass fraction of phospho-gypsum"
        ),
        FieldDictionaryEntry(
            name="sand_fraction", data_type="float", unit="dry mass fraction [0.0 - 1.0]", nullable=True, description="Normalized dry mass fraction of river sand"
        ),
        FieldDictionaryEntry(
            name="stone_dust_fraction", data_type="float", unit="dry mass fraction [0.0 - 1.0]", nullable=True, description="Normalized dry mass fraction of stone dust (quarry dust kept distinct)"
        ),
        FieldDictionaryEntry(
            name="quarry_dust_fraction", data_type="float", unit="dry mass fraction [0.0 - 1.0]", nullable=True, description="Normalized dry mass fraction of quarry dust"
        ),
        FieldDictionaryEntry(
            name="water_content_or_ratio", data_type="float", unit="ratio or %", nullable=True, description="Water proportion relative to binder solids"
        ),
        FieldDictionaryEntry(
            name="curing_method", data_type="string", unit="dimensionless", nullable=True, description="Curing protocol (water_curing, steam, autoclave, ambient)"
        ),
        FieldDictionaryEntry(
            name="curing_duration_days", data_type="integer", unit="days", nullable=True, description="Duration under specified curing regimen before test"
        ),
        FieldDictionaryEntry(
            name="compaction_pressure_mpa", data_type="float", unit="MPa", nullable=True, description="Hydraulic compaction or forming pressure"
        ),
        FieldDictionaryEntry(
            name="density_kg_m3", data_type="float", unit="kg/m³", nullable=True, description="Specimen dry density"
        ),
        FieldDictionaryEntry(
            name="test_standard", data_type="string", unit="dimensionless", nullable=True, description="Mechanical testing code (IS 3495 Part 1, ASTM C67)"
        ),
        FieldDictionaryEntry(
            name="compressive_strength_mpa", data_type="float", unit="MPa", nullable=True, description="Crushing resistance under standard compressive test"
        ),
        FieldDictionaryEntry(
            name="water_absorption_pct", data_type="float", unit="%", nullable=True, description="24-hour cold water immersion absorption percentage"
        ),
    ]

    return DataDictionaryResponse(
        schema_version=settings.CANONICAL_SCHEMA_VERSION,
        record_grain="One experimental formulation/result under defined raw materials, manufacturing conditions, curing regimen, and test standard.",
        material_system="fly_ash_lime_gypsum_brick",
        fields=fields,
        lifecycle_states=["raw", "candidate", "reviewed", "model_ready", "synthetic_test_only"],
        review_statuses=["candidate", "needs_review", "accepted", "rejected"],
    )
