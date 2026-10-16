from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.persistence.database import get_db
from backend.app.persistence.models import ModelRegistryMetadata
from backend.app.persistence.repositories import ModelMetadataRepository
from backend.app.schemas.model_metadata import ModelMetadataCreate, ModelMetadataResponse

router = APIRouter(prefix="/models", tags=["Model Registry Metadata"])


@router.post("", response_model=ModelMetadataResponse, status_code=status.HTTP_201_CREATED, summary="Register model metadata")
def register_model_metadata(payload: ModelMetadataCreate, db: Session = Depends(get_db)) -> ModelMetadataResponse:
    if payload.model_id:
        existing = ModelMetadataRepository.get_by_id(db, payload.model_id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Model metadata with id '{payload.model_id}' already registered.",
            )

    try:
        data = payload.model_dump(exclude_unset=True)
        metadata = ModelRegistryMetadata(**data)
        created = ModelMetadataRepository.create(db, metadata)
        return created
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("", response_model=List[ModelMetadataResponse], summary="List registered model metadata entries")
def list_model_metadata(db: Session = Depends(get_db)) -> List[ModelMetadataResponse]:
    return ModelMetadataRepository.list_all(db)


@router.get("/{model_id}", response_model=ModelMetadataResponse, summary="Get model metadata by ID")
def get_model_metadata(model_id: str, db: Session = Depends(get_db)) -> ModelMetadataResponse:
    metadata = ModelMetadataRepository.get_by_id(db, model_id)
    if not metadata:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Model metadata '{model_id}' not found.",
        )
    return metadata
