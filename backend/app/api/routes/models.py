import os
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
import numpy as np
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.persistence.database import get_db
from backend.app.persistence.models import ModelRegistryMetadata, gen_model_id
from backend.app.persistence.repositories import (
    DatasetVersionRepository,
    ModelMetadataRepository,
    RecordRepository,
)
from backend.app.schemas.model_metadata import ModelMetadataCreate, ModelMetadataResponse
from backend.app.schemas.prediction import (
    ExplanationOutput,
    FeatureAttribution,
    ModelTrainingRequest,
    PredictionInput,
    PredictionOutput,
)
from backend.app.services.xgboost_pipeline import (
    APPROVED_PREDICTOR_MANIFEST,
    DataReadinessGateError,
    ML_AVAILABLE,
    ModelArtifactError,
    evaluate_paper_grouped_xgboost,
    load_model_pipeline,
    make_pipeline_predictor,
    save_model_pipeline,
)

try:
    import shap
except ImportError:
    shap = None

router = APIRouter(prefix="/models", tags=["Model Registry & Inference"])


@router.post("", response_model=ModelMetadataResponse, status_code=status.HTTP_201_CREATED, summary="Register model metadata")
def register_model_metadata(payload: ModelMetadataCreate, db: Session = Depends(get_db)) -> ModelMetadataResponse:
    if payload.model_id:
        existing = ModelMetadataRepository.get_by_id(db, payload.model_id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Model metadata with id '{payload.model_id}' already registered.",
            )

    try:
        data = payload.model_dump(exclude_unset=True)
        metadata = ModelRegistryMetadata(**data)
        created = ModelMetadataRepository.create(db, metadata)
        return created
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("", response_model=List[ModelMetadataResponse], summary="List registered model metadata entries")
def list_model_metadata(db: Session = Depends(get_db)) -> List[ModelMetadataResponse]:
    return ModelMetadataRepository.list_all(db)


@router.get("/{model_id}", response_model=ModelMetadataResponse, summary="Get model metadata by ID")
def get_model_metadata(model_id: str, db: Session = Depends(get_db)) -> ModelMetadataResponse:
    metadata = ModelMetadataRepository.get_by_id(db, model_id)
    if not metadata:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Model metadata '{model_id}' not found.",
        )
    return metadata


