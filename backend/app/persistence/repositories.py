from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session
from backend.app.core.config import settings
from backend.app.persistence.models import (
    DatasetVersion,
    DatasetVersionRecord,
    Document,
    ExperimentalRecord,
    ModelRegistryMetadata,
    Paper,
    ReviewHistory,
    ValidationRun,
    ValidationFinding,
    gen_document_id,
    gen_finding_id,
    gen_model_id,
    gen_paper_id,
    gen_record_id,
    gen_run_id,
)


class PaperRepository:
    @staticmethod
    def create(db: Session, paper: Paper) -> Paper:
        if not paper.paper_id:
            paper.paper_id = gen_paper_id()
        db.add(paper)
        db.commit()
        db.refresh(paper)
        return paper

    @staticmethod
    def get_by_id(db: Session, paper_id: str) -> Optional[Paper]:
        return db.get(Paper, paper_id)

    @staticmethod
    def get_by_doi(db: Session, doi: str) -> Optional[Paper]:
        stmt = select(Paper).where(Paper.doi_or_url == doi)
        return db.scalar(stmt)

    @staticmethod
    def list_all(db: Session, skip: int = 0, limit: int = 100) -> List[Paper]:
        stmt = select(Paper).offset(skip).limit(limit)
        return list(db.scalars(stmt).all())


