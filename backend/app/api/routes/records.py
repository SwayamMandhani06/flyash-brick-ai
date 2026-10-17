from typing import List, Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Response, UploadFile, status
from sqlalchemy.orm import Session
from backend.app.persistence.database import get_db
from backend.app.persistence.models import ExperimentalRecord
from backend.app.persistence.repositories import PaperRepository, RecordRepository
from backend.app.schemas.csv_import import CSVImportResponse
from backend.app.schemas.record import (
    RecordCreate,
    RecordResponse,
    RecordReviewAction,
    ReviewHistoryResponse,
)
from backend.app.services.csv_importer import generate_sample_csv_template, import_curated_csv

router = APIRouter(prefix="/records", tags=["Experimental Records"])


@router.get(
    "/csv-template",
    summary="Download standard researcher data curation CSV template",
    response_class=Response,
)
def download_csv_template() -> Response:
    """Provides a documented CSV template with column headers and illustrative placeholders."""
    template_str = generate_sample_csv_template()
    return Response(
        content=template_str,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="flyash_curation_template.csv"'},
    )


@router.post(
    "/import-csv",
    response_model=CSVImportResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Import researcher-curated experimental CSV dataset",
)
async def import_csv_dataset(
    file: UploadFile = File(..., description="Researcher-curated CSV data file"),
    curator_name: str = Form(..., description="Name or identifier of the researcher responsible for curation"),
    paper_id: Optional[str] = Form(None, description="Optional default paper_id for rows omitting publication link"),
    source_page: Optional[str] = Form(None, description="Optional default source page for rows omitting citation page"),
    source_table: Optional[str] = Form(None, description="Optional default source table for rows omitting table/figure"),
    db: Session = Depends(get_db),
) -> CSVImportResponse:
    """Ingests researcher-curated CSV records with provenance, duplicate checks, and row diagnostics."""
    filename = file.filename or "unknown.csv"
    if not filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="UNSUPPORTED_FILE_TYPE: Only CSV (.csv) files are supported for tabular curation import.",
        )

    try:
        content = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"READ_ERROR: Could not read uploaded CSV file content: {e}",
        )

    if paper_id:
        paper = PaperRepository.get_by_id(db, paper_id)
        if not paper:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Referenced paper '{paper_id}' is not registered in the system. Register the paper first.",
            )

    try:
        res = import_curated_csv(
            db=db,
            file_content=content,
            curator_name=curator_name,
            filename=filename,
            fallback_paper_id=paper_id,
            fallback_source_page=source_page,
            fallback_source_table=source_table,
        )
        return res
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("", response_model=RecordResponse, status_code=status.HTTP_201_CREATED, summary="Create a candidate record")
def create_record(payload: RecordCreate, db: Session = Depends(get_db)) -> RecordResponse:
    # 1. Enforce foreign key existence for paper_id
    paper = PaperRepository.get_by_id(db, payload.paper_id)
    if not paper:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Referenced paper_id '{payload.paper_id}' does not exist. Register the paper first.",
        )

    # 2. Check for duplicate record_id if provided
    if payload.record_id:
        existing = RecordRepository.get_by_id(db, payload.record_id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Record with id '{payload.record_id}' already exists.",
            )

    data = payload.model_dump(exclude_unset=True)
    reviewer = data.pop("initial_reviewer", "system")
    reason = data.pop("creation_reason", "Initial candidate ingestion")

    record = ExperimentalRecord(**data)
    created = RecordRepository.create(db, record, reviewer=reviewer, reason=reason)
    return created


@router.get("", response_model=List[RecordResponse], summary="List and filter experimental records")
def list_records(
    paper_id: Optional[str] = Query(None, description="Filter by paper_id"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by review_status"),
    material_system: Optional[str] = Query(None, description="Filter by material_system"),
    value_origin: Optional[str] = Query(None, description="Filter by value_origin (e.g. synthetic)"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
) -> List[RecordResponse]:
    return RecordRepository.list_records(
        db,
        paper_id=paper_id,
        status=status_filter,
        material_system=material_system,
        value_origin=value_origin,
        skip=skip,
        limit=limit,
    )


@router.get("/{record_id}", response_model=RecordResponse, summary="Get experimental record by ID")
def get_record(record_id: str, db: Session = Depends(get_db)) -> RecordResponse:
    record = RecordRepository.get_by_id(db, record_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Record '{record_id}' not found.",
        )
    return record


@router.patch("/{record_id}/review", response_model=RecordResponse, summary="Apply review action or data correction")
def review_record(
    record_id: str,
    action_payload: RecordReviewAction,
    db: Session = Depends(get_db),
) -> RecordResponse:
    try:
        updated = RecordRepository.apply_review_action(
            db=db,
            record_id=record_id,
            reviewer=action_payload.reviewer,
            reason=action_payload.reason,
            new_status=action_payload.new_status,
            field_corrections=action_payload.field_corrections,
        )
        return updated
    except KeyError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{record_id}/history", response_model=List[ReviewHistoryResponse], summary="Get auditable review and correction history")
def get_record_history(record_id: str, db: Session = Depends(get_db)) -> List[ReviewHistoryResponse]:
    record = RecordRepository.get_by_id(db, record_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Record '{record_id}' not found.",
        )
    return RecordRepository.get_history(db, record_id)
