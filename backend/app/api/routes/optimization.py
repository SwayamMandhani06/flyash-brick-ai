from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.app.persistence.database import get_db
from backend.app.persistence.models import OptimizationRun
from backend.app.persistence.repositories import (
    ModelMetadataRepository,
    OptimizationRepository,
)
from backend.app.schemas.optimization import (
    CandidateFormulation,
    OptimizationRequest,
    OptimizationResponse,
)
from backend.app.services.optimization_service import (
    ConstrainedMixOptimizer,
    OptimizationReadinessError,
    UnsupportedMaterialSystemError,
    check_optimization_readiness,
)
from backend.app.services.xgboost_pipeline import (
    ModelArtifactError,
    load_model_pipeline,
    make_pipeline_predictor,
)

router = APIRouter(prefix="/optimization", tags=["Constrained Formulation Optimization"])


@router.post(
    "/run",
    response_model=OptimizationResponse,
    summary="Execute constrained mix formulation optimization",
    description="Searches for feasible fly ash brick formulations under explicit constraints. Strictly blocks execution when models are unready.",
)
def run_optimization_endpoint(
    payload: OptimizationRequest,
    db: Session = Depends(get_db),
) -> OptimizationResponse:
    # 1. Enforce Empirical Readiness Gate
    try:
        strength_model, absorption_model = check_optimization_readiness(
            db=db,
            material_system=payload.material_system,
            dataset_version_id=payload.dataset_version_id,
            allow_test_models=False,
        )
    except OptimizationReadinessError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        )
    except UnsupportedMaterialSystemError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        )

    # 2. When trained models are available, safely load the registered model artifacts
    if not strength_model or not strength_model.artifact_path:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="MODEL_UNAVAILABLE: Compressive strength model artifact path is unconfigured or unregistered.",
        )
    if not absorption_model or not absorption_model.artifact_path:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="MODEL_UNAVAILABLE: Water absorption model artifact path is unconfigured or unregistered.",
        )

    try:
        strength_bundle = load_model_pipeline(
            artifact_path=strength_model.artifact_path,
            expected_target="compressive_strength_mpa",
            expected_material_system=payload.material_system,
        )
        absorption_bundle = load_model_pipeline(
            artifact_path=absorption_model.artifact_path,
            expected_target="water_absorption_pct",
            expected_material_system=payload.material_system,
        )
        strength_predictor = make_pipeline_predictor(strength_bundle)
        absorption_predictor = make_pipeline_predictor(absorption_bundle)
    except ModelArtifactError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"MODEL_ARTIFACT_ERROR: {e}",
        )

    optimizer = ConstrainedMixOptimizer(
        request=payload,
        strength_predictor=strength_predictor,
        absorption_predictor=absorption_predictor,
    )
    result = optimizer.run_optimization()

    # 3. Persist optimization run for auditability
    run_obj = OptimizationRun(
        material_system=payload.material_system,
        status=result["status"],
        primary_objective=payload.primary_objective,
        algorithm_version=result["algorithm_version"],
        random_seed=payload.random_seed,
        performance_requirements=payload.performance_requirements.model_dump(),
        formulation_constraints=payload.formulation_constraints.model_dump() if payload.formulation_constraints else {},
        models_used={
            "compressive_strength_mpa": strength_model.model_id if strength_model else "unregistered",
            "water_absorption_pct": absorption_model.model_id if absorption_model else "unregistered",
        },
        dataset_version_id=payload.dataset_version_id,
        search_space_generated=result["search_space_generated"],
        feasible_candidates_count=result["feasible_candidates_count"],
        recommended_candidates=[
            (c if isinstance(c, dict) else c.model_dump()) for c in result["recommended_candidates"]
        ],
        rejection_summary=result["rejection_summary"],
        warnings=result["warnings"],
        disclaimer=(
            "Surrogate machine learning recommendations for research exploration. "
            "Predictions do not guarantee factory performance or statutory IS 12894:2002 compliance. "
            "All candidate formulations require pilot testing and physical verification under IS 3495."
        ),
    )
    persisted = OptimizationRepository.create(db, run_obj)

    return OptimizationResponse(
        run_id=persisted.run_id,
        status=persisted.status,
        material_system=persisted.material_system,
        primary_objective=persisted.primary_objective,
        algorithm_version=persisted.algorithm_version,
        random_seed=persisted.random_seed,
        search_space_generated=persisted.search_space_generated,
        feasible_candidates_count=persisted.feasible_candidates_count,
        models_used=persisted.models_used,
        dataset_version_id=persisted.dataset_version_id,
        recommended_candidates=[
            CandidateFormulation(**c) for c in persisted.recommended_candidates
        ],
        rejection_summary=persisted.rejection_summary,
        warnings=persisted.warnings,
        disclaimer=persisted.disclaimer,
        created_at=persisted.created_at,
    )


@router.post(
    "",
    response_model=OptimizationResponse,
    summary="Execute constrained mix formulation optimization (alias)",
    include_in_schema=False,
)
def run_optimization_alias(
    payload: OptimizationRequest,
    db: Session = Depends(get_db),
) -> OptimizationResponse:
    """Alias for /api/optimization/run."""
    return run_optimization_endpoint(payload, db)


@router.get(
    "/runs",
    response_model=List[Dict[str, Any]],
    summary="List historical formulation optimization runs",
)
def list_optimization_runs(
    material_system: Optional[str] = Query(None, description="Optional material system filter"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> List[Dict[str, Any]]:
    runs = OptimizationRepository.list_runs(db, material_system=material_system, skip=skip, limit=limit)
    return [
        {
            "run_id": r.run_id,
            "material_system": r.material_system,
            "status": r.status,
            "primary_objective": r.primary_objective,
            "search_space_generated": r.search_space_generated,
            "feasible_candidates_count": r.feasible_candidates_count,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in runs
    ]


@router.get(
    "/runs/{run_id}",
    response_model=OptimizationResponse,
    summary="Get detailed results of an optimization run",
)
def get_optimization_run(
    run_id: str,
    db: Session = Depends(get_db),
) -> OptimizationResponse:
    run = OptimizationRepository.get_by_id(db, run_id)
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Optimization run '{run_id}' not found.",
        )
    return OptimizationResponse(
        run_id=run.run_id,
        status=run.status,
        material_system=run.material_system,
        primary_objective=run.primary_objective,
        algorithm_version=run.algorithm_version,
        random_seed=run.random_seed,
        search_space_generated=run.search_space_generated,
        feasible_candidates_count=run.feasible_candidates_count,
        models_used=run.models_used,
        dataset_version_id=run.dataset_version_id,
        recommended_candidates=[
            CandidateFormulation(**c) for c in run.recommended_candidates
        ],
        rejection_summary=run.rejection_summary,
        warnings=run.warnings,
        disclaimer=run.disclaimer,
        created_at=run.created_at,
    )
