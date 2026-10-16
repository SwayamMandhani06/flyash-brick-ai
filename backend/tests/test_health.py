from unittest.mock import patch
from datetime import datetime
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_liveness(async_client: AsyncClient) -> None:
    """Verifies that the /api/health endpoint confirms application process liveness."""
    response = await async_client.get("/api/health")
    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "ok"
    assert data["app_name"] == "FlyAsh Intel API"
    assert data["version"] == "0.1.0"
    assert data["environment"] == "development"

    # Verify timestamp is a valid ISO-8601 string
    ts = datetime.fromisoformat(data["timestamp"])
    assert ts is not None


@pytest.mark.asyncio
async def test_readiness_report_operational(async_client: AsyncClient) -> None:
    """Verifies that the /api/ready endpoint truthfully reports database operational status."""
    response = await async_client.get("/api/ready")
    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "ready"

    subsystems = data["subsystems"]
    assert subsystems["api_server"] == "operational"
    # Phase 2 persistence is now operational
    assert subsystems["database"] == "operational"

    # Verify deferred subsystems are accurately identified without false operational claims
    assert subsystems["extraction_engine"] == "deferred_phase_3"
    assert subsystems["validation_service"] == "deferred_phase_4"
    assert subsystems["xgboost_models"] == "deferred_phase_6"
    assert subsystems["shap_explainer"] == "deferred_phase_7"
    assert subsystems["process_optimizer"] == "deferred_phase_8"

    ts = datetime.fromisoformat(data["timestamp"])
    assert ts is not None


@pytest.mark.asyncio
async def test_readiness_database_unavailable(async_client: AsyncClient) -> None:
    """Verifies that /api/ready truthfully reports degraded status when database is unavailable."""
    with patch("backend.app.api.routes.health.check_db_connection", return_value=False):
        response = await async_client.get("/api/ready")
        assert response.status_code == 200

        data = response.json()
        assert data["status"] == "not_ready"
        assert data["subsystems"]["database"] == "unavailable"
        assert data["subsystems"]["api_server"] == "operational"