class RecordRepository:
    VALID_REVIEW_STATUSES = {"candidate", "needs_review", "accepted", "rejected"}
    VALID_TRANSITIONS = {
        "candidate": {"accepted", "rejected", "needs_review"},
        "needs_review": {"accepted", "rejected"},
        "accepted": {"needs_review", "rejected"},
        "rejected": {"needs_review"},
    }

    @staticmethod
    def create(db: Session, record: ExperimentalRecord, reviewer: str = "system", reason: str = "Initial record entry") -> ExperimentalRecord:
        if not record.record_id:
            record.record_id = gen_record_id()
        if not record.review_status:
            record.review_status = "candidate"

        db.add(record)
        # Log creation in audit history
        history_event = ReviewHistory(
            record_id=record.record_id,
            action="creation",
            field_name=None,
            previous_value=None,
            new_value=f"status={record.review_status}, value_origin={record.value_origin}",
            reviewer=reviewer,
            reason=reason,
            timestamp=datetime.now(timezone.utc),
        )
        db.add(history_event)
        db.commit()
        db.refresh(record)
        return record

    @staticmethod
    def get_by_id(db: Session, record_id: str) -> Optional[ExperimentalRecord]:
        return db.get(ExperimentalRecord, record_id)

    @staticmethod
    def list_records(
        db: Session,
        paper_id: Optional[str] = None,
        status: Optional[str] = None,
        material_system: Optional[str] = None,
        value_origin: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[ExperimentalRecord]:
        stmt = select(ExperimentalRecord)
        if paper_id:
            stmt = stmt.where(ExperimentalRecord.paper_id == paper_id)
        if status:
            stmt = stmt.where(ExperimentalRecord.review_status == status)
        if material_system:
            stmt = stmt.where(ExperimentalRecord.material_system == material_system)
        if value_origin:
            stmt = stmt.where(ExperimentalRecord.value_origin == value_origin)
        stmt = stmt.offset(skip).limit(limit)
        return list(db.scalars(stmt).all())

    @classmethod
    def apply_review_action(
        cls,
        db: Session,
        record_id: str,
        reviewer: str,
        reason: str,
        new_status: Optional[str] = None,
        field_corrections: Optional[Dict[str, Any]] = None,
    ) -> ExperimentalRecord:
        record = db.get(ExperimentalRecord, record_id)
        if not record:
            raise KeyError(f"Record with id '{record_id}' not found.")

        now = datetime.now(timezone.utc)

        # 1. Handle Status Change
        if new_status and new_status != record.review_status:
            if new_status not in cls.VALID_REVIEW_STATUSES:
                raise ValueError(f"Invalid review status '{new_status}'. Allowed: {cls.VALID_REVIEW_STATUSES}")

            allowed = cls.VALID_TRANSITIONS.get(record.review_status, set())
            if new_status not in allowed:
                raise ValueError(
                    f"Invalid review state transition from '{record.review_status}' to '{new_status}'. Allowed: {allowed}"
                )

            old_status = record.review_status
            record.review_status = new_status
            record.reviewed_by = reviewer
            record.reviewed_at = now

            db.add(
                ReviewHistory(
                    record_id=record.record_id,
                    action="status_change",
                    field_name="review_status",
                    previous_value=old_status,
                    new_value=new_status,
                    reviewer=reviewer,
                    reason=reason,
                    timestamp=now,
                )
            )

        # 2. Handle Field Corrections
        if field_corrections:
            for field, new_val in field_corrections.items():
                if not hasattr(record, field):
                    raise ValueError(f"Field '{field}' does not exist on ExperimentalRecord.")

                old_val = getattr(record, field)
                if old_val != new_val:
                    setattr(record, field, new_val)
                    db.add(
                        ReviewHistory(
                            record_id=record.record_id,
                            action="correction",
                            field_name=field,
                            previous_value=str(old_val) if old_val is not None else None,
                            new_value=str(new_val) if new_val is not None else None,
                            reviewer=reviewer,
                            reason=reason,
                            timestamp=now,
                        )
                    )

            # If an accepted record was corrected, require re-review unless explicitly kept accepted
            if record.review_status == "accepted" and not new_status:
                record.review_status = "needs_review"
                db.add(
                    ReviewHistory(
                        record_id=record.record_id,
                        action="status_change",
                        field_name="review_status",
                        previous_value="accepted",
                        new_value="needs_review",
                        reviewer=reviewer,
                        reason="Automated transition: Field values corrected, requiring re-review.",
                        timestamp=now,
                    )
                )

        record.updated_at = now
        db.commit()
        db.refresh(record)
        return record

    @staticmethod
    def get_history(db: Session, record_id: str) -> List[ReviewHistory]:
        stmt = (
            select(ReviewHistory)
            .where(ReviewHistory.record_id == record_id)
            .order_by(ReviewHistory.timestamp.desc())
        )
        return list(db.scalars(stmt).all())


class DatasetVersionRepository:
    @staticmethod
    def create_version(
        db: Session,
        version_id: str,
        schema_version: str,
        lifecycle_state: str,
        description: str,
        record_ids: List[str],
    ) -> DatasetVersion:
        valid_states = {"raw", "candidate", "reviewed", "model_ready", "synthetic_test_only"}
        if lifecycle_state not in valid_states:
            raise ValueError(f"Invalid lifecycle_state '{lifecycle_state}'. Allowed: {valid_states}")

        # Fetch records
        stmt = select(ExperimentalRecord).where(ExperimentalRecord.record_id.in_(record_ids))
        records = list(db.scalars(stmt).all())
        found_ids = {r.record_id for r in records}
        missing_ids = set(record_ids) - found_ids
        if missing_ids:
            raise KeyError(f"Records not found: {missing_ids}")

        # CRITICAL SAFETY GATE: Synthetic records must never enter a real model_ready snapshot!
        if lifecycle_state == "model_ready":
            synthetic_leaks = [r.record_id for r in records if r.value_origin == "synthetic"]
            if synthetic_leaks:
                raise ValueError(
                    f"SYNTHETIC_DATA_LEAK_PREVENTED: Cannot create 'model_ready' snapshot with synthetic records: {synthetic_leaks}"
                )

            # Also ensure all records in model_ready are accepted
            unaccepted = [r.record_id for r in records if r.review_status != "accepted"]
            if unaccepted:
                raise ValueError(
                    f"MODEL_READY_POLICY_VIOLATION: Cannot include non-accepted records in model_ready snapshot: {unaccepted}"
                )

        version = DatasetVersion(
            version_id=version_id,
            schema_version=schema_version,
            lifecycle_state=lifecycle_state,
            description=description,
            record_count=len(records),
            is_frozen=True,
            created_at=datetime.now(timezone.utc),
        )
        db.add(version)
        db.flush()

        for rec in records:
            db.add(DatasetVersionRecord(version_id=version_id, record_id=rec.record_id))

        db.commit()
        db.refresh(version)
        return version

    @staticmethod
    def get_by_id(db: Session, version_id: str) -> Optional[DatasetVersion]:
        return db.get(DatasetVersion, version_id)

    @staticmethod
    def list_versions(db: Session) -> List[DatasetVersion]:
        stmt = select(DatasetVersion).order_by(DatasetVersion.created_at.desc())
        return list(db.scalars(stmt).all())

    @staticmethod
    def get_version_records(db: Session, version_id: str) -> List[ExperimentalRecord]:
        stmt = (
            select(ExperimentalRecord)
            .join(DatasetVersionRecord, DatasetVersionRecord.record_id == ExperimentalRecord.record_id)
            .where(DatasetVersionRecord.version_id == version_id)
        )
        return list(db.scalars(stmt).all())


class ModelMetadataRepository:
    @staticmethod
    def create(db: Session, metadata: ModelRegistryMetadata) -> ModelRegistryMetadata:
        if not metadata.model_id:
            metadata.model_id = gen_model_id()
        # Enforce that missing models are not falsely represented as trained
        if metadata.is_trained and not metadata.artifact_path:
            raise ValueError("Cannot register model as trained without a valid artifact_path.")

        db.add(metadata)
        db.commit()
        db.refresh(metadata)
        return metadata

    @staticmethod
    def get_by_id(db: Session, model_id: str) -> Optional[ModelRegistryMetadata]:
        return db.get(ModelRegistryMetadata, model_id)

    @staticmethod
    def list_all(db: Session) -> List[ModelRegistryMetadata]:
        stmt = select(ModelRegistryMetadata).order_by(ModelRegistryMetadata.created_at.desc())
        return list(db.scalars(stmt).all())


class DocumentRepository:
    @staticmethod
    def create(db: Session, doc: Document) -> Document:
        if not doc.document_id:
            doc.document_id = gen_document_id()
        db.add(doc)
        db.commit()
        db.refresh(doc)
        return doc

    @staticmethod
    def get_by_id(db: Session, document_id: str) -> Optional[Document]:
        return db.get(Document, document_id)

    @staticmethod
    def get_by_hash(db: Session, sha256_hash: str) -> Optional[Document]:
        stmt = select(Document).where(Document.sha256_hash == sha256_hash)
        return db.scalar(stmt)

    @staticmethod
    def list_all(
        db: Session, paper_id: Optional[str] = None, status: Optional[str] = None, skip: int = 0, limit: int = 100
    ) -> List[Document]:
        stmt = select(Document)
        if paper_id:
            stmt = stmt.where(Document.paper_id == paper_id)
        if status:
            stmt = stmt.where(Document.status == status)
        stmt = stmt.order_by(Document.created_at.desc()).offset(skip).limit(limit)
        return list(db.scalars(stmt).all())

    @staticmethod
    def save_candidates(
        db: Session,
        doc: Document,
        candidate_dicts: List[Dict[str, Any]],
        paper_id: Optional[str] = None,
    ) -> List[ExperimentalRecord]:
        target_paper_id = paper_id or doc.paper_id
        if not target_paper_id:
            paper = Paper(
                title=f"Extracted Paper ({doc.original_filename})",
                authors="Extracted from source PDF",
                material_system="fly_ash_lime_gypsum_brick",
                notes=f"Auto-generated for uploaded document {doc.document_id}",
            )
            db.add(paper)
            db.flush()
            target_paper_id = paper.paper_id
            doc.paper_id = target_paper_id

        # Idempotent extraction retry:
        # Find existing records for this document that are still unreviewed candidates
        existing_stmt = select(ExperimentalRecord).where(
            ExperimentalRecord.document_id == doc.document_id,
            ExperimentalRecord.review_status == "candidate",
        )
        existing_candidates = list(db.scalars(existing_stmt).all())
        for old_rec in existing_candidates:
            db.delete(old_rec)
        db.flush()

        created_records: List[ExperimentalRecord] = []
        for c in candidate_dicts:
            rec_id = gen_record_id()
            rec = ExperimentalRecord(
                record_id=rec_id,
                paper_id=target_paper_id,
                document_id=doc.document_id,
                schema_version=settings.CANONICAL_SCHEMA_VERSION,
                source_title=doc.original_filename,
                **c,
            )
            db.add(rec)
            # Log creation in audit history
            hist = ReviewHistory(
                record_id=rec_id,
                action="creation",
                field_name=None,
                previous_value=None,
                new_value=f"status=candidate, value_origin=literature_extracted, doc_id={doc.document_id}",
                reviewer="pdfplumber_v1",
                reason=f"Extracted from {doc.original_filename} ({c.get('source_table_or_figure', 'text')})",
                timestamp=datetime.now(timezone.utc),
            )
            db.add(hist)
            created_records.append(rec)

        db.commit()
        for r in created_records:
            db.refresh(r)
        return created_records


class ValidationRepository:
    @staticmethod
    def save_run(
        db: Session,
        run: ValidationRun,
        findings: List[ValidationFinding],
    ) -> ValidationRun:
        """Atomically saves a validation run and its granular findings."""
        if not run.run_id:
            run.run_id = gen_run_id()
        db.add(run)
        db.flush()

        for finding in findings:
            if not finding.finding_id:
                finding.finding_id = gen_finding_id()
            finding.run_id = run.run_id
            db.add(finding)

        db.commit()
        db.refresh(run)
        return run

    @staticmethod
    def get_run_by_id(db: Session, run_id: str) -> Optional[ValidationRun]:
        return db.get(ValidationRun, run_id)

    @staticmethod
    def get_latest_run_for_record(db: Session, record_id: str) -> Optional[ValidationRun]:
        stmt = (
            select(ValidationRun)
            .where(ValidationRun.record_id == record_id)
            .order_by(ValidationRun.created_at.desc())
        )
        return db.scalar(stmt)

    @staticmethod
    def list_findings_for_record(db: Session, record_id: str) -> List[ValidationFinding]:
        stmt = (
            select(ValidationFinding)
            .where(ValidationFinding.record_id == record_id)
            .order_by(ValidationFinding.created_at.desc())
        )
        return list(db.scalars(stmt).all())

    @staticmethod
    def list_runs_for_record(db: Session, record_id: str) -> List[ValidationRun]:
        stmt = (
            select(ValidationRun)
            .where(ValidationRun.record_id == record_id)
            .order_by(ValidationRun.created_at.desc())
        )
        return list(db.scalars(stmt).all())


