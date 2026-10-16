import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_record_create_and_get(async_client: AsyncClient):
    """Verifies candidate record creation via API, initial state, and retrieval."""
    # 1. Register a paper first
    paper_res = await async_client.post(
        "/api/papers",
        json={
            "paper_id": "paper_test_001",
            "title": "Fly Ash Brick Strength Optimization",
            "authors": "Gupta & Mehta",
            "publication_year": 2022,
        },
    )
    assert paper_res.status_code == 201

    # 2. Create experimental record
    rec_res = await async_client.post(
        "/api/records",
        json={
            "record_id": "rec_test_001",
            "paper_id": "paper_test_001",
            "material_system": "fly_ash_lime_gypsum_brick",
            "value_origin": "literature_extracted",
            "fly_ash_fraction": 0.50,
            "lime_fraction": 0.20,
            "gypsum_fraction": 0.10,
            "sand_fraction": 0.20,
            "compressive_strength_mpa": 14.8,
            "initial_reviewer": "ingestion_agent",
            "creation_reason": "Extracted from Table 3 in Gupta & Mehta (2022)",
        },
    )
    assert rec_res.status_code == 201
    rec_data = rec_res.json()
    assert rec_data["record_id"] == "rec_test_001"
    assert rec_data["paper_id"] == "paper_test_001"
    assert rec_data["review_status"] == "candidate"
    assert rec_data["schema_version"] == "v1.0.0-canonical"
    assert rec_data["compressive_strength_mpa"] == 14.8
    # Nullable fields remain None
    assert rec_data["water_absorption_pct"] is None

    # 3. Retrieve record
    get_res = await async_client.get("/api/records/rec_test_001")
    assert get_res.status_code == 200
    assert get_res.json()["record_id"] == "rec_test_001"


@pytest.mark.asyncio
async def test_record_foreign_key_validation(async_client: AsyncClient):
    """Verifies that record creation with nonexistent paper_id returns 400 Bad Request."""
    res = await async_client.post(
        "/api/records",
        json={
            "paper_id": "nonexistent_paper_id",
            "material_system": "fly_ash_lime_gypsum_brick",
            "value_origin": "literature_extracted",
        },
    )
    assert res.status_code == 400
    assert "Referenced paper_id 'nonexistent_paper_id' does not exist" in res.json()["error"]["message"]


@pytest.mark.asyncio
async def test_record_review_transitions(async_client: AsyncClient):
    """Verifies valid review transitions and rejection of invalid state transitions."""
    # Register paper and create candidate record
    await async_client.post(
        "/api/papers",
        json={"paper_id": "paper_rev_001", "title": "Review Paper", "authors": "Researcher"},
    )
    await async_client.post(
        "/api/records",
        json={
            "record_id": "rec_rev_001",
            "paper_id": "paper_rev_001",
            "material_system": "fly_ash_lime_gypsum_brick",
            "value_origin": "literature_extracted",
        },
    )

    # 1. Valid transition: candidate -> accepted
    acc_res = await async_client.patch(
        "/api/records/rec_rev_001/review",
        json={
            "reviewer": "dr_smith",
            "reason": "Verified against Table 2 in source manuscript",
            "new_status": "accepted",
        },
    )
    assert acc_res.status_code == 200
    assert acc_res.json()["review_status"] == "accepted"
    assert acc_res.json()["reviewed_by"] == "dr_smith"

    # 2. Valid transition: accepted -> rejected
    rej_res = await async_client.patch(
        "/api/records/rec_rev_001/review",
        json={
            "reviewer": "chief_editor",
            "reason": "Methodological flaw identified in curing protocol",
            "new_status": "rejected",
        },
    )
    assert rej_res.status_code == 200
    assert rej_res.json()["review_status"] == "rejected"

    # 3. Invalid transition: rejected -> accepted directly (must go to needs_review first)
    bad_res = await async_client.patch(
        "/api/records/rec_rev_001/review",
        json={
            "reviewer": "junior_reviewer",
            "reason": "Direct acceptance attempt without re-review",
            "new_status": "accepted",
        },
    )
    assert bad_res.status_code == 400
    assert "Invalid review state transition" in bad_res.json()["error"]["message"]


@pytest.mark.asyncio
async def test_record_corrections_and_audit_history(async_client: AsyncClient):
    """Verifies field corrections preserve previous values and trigger re-review status."""
    await async_client.post(
        "/api/papers",
        json={"paper_id": "paper_corr_001", "title": "Correction Paper", "authors": "Author"},
    )
    await async_client.post(
        "/api/records",
        json={
            "record_id": "rec_corr_001",
            "paper_id": "paper_corr_001",
            "material_system": "fly_ash_lime_gypsum_brick",
            "value_origin": "literature_extracted",
            "compressive_strength_mpa": 10.5,
        },
    )

    # First accept the record
    await async_client.patch(
        "/api/records/rec_corr_001/review",
        json={"reviewer": "reviewer_1", "reason": "Initial acceptance", "new_status": "accepted"},
    )

    # Apply correction to compressive_strength_mpa
    corr_res = await async_client.patch(
        "/api/records/rec_corr_001/review",
        json={
            "reviewer": "senior_auditor",
            "reason": "Correcting typo: reported strength was 12.5 MPa in original table",
            "field_corrections": {"compressive_strength_mpa": 12.5},
        },
    )
    assert corr_res.status_code == 200
    corr_data = corr_res.json()
    assert corr_data["compressive_strength_mpa"] == 12.5
    # Must automatically demote accepted to needs_review
    assert corr_data["review_status"] == "needs_review"

    # Query audit history
    hist_res = await async_client.get("/api/records/rec_corr_001/history")
    assert hist_res.status_code == 200
    history = hist_res.json()

    # Should have: creation, status_change (to accepted), correction (10.5 -> 12.5), status_change (to needs_review)
    assert len(history) >= 4

    correction_events = [e for e in history if e["action"] == "correction"]
    assert len(correction_events) == 1
    event = correction_events[0]
    assert event["field_name"] == "compressive_strength_mpa"
    assert event["previous_value"] == "10.5"
    assert event["new_value"] == "12.5"
    assert event["reviewer"] == "senior_auditor"
    assert "Correcting typo" in event["reason"]
