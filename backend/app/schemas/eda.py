from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class DescriptiveStatistic(BaseModel):
    """Statistical distribution summary for a single canonical attribute."""
    field_name: str
    field_type: str = Field(..., description="'numeric' or 'categorical'")
    total_count: int
    valid_count: int
    missing_count: int
    missing_pct: float
    mean: Optional[float] = None
    std: Optional[float] = None
    min: Optional[float] = None
    q1: Optional[float] = None
    median: Optional[float] = None
    q3: Optional[float] = None
    max: Optional[float] = None
    unique_count: Optional[int] = None
    value_counts: Optional[Dict[str, int]] = None


class FeatureAssessment(BaseModel):
    """Suitability and leakage risk audit for a candidate predictive feature or metadata field."""
    feature_name: str
    field_type: str
    is_leakage_risk: bool
    leakage_category: Optional[str] = None
    is_constant: bool
    is_near_constant: bool
    variance: Optional[float] = None
    unique_ratio: float
    suitability: str = Field(
        ...,
        description="'eligible_feature' | 'target_variable' | 'excluded_leakage' | 'excluded_low_variance' | 'metadata_only' | 'high_missingness'",
    )
    recommendation: str


class CorrelationFinding(BaseModel):
    """Bivariate Pearson correlation diagnostic between numeric formulation features."""
    feature_a: str
    feature_b: str
    pearson_r: float
    sample_pairs_n: int
    interpretation: str
    recommendation: str


class TargetReadinessReport(BaseModel):
    """Evidence-based readiness audit for an individual target property (PLAN.md Section 12).

    NOTE: Sample and paper thresholds (15 samples / 3 papers, 30 samples / 5 papers, 60% feature missingness)
    are project-defined operational criteria to ensure valid grouped cross-validation without paper-level
    leakage, not universal statistical laws. Readiness status signifies evaluation protocol eligibility,
    strictly decoupled from scientific validity (Phase 4) and model predictive accuracy (Phase 6).
    """
    target_property: str
    readiness_status: str = Field(
        ...,
        description="'ready_for_evaluation' | 'preliminary_limited_evidence' | 'unsupported_insufficient_data'",
    )
    eligible_sample_count: int
    distinct_paper_count: int
    distinct_experiment_group_count: int
    missing_target_count: int
    material_system_counts: Dict[str, int]
    feature_missingness_summary: Dict[str, float]
    grouped_evaluation_feasible: bool
    recommended_split_strategy: str
    justification: str
    limitations: List[str]


class AnalysisRunCreate(BaseModel):
    """Configuration options for initiating an EDA and readiness assessment run."""
    dataset_version_id: Optional[str] = Field(None, description="Optional frozen dataset snapshot ID")
    material_system: Optional[str] = Field(None, description="Filter to a single material system, or None for all")
    min_papers_for_grouped_eval: int = Field(3, description="Minimum independent literature sources required for grouped cross-validation")
    min_samples_for_evaluation: int = Field(15, description="Minimum accepted records required for provisional model evaluation")
    correlation_threshold: float = Field(0.95, description="Pearson |r| threshold for flagging extreme collinearity")
    exclude_synthetic: bool = Field(True, description="Enforce strict isolation of synthetic fixtures from research statistics")
    require_accepted_review: bool = Field(True, description="Only assess records with review_status='accepted'")


class AnalysisRunResponse(BaseModel):
    """Comprehensive output of an Exploratory Data Analysis and readiness run."""
    analysis_id: str
    dataset_version_id: Optional[str] = None
    material_system: Optional[str] = None
    schema_version: str
    analysis_config: Dict[str, Any]
    sample_summary: Dict[str, Any]
    descriptive_statistics: Dict[str, DescriptiveStatistic]
    feature_assessments: Dict[str, FeatureAssessment]
    correlation_findings: List[CorrelationFinding]
    target_readiness: Dict[str, TargetReadinessReport]
    limitations: List[str]
    created_at: datetime


class ReadinessOverviewResponse(BaseModel):
    """High-level summary of model readiness for both approved targets."""
    analysis_id: Optional[str] = None
    dataset_version_id: Optional[str] = None
    compressive_strength: TargetReadinessReport
    water_absorption: TargetReadinessReport
    general_limitations: List[str]
    evaluated_at: datetime
