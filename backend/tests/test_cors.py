import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_cors_preflight_localhost_vite(async_client: AsyncClient) -> None:
    """Verifies that preflight requests from the localhost Vite frontend are authorized."""
    response = await async_client.options(
        "/api/health",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "Content-Type",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"
    assert "GET" in response.headers.get("access-control-allow-methods", "")


@pytest.mark.asyncio
async def test_cors_preflight_127_vite(async_client: AsyncClient) -> None:
    """Verifies that preflight requests from the 127.0.0.1 Vite frontend are authorized."""
    response = await async_client.options(
        "/api/health",
        headers={
            "Origin": "http://127.0.0.1:5173",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://127.0.0.1:5173"


@pytest.mark.asyncio
async def test_cors_disallowed_origin(async_client: AsyncClient) -> None:
    """Verifies that unapproved origins are not granted CORS access."""
    unapproved_origin = "http://unapproved-origin.com"
    response = await async_client.options(
        "/api/health",
        headers={
            "Origin": unapproved_origin,
            "Access-Control-Request-Method": "GET",
        },
    )
    # Disallowed origin should not have Access-Control-Allow-Origin reflecting the untrusted origin
    allowed_origin = response.headers.get("access-control-allow-origin")
    assert allowed_origin != unapproved_origin


@pytest.mark.asyncio
async def test_cors_get_request_headers(async_client: AsyncClient) -> None:
    """Verifies that GET requests from approved origin include CORS response header."""
    response = await async_client.get(
        "/api/health",
        headers={"Origin": "http://localhost:5173"},
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"
