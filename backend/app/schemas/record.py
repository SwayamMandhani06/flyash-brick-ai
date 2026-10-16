from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class RecordBase(BaseModel):
    # Identity & Provenance
    paper_id: str = Field(..., description="Foreign key to registered paper")
    document_id: Optional[str] = Field(None, description="Optional foreign key to uploaded source document")
    experiment_group_id: Optional[str] = Field(None, description="Groups shared underlying physical experiments")
    duplicate_group_id: Optional[str] = Field(None, description="Duplicate detection cluster identifier")
    source_title: Optional[str] = None
    source_authors: Optional[str] = None
    publication_year: Optional[int] = None
    doi_or_url: Optional[str] = None
    source_page: Optional[str] = None
    source_table_or_figure: Optional[str] = None
    source_excerpt_or_cell_reference: Optional[str] = None
    extraction_method: str = Field("manual_entry", description="Method used to extract values")
    value_origin: str = Field(
        "literature_extracted", description="literature_extracted | manual_entry | derived | synthetic"
    )
    schema_version: str = Field("v1.0.0-canonical", description="Canonical data schema version")

    # Material & Manufacturing
    material_system: str = Field("fly_ash_lime_gypsum_brick", description="Material system identifier")
    brick_state: str = Field("unfired", description="unfired | fired | unknown")
    fly_ash_source: Optional[str] = None
    fly_ash_class_or_type: Optional[str] = None
    fly_ash_fraction: Optional[float] = Field(None, ge=0.0, description="Dry mass fraction of fly ash")
    cement_fraction: Optional[float] = Field(None, ge=0.0, description="Dry mass fraction of cement (OPC)")
    lime_fraction: Optional[float] = Field(None, ge=0.0, description="Dry mass fraction of hydrated lime")
    gypsum_fraction: Optional[float] = Field(None, ge=0.0, description="Dry mass fraction of gypsum")
    sand_fraction: Optional[float] = Field(None, ge=0.0, description="Dry mass fraction of river sand")
    stone_dust_fraction: Optional[float] = Field(None, ge=0.0, description="Dry mass fraction of stone dust")
    quarry_dust_fraction: Optional[float] = Field(None, ge=0.0, description="Dry mass fraction of quarry dust")
    other_materials: Optional[Dict[str, Any]] = None
    mix_basis: str = Field("dry_mass_fraction", description="dry_mass_fraction | mass_ratio | volume_fraction")
    water_content_or_ratio: Optional[float] = Field(None, ge=0.0, description="Water proportion")
    water_basis: str = Field("water_binder_ratio", description="Definition of water ratio")
    curing_method: Optional[str] = None
    curing_duration_days: Optional[int] = Field(None, ge=0, description="Duration of curing in days")
    curing_temperature_c: Optional[float] = None
    test_age_days: Optional[int] = Field(None, ge=0, description="Age at testing in days")
    forming_method: Optional[str] = None
    compaction_pressure_mpa: Optional[float] = None
    density_kg_m3: Optional[float] = None
    specimen_dimensions: Optional[str] = None
    test_standard: Optional[str] = None

    # Chemistry Features
    sio2_pct: Optional[float] = None
    al2o3_pct: Optional[float] = None
    fe2o3_pct: Optional[float] = None
    cao_pct: Optional[float] = None
    mgo_pct: Optional[float] = None
    so3_pct: Optional[float] = None
    loi_pct: Optional[float] = None

    # Performance Targets
    compressive_strength_mpa: Optional[float] = Field(None, description="28-day or test-age compressive strength in MPa")
    water_absorption_pct: Optional[float] = Field(None, description="24-hour water absorption in %")
    reported_value_type: str = Field("mean", description="individual | mean | median | range")
    specimen_count_n: Optional[int] = None
    compressive_strength_sd_mpa: Optional[float] = None
    water_absorption_sd_pct: Optional[float] = None
    target_test_method_notes: Optional[str] = None

    # Notes & Raw
    raw_reported_values: Optional[Dict[str, Any]] = None
    normalization_notes: Optional[str] = None


class RecordCreate(RecordBase):
    record_id: Optional[str] = Field(None, description="Stable unique identifier for the record (auto-generated if omitted)")
    initial_reviewer: str = Field("system", description="Reviewer or agent registering the candidate")
    creation_reason: str = Field("Initial candidate ingestion", description="Audit reason for creation")


class RecordReviewAction(BaseModel):
    reviewer: str = Field(..., min_length=2, description="Reviewer name or identifier")
    reason: str = Field(..., min_length=3, description="Audit reason for action or correction")
    new_status: Optional[str] = Field(None, description="candidate | needs_review | accepted | rejected")
    field_corrections: Optional[Dict[str, Any]] = Field(None, description="Key-value pairs of corrected fields")


class ReviewHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    event_id: int
    record_id: str
    action: str
    field_name: Optional[str] = None
    previous_value: Optional[str] = None
    new_value: Optional[str] = None
    reviewer: str
    reason: str
    timestamp: datetime


class RecordResponse(RecordBase):
    model_config = ConfigDict(from_attributes=True)

    record_id: str
    review_status: str
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
