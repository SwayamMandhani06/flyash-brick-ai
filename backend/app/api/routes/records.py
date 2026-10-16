from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from backend.app.persistence.database import get_db
from backend.app.persistence.models import ExperimentalRecord
from backend.app.persistence.repositories import PaperRepository, RecordRepository
from backend.app.schemas.record import (
    RecordCreate,
    RecordResponse,
    RecordReviewAction,
    ReviewHistoryResponse,
)

router = APIRouter(prefix="/records", tags=["Experimental Records"])


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
