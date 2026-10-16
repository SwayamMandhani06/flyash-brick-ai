import logging
from typing import Any, Optional
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger(__name__)

# Use modern HTTP_422_UNPROCESSABLE_CONTENT if available, fallback to 422
HTTP_422 = getattr(status, "HTTP_422_UNPROCESSABLE_CONTENT", 422)


class ErrorDetail(BaseModel):
    code: str
    message: str
    details: Optional[Any] = None


class ErrorResponse(BaseModel):
    error: ErrorDetail


def create_error_response(
    status_code: int,
    code: str,
    message: str,
    details: Optional[Any] = None,
) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "error": {
                "code": code,
                "message": message,
                "details": details,
            }
        },
    )


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
        code_map = {
            status.HTTP_404_NOT_FOUND: "NOT_FOUND",
            status.HTTP_400_BAD_REQUEST: "BAD_REQUEST",
            status.HTTP_401_UNAUTHORIZED: "UNAUTHORIZED",
            status.HTTP_403_FORBIDDEN: "FORBIDDEN",
            status.HTTP_405_METHOD_NOT_ALLOWED: "METHOD_NOT_ALLOWED",
        }
        code = code_map.get(exc.status_code, "HTTP_ERROR")
        message = str(exc.detail) if exc.detail else "An HTTP error occurred."
        return create_error_response(
            status_code=exc.status_code,
            code=code,
            message=message,
            details=None,
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
        sanitized_errors = []
        for err in exc.errors():
            loc = " -> ".join(str(item) for item in err.get("loc", []))
            sanitized_errors.append({
                "location": loc,
                "message": err.get("msg", "Invalid value"),
                "type": err.get("type", "value_error"),
            })
        return create_error_response(
            status_code=HTTP_422,
            code="VALIDATION_ERROR",
            message="Request validation failed.",
            details=sanitized_errors,
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.error(f"Unhandled server error: {exc}", exc_info=True)
        return create_error_response(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            code="INTERNAL_SERVER_ERROR",
            message="An unexpected server error occurred.",
            details=None,
        )
