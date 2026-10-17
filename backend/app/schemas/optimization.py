from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class TargetPerformanceRequirements(BaseModel):
    """User-specified target property thresholds for feasible candidate acceptance."""
    min_compressive_strength_mpa: Optional[float] = Field(
        None, ge=0.0, description="Minimum acceptable 28-day compressive strength in MPa"
    )
    max_water_absorption_pct: Optional[float] = Field(
        None, ge=0.0, le=50.0, description="Maximum allowable 24-hr water absorption in percent"
    )


class FormulationConstraints(BaseModel):
    """Configurable constituent bounds and process constraints for mix exploration."""
    min_fly_ash_fraction: float = Field(0.30, ge=0.0, le=1.0, description="Minimum fly ash dry fraction")
    max_fly_ash_fraction: float = Field(0.85, ge=0.0, le=1.0, description="Maximum fly ash dry fraction")
    min_lime_fraction: Optional[float] = Field(None, ge=0.0, le=1.0)
    max_lime_fraction: Optional[float] = Field(None, ge=0.0, le=1.0)
    min_cement_fraction: Optional[float] = Field(None, ge=0.0, le=1.0)
    max_cement_fraction: Optional[float] = Field(None, ge=0.0, le=1.0)
    min_gypsum_fraction: Optional[float] = Field(None, ge=0.0, le=1.0)
    max_gypsum_fraction: Optional[float] = Field(None, ge=0.0, le=1.0)
    min_sand_fraction: Optional[float] = Field(None, ge=0.0, le=1.0)
    max_sand_fraction: Optional[float] = Field(None, ge=0.0, le=1.0)
    min_stone_dust_fraction: Optional[float] = Field(None, ge=0.0, le=1.0)
    max_stone_dust_fraction: Optional[float] = Field(None, ge=0.0, le=1.0)
    min_quarry_dust_fraction: Optional[float] = Field(None, ge=0.0, le=1.0)
    max_quarry_dust_fraction: Optional[float] = Field(None, ge=0.0, le=1.0)
    min_water_content_or_ratio: float = Field(0.12, ge=0.0, description="Minimum water ratio/content")
    max_water_content_or_ratio: float = Field(0.40, ge=0.0, description="Maximum water ratio/content")
    water_basis: str = Field("water_binder_ratio", description="water_binder_ratio | water_dry_mix_percentage")
    curing_duration_days: int = Field(28, ge=1, description="Curing period in days")
    curing_temperature_c: float = Field(27.0, ge=0.0, description="Curing temperature in Celsius")
    compaction_pressure_mpa: Optional[float] = Field(None, ge=0.0, description="Compaction molding pressure in MPa")
    density_kg_m3: Optional[float] = Field(None, ge=0.0, description="Target dry density in kg/m3")


class OptimizationRequest(BaseModel):
    """Specification submitted to the formulation optimizer."""
    material_system: str = Field(
        "fly_ash_lime_gypsum_brick",
        description="Material system: 'fly_ash_lime_gypsum_brick' (FaL-G) or 'cement_fly_ash_brick'",
    )
    primary_objective: str = Field(
        "balanced_pareto",
        description="Primary ranking goal: 'maximize_fly_ash' | 'maximize_strength' | 'minimize_water_absorption' | 'balanced_pareto'",
    )
    performance_requirements: TargetPerformanceRequirements = Field(
        default_factory=TargetPerformanceRequirements,
        description="User-defined quality thresholds",
    )
    formulation_constraints: Optional[FormulationConstraints] = Field(
        None, description="Optional custom constituent range bounds"
    )
    max_candidates: int = Field(300, ge=10, le=2000, description="Number of candidate formulations to generate in search")
    top_k: int = Field(5, ge=1, le=20, description="Number of top feasible candidates to return")
    random_seed: int = Field(42, description="Random seed for deterministic search reproducibility")
    dataset_version_id: Optional[str] = Field(None, description="Optional dataset snapshot version ID")


class CandidateFormulation(BaseModel):
    """Evaluated candidate manufacturing formulation with predicted quality and feasibility."""
    candidate_id: str
    rank: int
    material_system: str
    mix_proportions: Dict[str, float]
    dry_mass_sum: float
    water_parameter: Dict[str, Any]
    curing_parameters: Dict[str, Any]
    predicted_compressive_strength_mpa: Optional[float]
    predicted_water_absorption_pct: Optional[float]
    is_feasible: bool
    constraint_violations: List[str]
    supported_domain_status: str = Field(
        ...,
        description="'supported' (inside empirical bounds) | 'extrapolated' (outside empirical domain) | 'unverified_no_empirical_baseline'",
    )
    objective_score: float
    is_pareto_optimal: bool


class OptimizationResponse(BaseModel):
    """Response payload containing ranked manufacturing candidates and execution provenance."""
    run_id: str
    status: str = Field(..., description="'completed' | 'blocked' | 'no_feasible_solution'")
    material_system: str
    primary_objective: str
    algorithm_version: str = "v1.0.0-bounded-search"
    random_seed: int
    search_space_generated: int
    feasible_candidates_count: int
    models_used: Dict[str, str]
    dataset_version_id: Optional[str] = None
    recommended_candidates: List[CandidateFormulation]
    rejection_summary: Dict[str, int]
    warnings: List[str]
    disclaimer: str = (
        "Surrogate machine learning recommendations for research exploration. "
        "Predictions do not guarantee factory performance or statutory IS 12894:2002 compliance. "
        "All candidate formulations require pilot testing and physical verification under IS 3495."
    )
    created_at: datetime
