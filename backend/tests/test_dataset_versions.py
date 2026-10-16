import json
from pathlib import Path
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_dataset_version_creation_and_retrieval(async_client: AsyncClient):
    """Verifies dataset snapshot creation, frozen state, and member record retrieval."""
    # Register paper
    await async_client.post(
        "/api/papers",
        json={"paper_id": "paper_ds_001", "title": "Dataset Test Paper", "authors": "Data Scientist"},
    )

    # Ingest 2 records
    await async_client.post(
        "/api/records",
        json={
            "record_id": "rec_ds_001",
            "paper_id": "paper_ds_001",
            "material_system": "fly_ash_lime_gypsum_brick",
            "value_origin": "literature_extracted",
            "compressive_strength_mpa": 15.0,
        },
    )
    await async_client.post(
        "/api/records",
        json={
            "record_id": "rec_ds_002",
            "paper_id": "paper_ds_001",
            "material_system": "fly_ash_lime_gypsum_brick",
            "value_origin": "literature_extracted",
            "compressive_strength_mpa": 18.5,
        },
    )

    # Accept both records
    for rid in ["rec_ds_001", "rec_ds_002"]:
        await async_client.patch(
            f"/api/records/{rid}/review",
            json={"reviewer": "curator", "reason": "Curated for benchmark", "new_status": "accepted"},
        )

    # Create dataset version snapshot
    ds_res = await async_client.post(
        "/api/datasets/versions",
        json={
            "version_id": "v1.0.0-reviewed-benchmark",
            "lifecycle_state": "reviewed",
            "description": "Initial reviewed benchmark dataset snapshot",
            "record_ids": ["rec_ds_001", "rec_ds_002"],
        },
    )
    assert ds_res.status_code == 201
    ds_data = ds_res.json()
    assert ds_data["version_id"] == "v1.0.0-reviewed-benchmark"
    assert ds_data["record_count"] == 2
    assert ds_data["is_frozen"] is True
    assert ds_data["lifecycle_state"] == "reviewed"

    # List versions
    list_res = await async_client.get("/api/datasets/versions")
    assert list_res.status_code == 200
    assert any(v["version_id"] == "v1.0.0-reviewed-benchmark" for v in list_res.json())

    # Get specific version with membership details
    get_res = await async_client.get("/api/datasets/versions/v1.0.0-reviewed-benchmark")
    assert get_res.status_code == 200
    detail = get_res.json()
    assert detail["version_id"] == "v1.0.0-reviewed-benchmark"
    assert len(detail["included_record_ids"]) == 2
    record_ids = set(detail["included_record_ids"])
    assert record_ids == {"rec_ds_001", "rec_ds_002"}


@pytest.mark.asyncio
async def test_synthetic_data_isolation_safeguard(async_client: AsyncClient):
    """Verifies that synthetic data can NEVER enter a model_ready dataset snapshot."""
    # Load synthetic test fixture
    fixture_path = Path(__file__).resolve().parent.parent / "data" / "synthetic" / "fixtures.json"
    with open(fixture_path, "r", encoding="utf-8") as f:
        fixtures = json.load(f)

    # Register fixture paper
    fixture_paper = fixtures["synthetic_papers"][0]
    await async_client.post("/api/papers", json=fixture_paper)

    # Ingest synthetic records
    synthetic_rec = fixtures["synthetic_records"][0]
    assert synthetic_rec["value_origin"] == "synthetic"
    await async_client.post("/api/records", json=synthetic_rec)

    # Even if synthetic record is marked accepted by a reviewer:
    await async_client.patch(
        f"/api/records/{synthetic_rec['record_id']}/review",
        json={"reviewer": "test_agent", "reason": "Test acceptance", "new_status": "accepted"},
    )

    # 1. Attempting to create a 'model_ready' snapshot with synthetic records MUST be rejected
    leak_attempt = await async_client.post(
        "/api/datasets/versions",
        json={
            "version_id": "v1.0.0-illegal-model-ready",
            "lifecycle_state": "model_ready",
            "description": "Illegal attempt to include synthetic records into model ready snapshot",
            "record_ids": [synthetic_rec["record_id"]],
        },
    )
    assert leak_attempt.status_code == 400
    err_msg = leak_attempt.json()["error"]["message"]
    assert "SYNTHETIC_DATA_LEAK_PREVENTED" in err_msg

    # 2. Creating a 'synthetic_test_only' snapshot with the synthetic records MUST succeed
    valid_synth = await async_client.post(
        "/api/datasets/versions",
        json={
            "version_id": "v1.0.0-synthetic-test",
            "lifecycle_state": "synthetic_test_only",
            "description": "Isolated synthetic benchmark fixture for test harness",
            "record_ids": [synthetic_rec["record_id"]],
        },
    )
    assert valid_synth.status_code == 201
    assert valid_synth.json()["lifecycle_state"] == "synthetic_test_only"


@pytest.mark.asyncio
async def test_model_ready_requires_accepted_records(async_client: AsyncClient):
    """Verifies that unreviewed or rejected records cannot be included in a model_ready snapshot."""
    await async_client.post(
        "/api/papers",
        json={"paper_id": "paper_cand_001", "title": "Candidate Paper", "authors": "Scientist"},
    )
    await async_client.post(
        "/api/records",
        json={
            "record_id": "rec_unreviewed_001",
            "paper_id": "paper_cand_001",
            "material_system": "fly_ash_lime_gypsum_brick",
            "value_origin": "literature_extracted",
            "compressive_strength_mpa": 12.0,
        },
    )

    # Attempt to create model_ready snapshot while record is still candidate
    res = await async_client.post(
        "/api/datasets/versions",
        json={
            "version_id": "v1.0.0-unaccepted-leak",
            "lifecycle_state": "model_ready",
            "description": "Should fail because record is candidate",
            "record_ids": ["rec_unreviewed_001"],
        },
    )
    assert res.status_code == 400
    assert "MODEL_READY_POLICY_VIOLATION" in res.json()["error"]["message"]
