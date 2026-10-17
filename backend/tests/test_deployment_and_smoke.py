"""Phase 11: Deployment, Reproducibility, and Empirical Readiness Smoke Tests.

Verifies deployment configuration hardening, database persistence idempotency,
health/readiness smoke contracts, live research data state, and fail-closed
scientific gates per PLAN.md Section 18.
"""

import os
from unittest.mock import patch
import pytest
from httpx import AsyncClient
from sqlalchemy import text
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.persistence.database import SessionLocal, engine, init_db
from backend.app.persistence.models import ExperimentalRecord, Paper
from backend.app.services.xgboost_pipeline import (
    DataReadinessGateError,
    ModelArtifactError,
    check_target_readiness_or_raise,
)


@pytest.mark.asyncio
async def test_deployment_health_and_readiness_smoke(async_client: AsyncClient) -> None:
    """Verifies that health and readiness endpoints respond promptly and accurately."""
    # 1. Process Liveness
    health_resp = await async_client.get("/api/health")
    assert health_resp.status_code == 200
    health_data = health_resp.json()
    assert health_data["status"] == "ok"
    assert health_data["app_name"] == settings.APP_NAME
    assert health_data["version"] == settings.VERSION
    assert health_data["environment"] == settings.APP_ENV

    # 2. Subsystem Readiness
    ready_resp = await async_client.get("/api/ready")
    assert ready_resp.status_code == 200
    ready_data = ready_resp.json()
    assert ready_data["status"] == "ready"
    assert ready_data["subsystems"]["database"] == "operational"
    assert ready_data["subsystems"]["api_server"] == "operational"
    assert ready_data["subsystems"]["extraction_engine"] == "operational"
    assert ready_data["subsystems"]["validation_service"] == "operational"


