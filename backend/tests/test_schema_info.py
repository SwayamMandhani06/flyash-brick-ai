import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_schema_info_and_data_dictionary(async_client: AsyncClient):
    """Verifies that /api/schema returns canonical schema version and comprehensive data dictionary."""
    res = await async_client.get("/api/schema")
    assert res.status_code == 200

    data = res.json()
    assert data["schema_version"] == "v1.0.0-canonical"
    assert "one experimental formulation/result" in data["record_grain"].lower()
    assert data["material_system"] == "fly_ash_lime_gypsum_brick"

    assert "model_ready" in data["lifecycle_states"]
    assert "synthetic_test_only" in data["lifecycle_states"]
    assert "accepted" in data["review_statuses"]
    assert "needs_review" in data["review_statuses"]

    fields = data["fields"]
    assert len(fields) >= 20

    dict_by_name = {entry["name"]: entry for entry in fields}

    # Verify critical identity and provenance fields
    assert "record_id" in dict_by_name
    assert dict_by_name["record_id"]["nullable"] is False

    assert "paper_id" in dict_by_name
    assert dict_by_name["paper_id"]["nullable"] is False

    assert "value_origin" in dict_by_name
    assert dict_by_name["value_origin"]["nullable"] is False

    # Verify material fractions and nullable guarantees (no zero-fabrication)
    assert "fly_ash_fraction" in dict_by_name
    assert dict_by_name["fly_ash_fraction"]["nullable"] is True
    assert "mass fraction" in dict_by_name["fly_ash_fraction"]["unit"]

    assert "lime_fraction" in dict_by_name
    assert dict_by_name["lime_fraction"]["nullable"] is True

    assert "gypsum_fraction" in dict_by_name
    assert dict_by_name["gypsum_fraction"]["nullable"] is True

    # Verify mechanical performance targets
    assert "compressive_strength_mpa" in dict_by_name
    assert dict_by_name["compressive_strength_mpa"]["unit"] == "MPa"
    assert dict_by_name["compressive_strength_mpa"]["nullable"] is True

    assert "water_absorption_pct" in dict_by_name
    assert dict_by_name["water_absorption_pct"]["unit"] == "%"
    assert dict_by_name["water_absorption_pct"]["nullable"] is True