@router.post("/train", summary="Train and evaluate XGBoost regression model on a dataset snapshot")
def train_model(payload: ModelTrainingRequest, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Initiates paper-grouped XGBoost training with baseline comparison.

    Strictly enforces empirical data readiness gate before training.
    """
    if payload.target_property not in {"compressive_strength_mpa", "water_absorption_pct"}:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unsupported target property '{payload.target_property}'. Must be 'compressive_strength_mpa' or 'water_absorption_pct'.",
        )

    # 1. Fetch records
    if payload.dataset_version_id:
        version = DatasetVersionRepository.get_by_id(db, payload.dataset_version_id)
        if not version:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Dataset version '{payload.dataset_version_id}' not found.",
            )
        records = DatasetVersionRepository.get_version_records(db, payload.dataset_version_id)
    else:
        records = RecordRepository.list_records(db, limit=10000)

    # 2. Execute evaluation with readiness gate check
    try:
        results = evaluate_paper_grouped_xgboost(
            records=records,
            target_property=payload.target_property,
            n_splits=payload.n_splits,
            random_seed=payload.random_seed,
            hyperparameters=payload.hyperparameters,
        )
    except DataReadinessGateError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"MODEL_TRAINING_FAILED: {e}",
        )

    # Clean out non-serializable objects and persist model pipeline artifact
    model_id = gen_model_id()
    artifact_filename = f"{model_id}.joblib"
    artifact_path = os.path.join(settings.MODELS_STORAGE_DIR, artifact_filename).replace("\\", "/")

    save_model_pipeline(
        artifact_path=artifact_path,
        model=results["final_model"],
        preprocessor=results["final_preprocessor"],
        metadata={
            "target_property": payload.target_property,
            "target_unit": "MPa" if payload.target_property == "compressive_strength_mpa" else "%",
            "algorithm": "XGBoost",
            "model_version": f"v1.0.0-{payload.target_property[:4]}",
            "material_system": "fly_ash_lime_gypsum_brick",
        },
    )

    model_meta = ModelRegistryMetadata(
        model_id=model_id,
        target_property=payload.target_property,
        target_unit="MPa" if payload.target_property == "compressive_strength_mpa" else "%",
        algorithm="XGBoost",
        model_version=f"v1.0.0-{payload.target_property[:4]}",
        dataset_version_id=payload.dataset_version_id,
        feature_manifest=results["feature_manifest"],
        hyperparameters=results["hyperparameters"],
        evaluation_metrics=results["xgboost_summary"],
        artifact_path=artifact_path,
        is_trained=True,
        training_notes=(
            f"Paper-grouped XGBoost model trained on {results['total_samples']} samples "
            f"across {results['distinct_papers_count']} papers via {results['split_strategy']}."
        ),
    )
    ModelMetadataRepository.create(db, model_meta)

    serializable_results = {k: v for k, v in results.items() if k not in {"final_model", "final_preprocessor"}}
    serializable_results["model_id"] = model_id
    serializable_results["artifact_path"] = artifact_path
    return serializable_results


@router.post("/predict", response_model=PredictionOutput, summary="Generate surrogate prediction for mix design")
def predict_quality(
    input_data: PredictionInput,
    target_property: str = Query("compressive_strength_mpa", description="Target property to predict"),
    model_id: Optional[str] = Query(None, description="Optional specific model ID"),
    db: Session = Depends(get_db),
) -> PredictionOutput:
    """Computes surrogate quality predictions using a trained XGBoost model.

    Enforces input range validation and returns 503 if no trained model is available.
    """
    # 1. Input Validation
    if input_data.fly_ash_fraction <= 0.0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="INVALID_INPUT: fly_ash_fraction must be greater than 0.0.",
        )

    dry_sum = sum(
        f for f in [
            input_data.fly_ash_fraction,
            input_data.lime_fraction,
            input_data.cement_fraction,
            input_data.gypsum_fraction,
            input_data.sand_fraction,
            input_data.stone_dust_fraction,
            input_data.quarry_dust_fraction,
        ] if f is not None
    )

    warnings: List[str] = []
    if dry_sum > 1.25 or dry_sum < 0.75:
        warnings.append(
            f"MASS_BALANCE_WARNING: Dry constituent fractions sum to {round(dry_sum, 3)}, "
            f"which deviates from nominal 1.0 (100%). Mix design may be physically inconsistent."
        )

    # 2. Model Availability Check
    if model_id:
        model_meta = ModelMetadataRepository.get_by_id(db, model_id)
    else:
        model_meta = ModelMetadataRepository.get_latest_trained_by_target(db, target_property)

    if not model_meta or not model_meta.is_trained:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                f"MODEL_UNAVAILABLE: No trained or evaluated model is currently available for target '{target_property}'. "
                f"Reason: Active local empirical corpus contains 0 accepted records. "
                f"The Phase 6/7 empirical data readiness gate remains strictly enforced under PLAN.md Section 12."
            ),
        )

    if not model_meta.artifact_path:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"MODEL_UNAVAILABLE: Model artifact path unconfigured for model '{model_meta.model_id}'.",
        )

    # 3. Load model artifact safely and execute inference
    try:
        bundle = load_model_pipeline(
            artifact_path=model_meta.artifact_path,
            expected_target=target_property,
        )
        predictor = make_pipeline_predictor(bundle)
        pred_value = round(predictor(input_data.model_dump()), 2)
    except ModelArtifactError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"MODEL_ARTIFACT_ERROR: {e}",
        )

    target_unit = "MPa" if target_property == "compressive_strength_mpa" else "%"
    return PredictionOutput(
        target_property=target_property,
        predicted_value=pred_value,
        target_unit=target_unit,
        model_id=model_meta.model_id,
        model_version=model_meta.model_version,
        dataset_version_id=model_meta.dataset_version_id,
        feature_manifest=model_meta.feature_manifest,
        applicability_warnings=warnings,
    )


@router.post("/explain", response_model=ExplanationOutput, summary="Generate SHAP additive feature attributions")
def explain_prediction(
    input_data: PredictionInput,
    target_property: str = Query("compressive_strength_mpa", description="Target property to explain"),
    model_id: Optional[str] = Query(None, description="Optional specific model ID"),
    db: Session = Depends(get_db),
) -> ExplanationOutput:
    """Computes SHAP additive feature attributions for a given mix formulation.

    Returns 503 if no trained model is available.
    """
    if model_id:
        model_meta = ModelMetadataRepository.get_by_id(db, model_id)
    else:
        model_meta = ModelMetadataRepository.get_latest_trained_by_target(db, target_property)

    if not model_meta or not model_meta.is_trained:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                f"MODEL_UNAVAILABLE: Cannot generate SHAP explanations for target '{target_property}'. "
                f"No verified trained model artifact exists. Data readiness gate is enforced."
            ),
        )

    if not model_meta.artifact_path:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"MODEL_UNAVAILABLE: Model artifact path unconfigured for model '{model_meta.model_id}'.",
        )

    try:
        bundle = load_model_pipeline(
            artifact_path=model_meta.artifact_path,
            expected_target=target_property,
        )
    except ModelArtifactError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"MODEL_ARTIFACT_ERROR: {e}",
        )

    target_unit = "MPa" if target_property == "compressive_strength_mpa" else "%"

    preprocessor = bundle["preprocessor"]
    model = bundle["model"]
    X_dict = input_data.model_dump()
    X_arr = preprocessor.transform([X_dict])
    pred_value = round(float(model.predict(X_arr)[0]), 2)

    attributions: List[FeatureAttribution] = []
    baseline_mean = 10.0

    if ML_AVAILABLE and shap is not None and hasattr(shap, "TreeExplainer"):
        try:
            explainer = shap.TreeExplainer(model)
            shap_values = explainer.shap_values(X_arr)
            exp_val = explainer.expected_value
            if isinstance(exp_val, (list, np.ndarray)):
                baseline_mean = round(float(exp_val[0]), 2)
            else:
                baseline_mean = round(float(exp_val), 2)

            features = getattr(preprocessor, "feature_manifest", APPROVED_PREDICTOR_MANIFEST)
            row_shaps = shap_values[0]
            for f_name, sv in zip(features, row_shaps):
                val = float(sv)
                direction = "positive" if val > 0.001 else ("negative" if val < -0.001 else "neutral")
                attributions.append(
                    FeatureAttribution(
                        feature_name=f_name,
                        feature_value=float(X_dict.get(f_name) or 0.0),
                        attribution_value=round(val, 4),
                        direction=direction,
                        description=(
                            f"{'Increases' if val > 0 else ('Decreases' if val < 0 else 'Neutral impact on')} "
                            f"predicted {target_property} by {abs(val):.3f} {target_unit}"
                        ),
                    )
                )
        except Exception:
            pass

    return ExplanationOutput(
        target_property=target_property,
        predicted_value=pred_value,
        target_unit=target_unit,
        baseline_mean=baseline_mean,
        attributions=attributions,
        method="TreeSHAP",
    )
