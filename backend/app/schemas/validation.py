from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict


class ValidationFindingResponse(BaseModel):
    """Granular scientific validation finding or unit/mass conversion rule diagnostic."""
    finding_id: str
    run_id: str
    record_id: str
    rule_id: str
    severity: str  # info | warning | error
    finding_code: str
    message: str
    field_name: Optional[str] = None
    original_value: Optional[str] = None
    original_unit: Optional[str] = None
    normalized_value: Optional[str] = None
    normalized_unit: Optional[str] = None
    evidence_rationale: Optional[str] = None
    suggested_action: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ValidationRunResponse(BaseModel):
    """Reproducible, auditable record of scientific validation run and findings."""
    run_id: str
    record_id: str
    rule_version: str
    schema_version: str
    status: str  # passed | passed_with_warnings | failed
    is_eligible_for_model_ready: bool
    is_eligible_for_compressive_strength: bool = False
    is_eligible_for_water_absorption: bool = False
    normalized_values: Optional[Dict[str, Any]] = None
    summary: Optional[str] = None
    findings: List[ValidationFindingResponse] = []
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NormalizationResponse(BaseModel):
    """Paired view of original reported values vs normalized and derived values."""
    record_id: str
    run_id: str
    original_values: Dict[str, Any]
    normalized_values: Dict[str, Any]
    conversions_applied: List[Dict[str, Any]] = []
    dry_mass_total: Optional[float] = None
    dry_mass_balance_status: str  # nominal | under_sum | over_sum | indeterminate
    derived_water_binder_ratio: Optional[float] = None
    is_eligible_for_model_ready: bool
    is_eligible_for_compressive_strength: bool = False
    is_eligible_for_water_absorption: bool = False
