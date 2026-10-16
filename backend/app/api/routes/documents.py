import os
from typing import List, Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.persistence.database import get_db
from backend.app.persistence.models import Document, ExperimentalRecord
from backend.app.persistence.repositories import DocumentRepository, PaperRepository
from backend.app.schemas.document import DocumentExtractResponse, DocumentResponse
from backend.app.schemas.record import RecordResponse
from backend.app.services.pdf_extractor import (
    calculate_sha256,
    extract_pdf_data,
    save_pdf_to_storage,
    validate_pdf_content,
)

router = APIRouter(prefix="/documents", tags=["Literature PDF Ingestion & Extraction"])


@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED, summary="Upload and register a research PDF")
async def upload_document(
    file: UploadFile = File(..., description="Research publication PDF file"),
    paper_id: Optional[str] = Form(None, description="Optional ID of associated registered paper"),
    db: Session = Depends(get_db),
) -> DocumentResponse:
    # 1. Validate file extension
    filename = file.filename or "unknown.pdf"
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="UNSUPPORTED_FILE_TYPE: Only PDF documents (.pdf) are supported.",
        )

    # 2. Read content safely
    try:
        content = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"READ_ERROR: Could not read uploaded file content: {e}",
        )

    # 3. Validate content signature and length
    try:
        validate_pdf_content(content)
    except ValueError as e:
        err_msg = str(e)
        if "FILE_TOO_LARGE" in err_msg:
            raise HTTPException(status_code=413, detail=err_msg)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err_msg)

    # 4. Check paper existence if paper_id supplied
    if paper_id:
        paper = PaperRepository.get_by_id(db, paper_id)
        if not paper:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Referenced paper_id '{paper_id}' does not exist.",
            )

    # 5. Compute SHA-256 for cryptographic identity and deduplication
    sha256_hash = calculate_sha256(content)
    existing = DocumentRepository.get_by_hash(db, sha256_hash)
    if existing:
        # Document already registered with this exact hash (safe idempotent return)
        return existing

    # 6. Save PDF to configured isolated storage
    storage_filename, clean_name = save_pdf_to_storage(content, filename)

    # 7. Create database document registry record
    doc = Document(
        paper_id=paper_id,
        original_filename=clean_name,
        stored_path=storage_filename,
        file_size_bytes=len(content),
        sha256_hash=sha256_hash,
        status="uploaded",
    )
    created = DocumentRepository.create(db, doc)
    return created


@router.post("/{document_id}/extract", response_model=DocumentExtractResponse, summary="Extract text, tables, and candidates from document")
def extract_document(
    document_id: str,
    paper_id: Optional[str] = None,
    db: Session = Depends(get_db),
) -> DocumentExtractResponse:
    doc = DocumentRepository.get_by_id(db, document_id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document '{document_id}' not found.",
        )

    if paper_id:
        doc.paper_id = paper_id

    full_path = os.path.join(settings.DOCUMENTS_STORAGE_DIR, doc.stored_path)

    # Run extraction service
    page_count, page_summaries, candidate_dicts, warnings, error_message = extract_pdf_data(full_path)

    if error_message:
        doc.status = "failed"
        doc.error_message = error_message
        doc.warning_messages = warnings
        db.commit()
        raise HTTPException(status_code=422, detail=error_message)

    # Determine status
    if "SCANNED_PDF_DETECTED" in " ".join(warnings):
        doc.status = "scanned_image_only"
    else:
        doc.status = "extracted"

    doc.page_count = page_count
    doc.extracted_pages_count = len(page_summaries)
    doc.warning_messages = warnings
    doc.error_message = None

    # Persist extracted candidate records
    saved_records = DocumentRepository.save_candidates(
        db=db,
        doc=doc,
        candidate_dicts=candidate_dicts,
        paper_id=doc.paper_id,
    )

    db.commit()
    db.refresh(doc)

    return DocumentExtractResponse(
        document_id=doc.document_id,
        paper_id=doc.paper_id,
        status=doc.status,
        page_count=page_count,
        extracted_pages=page_summaries,
        candidate_records_count=len(saved_records),
        candidate_record_ids=[r.record_id for r in saved_records],
        warnings=warnings,
    )


@router.get("", response_model=List[DocumentResponse], summary="List ingested literature documents")
def list_documents(
    paper_id: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
) -> List[DocumentResponse]:
    return DocumentRepository.list_all(db, paper_id=paper_id, status=status, skip=skip, limit=limit)


@router.get("/{document_id}", response_model=DocumentResponse, summary="Get document metadata by ID")
def get_document(document_id: str, db: Session = Depends(get_db)) -> DocumentResponse:
    doc = DocumentRepository.get_by_id(db, document_id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document '{document_id}' not found.",
        )
    return doc


@router.get("/{document_id}/candidates", response_model=List[RecordResponse], summary="List candidate records extracted from document")
def get_document_candidates(document_id: str, db: Session = Depends(get_db)) -> List[RecordResponse]:
    doc = DocumentRepository.get_by_id(db, document_id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document '{document_id}' not found.",
        )

    stmt = (
        select(ExperimentalRecord)
        .where(ExperimentalRecord.document_id == document_id)
        .order_by(ExperimentalRecord.created_at.asc())
    )
    return list(db.scalars(stmt).all())
