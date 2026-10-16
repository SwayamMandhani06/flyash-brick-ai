from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.persistence.database import get_db
from backend.app.persistence.repositories import DatasetVersionRepository
from backend.app.schemas.dataset_version import (
    DatasetVersionCreate,
    DatasetVersionDetailResponse,
    DatasetVersionResponse,
)

router = APIRouter(prefix="/datasets/versions", tags=["Dataset Versions & Snapshots"])


@router.post("", response_model=DatasetVersionResponse, status_code=status.HTTP_201_CREATED, summary="Create an immutable dataset version snapshot")
def create_dataset_version(payload: DatasetVersionCreate, db: Session = Depends(get_db)) -> DatasetVersionResponse:
    existing = DatasetVersionRepository.get_by_id(db, payload.version_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Dataset version '{payload.version_id}' already exists and is immutable.",
        )

    try:
        created = DatasetVersionRepository.create_version(
            db=db,
            version_id=payload.version_id,
            schema_version=payload.schema_version,
            lifecycle_state=payload.lifecycle_state,
            description=payload.description,
            record_ids=payload.record_ids,
        )
        return created
    except KeyError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("", response_model=List[DatasetVersionResponse], summary="List all dataset snapshots")
def list_dataset_versions(db: Session = Depends(get_db)) -> List[DatasetVersionResponse]:
    return DatasetVersionRepository.list_versions(db)


@router.get("/{version_id}", response_model=DatasetVersionDetailResponse, summary="Get dataset snapshot details and member records")
def get_dataset_version(version_id: str, db: Session = Depends(get_db)) -> DatasetVersionDetailResponse:
    version = DatasetVersionRepository.get_by_id(db, version_id)
    if not version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dataset version '{version_id}' not found.",
        )

    records = DatasetVersionRepository.get_version_records(db, version_id)
    record_ids = [r.record_id for r in records]

    return DatasetVersionDetailResponse(
        version_id=version.version_id,
        schema_version=version.schema_version,
        lifecycle_state=version.lifecycle_state,
        description=version.description,
        record_count=version.record_count,
        is_frozen=version.is_frozen,
        created_at=version.created_at,
        included_record_ids=record_ids,
    )
