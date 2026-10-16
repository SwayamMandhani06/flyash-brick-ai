from typing import Dict
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field(..., description="Process health status indicator (e.g. 'ok')")
    app_name: str = Field(..., description="Application name")
    version: str = Field(..., description="Application software version")
    environment: str = Field(..., description="Current deployment environment")
    timestamp: str = Field(..., description="Current UTC ISO-8601 timestamp")


class ReadinessResponse(BaseModel):
    status: str = Field(..., description="API foundation readiness status (e.g. 'ready')")
    subsystems: Dict[str, str] = Field(
        ...,
        description="Truthful operational status of platform subsystems (operational or deferred_phase_*)",
    )
    timestamp: str = Field(..., description="Current UTC ISO-8601 timestamp")
