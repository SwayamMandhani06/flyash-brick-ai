from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    JSON,
    UniqueConstraint,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


import uuid


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def gen_paper_id() -> str:
    return f"paper_{uuid.uuid4().hex[:12]}"


def gen_record_id() -> str:
    return f"rec_{uuid.uuid4().hex[:12]}"


def gen_model_id() -> str:
    return f"mod_{uuid.uuid4().hex[:12]}"


def gen_document_id() -> str:
    return f"doc_{uuid.uuid4().hex[:12]}"


class Base(DeclarativeBase):
    pass


class Paper(Base):
    """Academic paper metadata in the literature registry."""
    __tablename__ = "papers"

    paper_id: Mapped[str] = mapped_column(String(100), primary_key=True, default=gen_paper_id)
    doi_or_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, unique=True, index=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    authors: Mapped[str] = mapped_column(String(500), nullable=False)
    journal: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    publication_year: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    material_system: Mapped[str] = mapped_column(
        String(100), nullable=False, default="fly_ash_lime_gypsum_brick"
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    # Relationships
    records: Mapped[List["ExperimentalRecord"]] = relationship(
        "ExperimentalRecord", back_populates="paper", cascade="all, delete-orphan"
    )
    documents: Mapped[List["Document"]] = relationship(
        "Document", back_populates="paper", cascade="all, delete-orphan"
    )


class Document(Base):
    """Ingested literature document (PDF) registry entry."""
    __tablename__ = "documents"

    document_id: Mapped[str] = mapped_column(String(100), primary_key=True, default=gen_document_id)
    paper_id: Mapped[Optional[str]] = mapped_column(
        String(100), ForeignKey("papers.paper_id", ondelete="SET NULL"), nullable=True, index=True
    )
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    stored_path: Mapped[str] = mapped_column(String(500), nullable=False)
    file_size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    sha256_hash: Mapped[str] = mapped_column(String(64), nullable=False, unique=True, index=True)
    page_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="uploaded", index=True
    )  # uploaded | extracting | extracted | failed | scanned_image_only
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    warning_messages: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)
    extracted_pages_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    # Relationships
    paper: Mapped[Optional["Paper"]] = relationship("Paper", back_populates="documents")
    extracted_records: Mapped[List["ExperimentalRecord"]] = relationship(
        "ExperimentalRecord", back_populates="source_document"
    )


class ExperimentalRecord(Base):
    """Canonical experimental formulation and mechanical performance record."""
    __tablename__ = "records"

    # Identity and Provenance
    record_id: Mapped[str] = mapped_column(String(100), primary_key=True, default=gen_record_id)
    paper_id: Mapped[str] = mapped_column(
        String(100), ForeignKey("papers.paper_id", ondelete="CASCADE"), nullable=False, index=True
    )
    document_id: Mapped[Optional[str]] = mapped_column(
        String(100), ForeignKey("documents.document_id", ondelete="SET NULL"), nullable=True, index=True
    )
    experiment_group_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    duplicate_group_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    source_title: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    source_authors: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    publication_year: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    doi_or_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    source_page: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    source_table_or_figure: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    source_excerpt_or_cell_reference: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    extraction_method: Mapped[str] = mapped_column(
        String(50), nullable=False, default="manual_entry"
    )
    value_origin: Mapped[str] = mapped_column(
        String(50), nullable=False, default="literature_extracted"
    )  # literature_extracted | manual_entry | derived | synthetic
    schema_version: Mapped[str] = mapped_column(
        String(32), nullable=False, default="v1.0.0-canonical"
    )
    review_status: Mapped[str] = mapped_column(
        String(32), nullable=False, default="candidate", index=True
    )  # candidate | needs_review | accepted | rejected
    reviewed_by: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    # Material & Process Definition
    material_system: Mapped[str] = mapped_column(
        String(100), nullable=False, default="fly_ash_lime_gypsum_brick", index=True
    )
    brick_state: Mapped[str] = mapped_column(String(32), nullable=False, default="unfired")
    fly_ash_source: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    fly_ash_class_or_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    fly_ash_fraction: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    cement_fraction: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    lime_fraction: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    gypsum_fraction: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    sand_fraction: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    stone_dust_fraction: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    quarry_dust_fraction: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    other_materials: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    mix_basis: Mapped[str] = mapped_column(
        String(50), nullable=False, default="dry_mass_fraction"
    )  # dry_mass_fraction | mass_ratio | volume_fraction
    water_content_or_ratio: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    water_basis: Mapped[str] = mapped_column(
        String(50), nullable=False, default="water_binder_ratio"
    )
    curing_method: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    curing_duration_days: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    curing_temperature_c: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    test_age_days: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    forming_method: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    compaction_pressure_mpa: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    density_kg_m3: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    specimen_dimensions: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    test_standard: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Chemistry Features (Optional)
    sio2_pct: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    al2o3_pct: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    fe2o3_pct: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    cao_pct: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    mgo_pct: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    so3_pct: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    loi_pct: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Performance Targets
    compressive_strength_mpa: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    water_absorption_pct: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    reported_value_type: Mapped[str] = mapped_column(String(32), nullable=False, default="mean")
    specimen_count_n: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    compressive_strength_sd_mpa: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    water_absorption_sd_pct: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    target_test_method_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Raw Values & Notes
    raw_reported_values: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    normalization_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    paper: Mapped["Paper"] = relationship("Paper", back_populates="records")
    source_document: Mapped[Optional["Document"]] = relationship("Document", back_populates="extracted_records")
    history_events: Mapped[List["ReviewHistory"]] = relationship(
        "ReviewHistory", back_populates="record", cascade="all, delete-orphan", order_by="ReviewHistory.timestamp.desc()"
    )


