from typing import Any, Dict, List
from pydantic import BaseModel, Field


class FieldDictionaryEntry(BaseModel):
    name: str
    data_type: str
    unit: str
    nullable: bool
    description: str


class DataDictionaryResponse(BaseModel):
    schema_version: str = Field(..., description="Active canonical schema version")
    record_grain: str = Field(
        ...,
        description="Definition of what one row represents (one experimental formulation/result under defined conditions)",
    )
    material_system: str
    fields: List[FieldDictionaryEntry]
    lifecycle_states: List[str]
    review_statuses: List[str]
