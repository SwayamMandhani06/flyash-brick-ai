import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from pydantic import BaseModel
from backend.app.main import app


class DummyModel(BaseModel):
    item_count: int


# Register temporary test routes to verify validation and internal error handlers
@app.post("/test-validation-route")
async def dummy_validation_route(payload: DummyModel) -> dict:
    return {"item_count": payload.item_count}


@app.get("/test-internal-crash-route")
async def dummy_crash_route() -> None:
    raise RuntimeError("SensitiveDatabaseException: password=supersecretpass file=/etc/passwd")


@pytest.mark.asyncio
async def test_404_not_found_structure(async_client: AsyncClient) -> None:
    """Verifies that accessing a nonexistent route returns a structured 404 response."""
    response = await async_client.get("/api/nonexistent-endpoint-xyz")
    assert response.status_code == 404

    data = response.json()
    assert "error" in data
    error = data["error"]
    assert error["code"] == "NOT_FOUND"
    assert "not found" in error["message"].lower()
    assert error["details"] is None


@pytest.mark.asyncio
async def test_422_validation_error_structure(async_client: AsyncClient) -> None:
    """Verifies that invalid request payloads return structured 422 validation errors."""
    response = await async_client.post(
        "/test-validation-route",
        json={"item_count": "this_is_not_an_integer"},
    )
    assert response.status_code == 422

    data = response.json()
    assert "error" in data
    error = data["error"]
    assert error["code"] == "VALIDATION_ERROR"
    assert error["message"] == "Request validation failed."
    assert isinstance(error["details"], list)
    assert len(error["details"]) > 0
    assert "item_count" in error["details"][0]["location"]


@pytest.mark.asyncio
async def test_500_safe_error_masking(async_client: AsyncClient) -> None:
    """Verifies that internal exceptions return a safe 500 error without leaking secrets or stack traces."""
    response = await async_client.get("/test-internal-crash-route")
    assert response.status_code == 500

    data = response.json()
    assert "error" in data
    error = data["error"]
    assert error["code"] == "INTERNAL_SERVER_ERROR"
    assert error["message"] == "An unexpected server error occurred."
    assert error["details"] is None

    # Crucial security check: sensitive internal exception details must never leak to clients
    raw_text = response.text
    assert "supersecretpass" not in raw_text
    assert "/etc/passwd" not in raw_text
    assert "Traceback" not in raw_text
