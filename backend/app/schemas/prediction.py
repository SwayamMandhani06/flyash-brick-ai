from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class PredictionInput(BaseModel):
    """Manufacturing mix parameters submitted for surrogate model inference."""
    material_system: str = Field("fly_ash_lime_gypsum_brick", description="Material system identifier")
    fly_ash_fraction: float = Field(..., ge=0.0, le=1.0, description="Dry mass fraction of fly ash")
    lime_fraction: Optional[float] = Field(None, ge=0.0, le=1.0, description="Dry mass fraction of hydrated lime")
    cement_fraction: Optional[float] = Field(None, ge=0.0, le=1.0, description="Dry mass fraction of cement (OPC)")
    gypsum_fraction: Optional[float] = Field(None, ge=0.0, le=1.0, description="Dry mass fraction of gypsum")
    sand_fraction: Optional[float] = Field(None, ge=0.0, le=1.0, description="Dry mass fraction of river sand")
    stone_dust_fraction: Optional[float] = Field(None, ge=0.0, le=1.0, description="Dry mass fraction of stone dust")
    quarry_dust_fraction: Optional[float] = Field(None, ge=0.0, le=1.0, description="Dry mass fraction of quarry dust")
    water_content_or_ratio: Optional[float] = Field(None, ge=0.0, description="Water ratio or content")
    water_basis: Optional[str] = Field("water_binder_ratio", description="Basis of water measurement")
    curing_duration_days: Optional[int] = Field(28, ge=1, description="Curing period in days")
    curing_temperature_c: Optional[float] = Field(27.0, ge=0.0, description="Curing temperature in degrees Celsius")
    compaction_pressure_mpa: Optional[float] = Field(None, ge=0.0, description="Molding compaction pressure in MPa")
    density_kg_m3: Optional[float] = Field(None, ge=0.0, description="Dry or bulk density in kg/m3")


class PredictionOutput(BaseModel):
    """Surrogate quality prediction response with metadata and provenance."""
    target_property: str = Field(..., description="Target property predicted (e.g. compressive_strength_mpa)")
    predicted_value: float = Field(..., description="Predicted numerical value")
    target_unit: str = Field(..., description="Measurement unit (MPa or %)")
    model_id: str = Field(..., description="Identifier of the model used for inference")
    model_version: str = Field(..., description="Version identifier of the model artifact")
    dataset_version_id: Optional[str] = Field(None, description="Dataset snapshot version on which model was trained")
    feature_manifest: List[str] = Field(..., description="List of features consumed by model")
    baseline_mean: Optional[float] = Field(None, description="Reference baseline mean prediction")
    applicability_warnings: List[str] = Field(default_factory=list, description="Extrapolation or domain warnings")
    disclaimer: str = Field(
        "Surrogate machine learning estimate for scientific exploration. Does not replace physical test standard validation under IS 3495.",
        description="Scientific qualification disclaimer",
    )


class FeatureAttribution(BaseModel):
    """Additive feature attribution item for model explainability."""
    feature_name: str
    feature_value: Optional[float] = None
    attribution_value: float
    direction: str = Field(..., description="positive | negative | neutral")
    description: str


class ExplanationOutput(BaseModel):
    """SHAP model attribution explanation for an individual prediction."""
    target_property: str
    predicted_value: float
    target_unit: str
    baseline_mean: float
    attributions: List[FeatureAttribution]
    method: str = "TreeSHAP"
    disclaimer: str = (
        "Additive SHAP values indicate feature contributions to the fitted model prediction; "
        "they do not establish causal physical relationships."
    )


class ModelTrainingRequest(BaseModel):
    """Request payload to initiate model training on an accepted dataset snapshot."""
    target_property: str = Field(..., description="compressive_strength_mpa | water_absorption_pct")
    dataset_version_id: Optional[str] = Field(None, description="Dataset version snapshot ID to train on")
    hyperparameters: Optional[Dict[str, Any]] = None
    n_splits: int = Field(5, ge=2, le=10, description="Number of paper-grouped cross-validation folds")
    random_seed: int = Field(42, description="Random seed for reproducibility")
