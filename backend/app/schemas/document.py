from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    document_id: str = Field(..., description="Unique document identifier")
    paper_id: Optional[str] = Field(None, description="Linked academic paper identifier")
    original_filename: str = Field(..., description="Original uploaded filename (basename)")
    file_size_bytes: int = Field(..., description="File size in bytes")
    sha256_hash: str = Field(..., description="Cryptographic SHA-256 hash of the uploaded PDF file")
    page_count: Optional[int] = Field(None, description="Total pages detected in the PDF")
    status: str = Field(
        ...,
        description="uploaded | extracting | extracted | failed | scanned_image_only",
    )
    error_message: Optional[str] = Field(None, description="Structured extraction error if failed")
    warning_messages: Optional[List[str]] = Field(None, description="Extraction warnings or diagnostic flags")
    extracted_pages_count: Optional[int] = Field(None, description="Number of successfully parsed pages")
    created_at: datetime = Field(..., description="Upload timestamp")


class ExtractedPageSummary(BaseModel):
    page_number: int = Field(..., description="1-indexed page number in the source PDF")
    text_character_count: int = Field(..., description="Number of extracted text characters")
    text_snippet: str = Field(..., description="Initial excerpt of extracted text")
    table_count: int = Field(..., description="Number of detected tables on this page")
    tables_preview: Optional[List[List[List[Optional[str]]]]] = Field(
        None, description="Extracted table cell matrices for preview"
    )


class DocumentExtractResponse(BaseModel):
    document_id: str
    paper_id: Optional[str] = None
    status: str
    page_count: int
    extracted_pages: List[ExtractedPageSummary]
    candidate_records_count: int
    candidate_record_ids: List[str]
    warnings: List[str]