def test_database_persistence_and_foreign_keys_idempotency(db_session: Session) -> None:
    """Verifies that init_db() is idempotent and SQLite foreign key enforcement is active."""
    # Check PRAGMA foreign_keys
    result = db_session.execute(text("PRAGMA foreign_keys;")).scalar()
    assert result == 1, "SQLite foreign key constraints must be active"

    # Verify tables exist
    tables = [
        row[0]
        for row in db_session.execute(
            text("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
        ).fetchall()
    ]
    expected_tables = {
        "papers",
        "documents",
        "records",
        "review_history",
        "validation_runs",
        "validation_findings",
        "dataset_versions",
        "model_metadata",
        "optimization_runs",
    }
    assert expected_tables.issubset(set(tables))

    # Run init_db() again to verify it does not drop tables or crash
    init_db()

    tables_after = [
        row[0]
        for row in db_session.execute(
            text("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
        ).fetchall()
    ]
    assert expected_tables.issubset(set(tables_after))


@pytest.mark.asyncio
async def test_live_dataset_readiness_reports_insufficient_data(async_client: AsyncClient) -> None:
    """Verifies that the live readiness overview truthfully reports insufficient empirical data on an empty corpus."""
    resp = await async_client.get("/api/datasets/readiness")
    assert resp.status_code == 200
    data = resp.json()

    assert "compressive_strength" in data
    assert "water_absorption" in data

    cs = data["compressive_strength"]
    wa = data["water_absorption"]

    # When no empirical literature is accepted, status must be unsupported_insufficient_data
    assert cs["readiness_status"] == "unsupported_insufficient_data"
    assert wa["readiness_status"] == "unsupported_insufficient_data"

    # Actionable diagnostics must be present
    assert len(cs["unmet_readiness_criteria"]) > 0
    assert any("independent publications" in c or "accepted empirical records" in c for c in cs["unmet_readiness_criteria"])
    assert cs["next_corrective_action"] != ""
    assert "curate" in cs["next_corrective_action"].lower() or "ingest" in cs["next_corrective_action"].lower()


@pytest.mark.asyncio
async def test_fail_closed_training_gate_on_insufficient_empirical_data(async_client: AsyncClient) -> None:
    """Verifies that model training strictly fails with 422 when empirical data is insufficient."""
    resp = await async_client.post(
        "/api/models/train",
        json={"target_property": "compressive_strength_mpa"},
    )
    assert resp.status_code == 422
    data = resp.json()
    err_msg = data.get("error", {}).get("message", "")
    assert "DATA_READINESS_BLOCKED" in err_msg
    assert "Operational readiness gate requires at least 15 accepted empirical samples" in err_msg


@pytest.mark.asyncio
async def test_fail_closed_prediction_and_explain_on_unready_models(async_client: AsyncClient) -> None:
    """Verifies that inference and SHAP attribution return 503 when models are not trained."""
    # Prediction
    pred_resp = await async_client.post(
        "/api/models/predict",
        json={
            "fly_ash_fraction": 0.55,
            "lime_fraction": 0.15,
            "gypsum_fraction": 0.05,
            "sand_fraction": 0.25,
            "curing_duration_days": 28,
        },
    )
    assert pred_resp.status_code == 503
    pred_data = pred_resp.json()
    assert "MODEL_UNAVAILABLE" in pred_data.get("error", {}).get("message", "")

    # Explanation
    expl_resp = await async_client.post(
        "/api/models/explain",
        json={
            "fly_ash_fraction": 0.55,
            "lime_fraction": 0.15,
            "gypsum_fraction": 0.05,
            "sand_fraction": 0.25,
            "curing_duration_days": 28,
        },
    )
    assert expl_resp.status_code == 503
    expl_data = expl_resp.json()
    assert "MODEL_UNAVAILABLE" in expl_data.get("error", {}).get("message", "")


@pytest.mark.asyncio
async def test_fail_closed_optimization_on_unready_models(async_client: AsyncClient) -> None:
    """Verifies that constrained optimization returns 503 when empirical models are unavailable."""
    opt_resp = await async_client.post(
        "/api/optimization/run",
        json={
            "material_system": "fly_ash_lime_gypsum_brick",
            "min_compressive_strength_mpa": 10.0,
            "max_water_absorption_pct": 15.0,
        },
    )
    assert opt_resp.status_code == 503
    opt_data = opt_resp.json()
    assert "OPTIMIZATION_UNAVAILABLE" in opt_data.get("error", {}).get("message", "")


@pytest.mark.asyncio
async def test_cors_production_security(async_client: AsyncClient) -> None:
    """Verifies that approved origins receive CORS allow headers, while unapproved origins do not."""
    # Approved origin
    resp_valid = await async_client.options(
        "/api/health",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert resp_valid.headers.get("access-control-allow-origin") == "http://localhost:5173"

    # Unapproved origin
    resp_invalid = await async_client.options(
        "/api/health",
        headers={
            "Origin": "http://unapproved-hacker-domain.example.com",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert resp_invalid.headers.get("access-control-allow-origin") is None


@pytest.mark.asyncio
async def test_upload_size_limit_enforced(async_client: AsyncClient) -> None:
    """Verifies that files exceeding MAX_UPLOAD_SIZE_BYTES are rejected with HTTP 413."""
    oversized_bytes = b"%PDF-1.4\n" + (b"0" * (settings.MAX_UPLOAD_SIZE_BYTES + 1024))
    files = {"file": ("oversized.pdf", oversized_bytes, "application/pdf")}
    resp = await async_client.post("/api/documents/upload", files=files)
    assert resp.status_code == 413
    assert "FILE_TOO_LARGE" in resp.json().get("error", {}).get("message", "")


def test_target_readiness_gate_rejects_synthetic_data() -> None:
    """Verifies that check_target_readiness_or_raise strictly excludes synthetic records."""
    # Create 20 mock records that have synthetic origin
    synthetic_records = [
        ExperimentalRecord(
            record_id=f"syn_{i}",
            paper_id=f"paper_{i % 4}",
            value_origin="synthetic",
            review_status="accepted",
            compressive_strength_mpa=15.0,
        )
        for i in range(20)
    ]

    with pytest.raises(DataReadinessGateError) as exc_info:
        check_target_readiness_or_raise(
            target_property="compressive_strength_mpa",
            evaluated_records=synthetic_records,
            allow_synthetic_test=False,
        )
    assert "DATA_READINESS_BLOCKED" in str(exc_info.value)
    assert "contains 0 accepted records" in str(exc_info.value)
