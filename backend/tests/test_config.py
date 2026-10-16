import pytest
from pydantic import ValidationError
from backend.app.core.config import Settings


def test_default_settings_values() -> None:
    """Verifies default values in backend configuration."""
    cfg = Settings()
    assert cfg.APP_NAME == "FlyAsh Intel API"
    assert cfg.APP_ENV == "development"
    assert cfg.VERSION == "0.1.0"
    assert cfg.API_V1_STR == "/api"
    assert cfg.HOST == "127.0.0.1"
    assert cfg.PORT == 8000
    assert "http://localhost:5173" in cfg.CORS_ORIGINS
    assert "http://127.0.0.1:5173" in cfg.CORS_ORIGINS


def test_cors_origins_string_parsing() -> None:
    """Verifies that comma-separated origin strings are parsed into a clean list."""
    cfg = Settings(CORS_ORIGINS="http://localhost:5173, http://127.0.0.1:5173")
    assert cfg.CORS_ORIGINS == ["http://localhost:5173", "http://127.0.0.1:5173"]


def test_environment_override() -> None:
    """Verifies that settings can be overridden cleanly via constructor or environment."""
    cfg = Settings(APP_NAME="Custom FlyAsh API", PORT=9000, APP_ENV="test")
    assert cfg.APP_NAME == "Custom FlyAsh API"
    assert cfg.PORT == 9000
    assert cfg.APP_ENV == "test"


def test_invalid_port_validation() -> None:
    """Verifies that invalid configuration types raise Pydantic validation errors."""
    with pytest.raises(ValidationError):
        Settings(PORT="invalid_port_number")
