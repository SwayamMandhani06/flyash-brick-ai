from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.persistence.database import get_db
from backend.app.persistence.models import Paper
from backend.app.persistence.repositories import PaperRepository
from backend.app.schemas.paper import PaperCreate, PaperResponse

router = APIRouter(prefix="/papers", tags=["Paper Registry"])


@router.post("", response_model=PaperResponse, status_code=status.HTTP_201_CREATED, summary="Register a paper")
def register_paper(payload: PaperCreate, db: Session = Depends(get_db)) -> PaperResponse:
    if payload.paper_id:
        existing = PaperRepository.get_by_id(db, payload.paper_id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Paper with id '{payload.paper_id}' is already registered.",
            )
    if payload.doi_or_url:
        existing_doi = PaperRepository.get_by_doi(db, payload.doi_or_url)
        if existing_doi:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Paper with DOI/URL '{payload.doi_or_url}' is already registered as '{existing_doi.paper_id}'.",
            )

    paper_data = payload.model_dump(exclude_unset=True)
    paper = Paper(**paper_data)
    created = PaperRepository.create(db, paper)
    return created


@router.get("", response_model=List[PaperResponse], summary="List registered papers")
def list_papers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)) -> List[PaperResponse]:
    return PaperRepository.list_all(db, skip=skip, limit=limit)


@router.get("/{paper_id}", response_model=PaperResponse, summary="Get paper by identifier")
def get_paper(paper_id: str, db: Session = Depends(get_db)) -> PaperResponse:
    paper = PaperRepository.get_by_id(db, paper_id)
    if not paper:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Paper '{paper_id}' not found.",
        )
    return paper
