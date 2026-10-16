from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class ModelMetadataBase(BaseModel):
    model_id: Optional[str] = Field(None, description="Model identifier (e.g. 'XGB-STRENGTH-v1.0')")
    target_property: str = Field(..., description="compressive_strength_mpa | water_absorption_pct")
    target_unit: str = Field(..., description="MPa | %")
    algorithm: str = Field("XGBoost", description="Regression algorithm name")
    model_version: str = Field(..., description="Version of the model code / training run")
    dataset_version_id: Optional[str] = Field(None, description="Trained dataset version identifier")
    feature_manifest: List[str] = Field(..., min_length=1, description="Ordered list of feature column names")
    hyperparameters: Optional[Dict[str, Any]] = None
    evaluation_metrics: Optional[Dict[str, Any]] = None
    artifact_path: Optional[str] = None
    is_trained: bool = Field(False, description="Whether model artifact exists and has been evaluated")
    training_notes: Optional[str] = None


class ModelMetadataCreate(ModelMetadataBase):
    pass


class ModelMetadataResponse(ModelMetadataBase):
    model_config = ConfigDict(from_attributes=True)

    created_at: datetime
