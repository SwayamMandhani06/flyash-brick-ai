from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class PaperBase(BaseModel):
    doi_or_url: Optional[str] = Field(None, description="DOI identifier or stable URL")
    title: str = Field(..., min_length=3, description="Publication title")
    authors: str = Field(..., min_length=2, description="Publication authors (e.g. 'Kumar & Prasad')")
    journal: Optional[str] = Field(None, description="Publishing journal or conference venue")
    publication_year: Optional[int] = Field(None, ge=1950, le=2050, description="Publication calendar year")
    material_system: str = Field(
        "fly_ash_lime_gypsum_brick", description="Material system identifier"
    )
    notes: Optional[str] = Field(None, description="Bibliographic or provenance notes")


class PaperCreate(PaperBase):
    paper_id: Optional[str] = Field(None, description="Stable unique identifier for the paper (auto-generated if omitted)")


class PaperResponse(PaperBase):
    model_config = ConfigDict(from_attributes=True)

    paper_id: str
    created_at: datetime
