from datetime import datetime, timezone
from fastapi import APIRouter
from backend.app.core.config import settings
from backend.app.persistence.database import check_db_connection
from backend.app.schemas.health import HealthResponse, ReadinessResponse

router = APIRouter()


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Process liveness check",
    description="Returns process heartbeat confirming the API process is alive, running, and responsive.",
)
async def get_health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        app_name=settings.APP_NAME,
        version=settings.VERSION,
        environment=settings.APP_ENV,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


@router.get(
    "/ready",
    response_model=ReadinessResponse,
    summary="Component readiness check",
    description="Truthfully reports operational status of current foundation and identifies deferred subsystem modules.",
)
async def get_readiness() -> ReadinessResponse:
    db_connected = check_db_connection()
    db_status = "operational" if db_connected else "unavailable"
    system_status = "ready" if db_connected else "not_ready"

    return ReadinessResponse(
        status=system_status,
        subsystems={
            "api_server": "operational",
            "database": db_status,
            "extraction_engine": "deferred_phase_3",
            "validation_service": "deferred_phase_4",
            "xgboost_models": "deferred_phase_6",
            "shap_explainer": "deferred_phase_7",
            "process_optimizer": "deferred_phase_8",
        },
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
