from datetime import datetime
from typing import List
from pydantic import BaseModel, ConfigDict, Field


class DatasetVersionCreate(BaseModel):
    version_id: str = Field(..., min_length=2, description="Stable identifier (e.g. 'v1.0.0-snapshot')")
    schema_version: str = Field("v1.0.0-canonical", description="Canonical schema version")
    lifecycle_state: str = Field(
        ..., description="raw | candidate | reviewed | model_ready | synthetic_test_only"
    )
    description: str = Field(..., min_length=5, description="Description of snapshot scope and inclusion criteria")
    record_ids: List[str] = Field(..., min_length=1, description="List of record IDs included in this snapshot")


class DatasetVersionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    version_id: str
    schema_version: str
    lifecycle_state: str
    description: str
    record_count: int
    is_frozen: bool
    created_at: datetime


class DatasetVersionDetailResponse(DatasetVersionResponse):
    included_record_ids: List[str] = Field(default_factory=list)
