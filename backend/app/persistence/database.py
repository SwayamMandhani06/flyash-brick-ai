import logging
import os
from typing import Generator
from sqlalchemy import create_engine, event, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker
from backend.app.core.config import settings
from backend.app.persistence.models import Base

logger = logging.getLogger(__name__)


def get_sqlite_connect_args(url: str) -> dict:
    if url.startswith("sqlite"):
        return {"check_same_thread": False}
    return {}


def ensure_sqlite_directory(url: str) -> None:
    if url.startswith("sqlite:///"):
        file_path = url.replace("sqlite:///", "")
        if file_path != ":memory:" and not file_path.startswith("?"):
            # If path has query params or is relative/absolute
            clean_path = file_path.split("?")[0]
            dir_name = os.path.dirname(clean_path)
            if dir_name:
                os.makedirs(dir_name, exist_ok=True)


ensure_sqlite_directory(settings.DATABASE_URL)

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=get_sqlite_connect_args(settings.DATABASE_URL),
    echo=False,
)


@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    """Enforces SQLite foreign key constraints."""
    try:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()
    except Exception as e:
        logger.warning(f"Failed to set PRAGMA foreign_keys=ON: {e}")


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db(target_engine: Engine = engine) -> None:
    """Non-destructive table creation (leaves existing data intact)."""
    Base.metadata.create_all(bind=target_engine)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency yielding a managed database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_db_connection(target_engine: Engine = engine) -> bool:
    """Executes a simple query to verify database connectivity."""
    try:
        with target_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception as e:
        logger.warning(f"Database connectivity check failed: {e}")
        return False
