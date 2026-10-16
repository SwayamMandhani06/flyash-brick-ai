from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from backend.app.persistence.database import get_db
from backend.app.persistence.repositories import AnalysisRepository
from backend.app.schemas.eda import (
    AnalysisRunCreate,
    AnalysisRunResponse,
    ReadinessOverviewResponse,
)
from backend.app.services.eda import EDAService

router = APIRouter(prefix="/datasets/eda", tags=["Exploratory Data Analysis & Readiness"])


@router.post(
    "",
    response_model=AnalysisRunResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Execute reproducible Exploratory Data Analysis, feature assessment, and readiness evaluation",
)
def run_exploratory_data_analysis(
    config: AnalysisRunCreate,
    db: Session = Depends(get_db),
) -> AnalysisRunResponse:
    """Performs transparent, evidence-aware statistical profiling, feature suitability analysis,

    leakage checks, and target-specific dataset readiness evaluation.
    """
    try:
        return EDAService.execute_analysis(db, config)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get(
    "/latest",
    response_model=AnalysisRunResponse,
    summary="Retrieve the most recent Exploratory Data Analysis and readiness run",
)
def get_latest_analysis_run(
    dataset_version_id: Optional[str] = Query(None, description="Optional dataset version filter"),
    db: Session = Depends(get_db),
) -> AnalysisRunResponse:
    latest = AnalysisRepository.get_latest(db, dataset_version_id=dataset_version_id)
    if not latest:
        # If no prior run exists in database, execute a fresh assessment with default configuration
        default_config = AnalysisRunCreate(
            dataset_version_id=dataset_version_id,
            exclude_synthetic=True,
            require_accepted_review=True,
        )
        return EDAService.execute_analysis(db, default_config)

    return AnalysisRunResponse(
        analysis_id=latest.analysis_id,
        dataset_version_id=latest.dataset_version_id,
        material_system=latest.material_system,
        schema_version=latest.schema_version,
        analysis_config=latest.analysis_config,
        sample_summary=latest.sample_summary,
        descriptive_statistics=latest.descriptive_statistics,
        feature_assessments=latest.feature_assessments,
        correlation_findings=latest.correlation_findings,
        target_readiness=latest.target_readiness,
        limitations=latest.limitations,
        created_at=latest.created_at,
    )


@router.get(
    "/readiness",
    response_model=ReadinessOverviewResponse,
    summary="Retrieve target-specific dataset readiness overview",
)
def get_dataset_readiness_overview(
    dataset_version_id: Optional[str] = Query(None, description="Optional dataset version filter"),
    db: Session = Depends(get_db),
) -> ReadinessOverviewResponse:
    return EDAService.get_readiness_overview(db, dataset_version_id=dataset_version_id)



@router.get(
    "/runs",
    response_model=List[AnalysisRunResponse],
    summary="List historical Exploratory Data Analysis runs",
)
def list_analysis_runs(
    dataset_version_id: Optional[str] = Query(None, description="Optional dataset version filter"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
) -> List[AnalysisRunResponse]:
    runs = AnalysisRepository.list_runs(
        db, dataset_version_id=dataset_version_id, skip=skip, limit=limit
    )
    return [
        AnalysisRunResponse(
            analysis_id=r.analysis_id,
            dataset_version_id=r.dataset_version_id,
            material_system=r.material_system,
            schema_version=r.schema_version,
            analysis_config=r.analysis_config,
            sample_summary=r.sample_summary,
            descriptive_statistics=r.descriptive_statistics,
            feature_assessments=r.feature_assessments,
            correlation_findings=r.correlation_findings,
            target_readiness=r.target_readiness,
            limitations=r.limitations,
            created_at=r.created_at,
        )
        for r in runs
    ]


@router.get(
    "/{analysis_id}",
    response_model=AnalysisRunResponse,
    summary="Retrieve a specific Exploratory Data Analysis run by ID",
)
def get_analysis_run_by_id(
    analysis_id: str,
    db: Session = Depends(get_db),
) -> AnalysisRunResponse:
    run_record = AnalysisRepository.get_by_id(db, analysis_id)
    if not run_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analysis run '{analysis_id}' not found.",
        )
    return AnalysisRunResponse(
        analysis_id=run_record.analysis_id,
        dataset_version_id=run_record.dataset_version_id,
        material_system=run_record.material_system,
        schema_version=run_record.schema_version,
        analysis_config=run_record.analysis_config,
        sample_summary=run_record.sample_summary,
        descriptive_statistics=run_record.descriptive_statistics,
        feature_assessments=run_record.feature_assessments,
        correlation_findings=run_record.correlation_findings,
        target_readiness=run_record.target_readiness,
        limitations=run_record.limitations,
        created_at=run_record.created_at,
    )
