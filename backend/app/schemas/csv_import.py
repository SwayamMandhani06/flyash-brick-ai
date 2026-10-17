from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class CSVImportRowResult(BaseModel):
    """Result and diagnostics for an individual row processed from a curated CSV."""
    row_number: int = Field(..., description="1-indexed row number from the CSV file (excluding header)")
    record_id: Optional[str] = Field(None, description="Generated record identifier if row was successfully persisted")
    paper_id: Optional[str] = Field(None, description="Associated academic publication identifier")
    status: str = Field(..., description="'created' | 'warning' | 'error' | 'skipped'")
    errors: List[str] = Field(default_factory=list, description="Validation errors that prevented record creation")
    warnings: List[str] = Field(default_factory=list, description="Non-fatal data quality warnings or ambiguities")
    duplicate_suspect: bool = Field(False, description="Flag indicating potential duplicate of an existing record")
    matched_existing_record_id: Optional[str] = Field(None, description="ID of existing record matched for similarity")


class CSVImportResponse(BaseModel):
    """Structured response detailing the outcome of a curated research CSV import."""
    curator_name: str = Field(..., description="Name or identifier of the researcher responsible for this import batch")
    filename: str = Field(..., description="Original filename of the submitted CSV file")
    total_rows_processed: int = Field(..., description="Total data rows parsed from the CSV")
    imported_records_count: int = Field(..., description="Number of candidate records successfully created and persisted")
    rows_with_warnings_count: int = Field(..., description="Number of rows that produced quality or ambiguity warnings")
    rows_failed_count: int = Field(..., description="Number of rows that failed validation and were skipped")
    created_record_ids: List[str] = Field(default_factory=list, description="List of generated record IDs for review")
    row_results: List[CSVImportRowResult] = Field(default_factory=list, description="Granular row-by-row diagnostic results")
    summary: str = Field(..., description="High-level narrative summary of import batch and required next curation steps")
