import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_model_metadata_creation_and_retrieval(async_client: AsyncClient):
    """Verifies that model metadata can be registered and retrieved without claiming training."""
    payload = {
        "model_id": "XGB-STRENGTH-PHASE2-TEST",
        "target_property": "compressive_strength_mpa",
        "target_unit": "MPa",
        "algorithm": "XGBoost",
        "model_version": "v1.0.0-draft",
        "feature_manifest": [
            "fly_ash_fraction",
            "lime_fraction",
            "gypsum_fraction",
            "sand_fraction",
            "water_content_or_ratio",
            "curing_duration_days",
        ],
        "hyperparameters": {"n_estimators": 100, "max_depth": 5, "learning_rate": 0.05},
        "is_trained": False,
        "training_notes": "Phase 2 metadata scaffold — training deferred to Phase 6",
    }

    create_res = await async_client.post("/api/models", json=payload)
    assert create_res.status_code == 201
    data = create_res.json()
    assert data["model_id"] == "XGB-STRENGTH-PHASE2-TEST"
    assert data["target_property"] == "compressive_strength_mpa"
    assert data["is_trained"] is False
    assert data["artifact_path"] is None

    # Retrieve by ID
    get_res = await async_client.get("/api/models/XGB-STRENGTH-PHASE2-TEST")
    assert get_res.status_code == 200
    assert get_res.json()["model_id"] == "XGB-STRENGTH-PHASE2-TEST"

    # List all
    list_res = await async_client.get("/api/models")
    assert list_res.status_code == 200
    assert any(m["model_id"] == "XGB-STRENGTH-PHASE2-TEST" for m in list_res.json())


@pytest.mark.asyncio
async def test_untrained_model_cannot_claim_trained_without_artifact(async_client: AsyncClient):
    """Verifies that models cannot falsely claim is_trained=True without an actual artifact path."""
    fake_training_payload = {
        "model_id": "XGB-FAKE-TRAINED",
        "target_property": "compressive_strength_mpa",
        "target_unit": "MPa",
        "model_version": "v1.0.0",
        "feature_manifest": ["fly_ash_fraction"],
        "is_trained": True,  # Falsely claiming trained
        "artifact_path": None,  # No artifact exists
    }

    res = await async_client.post("/api/models", json=fake_training_payload)
    assert res.status_code == 400
    assert "Cannot register model as trained without a valid artifact_path" in res.json()["error"]["message"]


@pytest.mark.asyncio
async def test_get_nonexistent_model_returns_404(async_client: AsyncClient):
    """Verifies 404 response for nonexistent model metadata."""
    res = await async_client.get("/api/models/nonexistent_model_id")
    assert res.status_code == 404
    assert res.json()["error"]["code"] == "NOT_FOUND"