class ReviewHistory(Base):
    """Auditable log of review decisions and data corrections."""
    __tablename__ = "review_history"

    event_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    record_id: Mapped[str] = mapped_column(
        String(100), ForeignKey("records.record_id", ondelete="CASCADE"), nullable=False, index=True
    )
    action: Mapped[str] = mapped_column(String(50), nullable=False)  # status_change | correction | creation
    field_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    previous_value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    new_value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reviewer: Mapped[str] = mapped_column(String(100), nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    # Relationships
    record: Mapped["ExperimentalRecord"] = relationship("ExperimentalRecord", back_populates="history_events")


class DatasetVersion(Base):
    """Immutable version snapshot metadata."""
    __tablename__ = "dataset_versions"

    version_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    schema_version: Mapped[str] = mapped_column(String(32), nullable=False)
    lifecycle_state: Mapped[str] = mapped_column(
        String(32), nullable=False
    )  # raw | candidate | reviewed | model_ready | synthetic_test_only
    description: Mapped[str] = mapped_column(Text, nullable=False)
    record_count: Mapped[int] = mapped_column(Integer, default=0)
    is_frozen: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    # Relationships
    memberships: Mapped[List["DatasetVersionRecord"]] = relationship(
        "DatasetVersionRecord", back_populates="dataset_version", cascade="all, delete-orphan"
    )


class DatasetVersionRecord(Base):
    """Join table linking dataset version snapshots to records."""
    __tablename__ = "dataset_version_records"
    __table_args__ = (UniqueConstraint("version_id", "record_id", name="uq_version_record"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    version_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("dataset_versions.version_id", ondelete="CASCADE"), nullable=False, index=True
    )
    record_id: Mapped[str] = mapped_column(
        String(100), ForeignKey("records.record_id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Relationships
    dataset_version: Mapped["DatasetVersion"] = relationship("DatasetVersion", back_populates="memberships")


class ModelRegistryMetadata(Base):
    """Model registry metadata table (metadata only; no training or artifacts in Phase 2)."""
    __tablename__ = "model_metadata"

    model_id: Mapped[str] = mapped_column(String(64), primary_key=True, default=gen_model_id)
    target_property: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # compressive_strength_mpa | water_absorption_pct
    target_unit: Mapped[str] = mapped_column(String(20), nullable=False)  # MPa | %
    algorithm: Mapped[str] = mapped_column(String(50), nullable=False, default="XGBoost")
    model_version: Mapped[str] = mapped_column(String(32), nullable=False)
    dataset_version_id: Mapped[Optional[str]] = mapped_column(
        String(64), ForeignKey("dataset_versions.version_id"), nullable=True
    )
    feature_manifest: Mapped[List[str]] = mapped_column(JSON, nullable=False)
    hyperparameters: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    evaluation_metrics: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    artifact_path: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_trained: Mapped[bool] = mapped_column(Boolean, default=False)
    training_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
