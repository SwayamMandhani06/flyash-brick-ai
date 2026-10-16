from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.persistence.database import get_db
from backend.app.persistence.models import ExperimentalRecord
from backend.app.persistence.repositories import RecordRepository, ValidationRepository
from backend.app.schemas.validation import (
    NormalizationResponse,
    ValidationFindingResponse,
    ValidationRunResponse,
)
from backend.app.services.validator import (
    build_normalization_response,
    validate_and_normalize_record,
)

router = APIRouter(tags=["Scientific Validation & Normalization"])


@router.post(
    "/records/{record_id}/validate",
    response_model=ValidationRunResponse,
    status_code=status.HTTP_200_OK,
    summary="Validate an experimental record against scientific and provenance rules",
)
def validate_record(record_id: str, db: Session = Depends(get_db)) -> ValidationRunResponse:
    record = RecordRepository.get_by_id(db, record_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Record '{record_id}' not found.",
        )

    run, findings = validate_and_normalize_record(record, db)
    saved_run = ValidationRepository.save_run(db, run, findings)
    return saved_run


@router.get(
    "/records/{record_id}/validation",
    response_model=ValidationRunResponse,
    summary="Retrieve latest scientific validation run and findings for a record",
)
def get_latest_validation(record_id: str, db: Session = Depends(get_db)) -> ValidationRunResponse:
    record = RecordRepository.get_by_id(db, record_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Record '{record_id}' not found.",
        )

    run = ValidationRepository.get_latest_run_for_record(db, record_id)
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Record '{record_id}' has not been validated yet. Call POST /api/records/{record_id}/validate first.",
        )
    return run


@router.get(
    "/validation/runs/{run_id}",
    response_model=ValidationRunResponse,
    summary="Retrieve specific validation run by run_id",
)
def get_validation_run(run_id: str, db: Session = Depends(get_db)) -> ValidationRunResponse:
    run = ValidationRepository.get_run_by_id(db, run_id)
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Validation run '{run_id}' not found.",
        )
    return run


@router.get(
    "/records/{record_id}/validation/findings",
    response_model=List[ValidationFindingResponse],
    summary="List all validation findings across runs for a record",
)
def list_record_findings(record_id: str, db: Session = Depends(get_db)) -> List[ValidationFindingResponse]:
    record = RecordRepository.get_by_id(db, record_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Record '{record_id}' not found.",
        )
    return ValidationRepository.list_findings_for_record(db, record_id)


@router.get(
    "/records/{record_id}/validation/runs",
    response_model=List[ValidationRunResponse],
    summary="List all historical validation runs for a record",
)
def list_record_runs(record_id: str, db: Session = Depends(get_db)) -> List[ValidationRunResponse]:
    record = RecordRepository.get_by_id(db, record_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Record '{record_id}' not found.",
        )
    return ValidationRepository.list_runs_for_record(db, record_id)


@router.post(
    "/records/{record_id}/normalize",
    response_model=NormalizationResponse,
    summary="Execute scientific normalization and return original vs normalized comparison",
)
def normalize_record(record_id: str, db: Session = Depends(get_db)) -> NormalizationResponse:
    record = RecordRepository.get_by_id(db, record_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Record '{record_id}' not found.",
        )

    run, findings = validate_and_normalize_record(record, db)
    saved_run = ValidationRepository.save_run(db, run, findings)
    return build_normalization_response(record, saved_run)


@router.get(
    "/records/{record_id}/normalized",
    response_model=NormalizationResponse,
    summary="Retrieve original vs normalized values comparison for an experimental record",
)
def get_normalized_record(record_id: str, db: Session = Depends(get_db)) -> NormalizationResponse:
    record = RecordRepository.get_by_id(db, record_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Record '{record_id}' not found.",
        )

    run = ValidationRepository.get_latest_run_for_record(db, record_id)
    if not run:
        # Run validation on-demand if not already validated
        run, findings = validate_and_normalize_record(record, db)
        run = ValidationRepository.save_run(db, run, findings)

    return build_normalization_response(record, run)
