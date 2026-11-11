"""Database session management."""
from sqlmodel import Session, create_engine
from typing import Generator
from src.config import settings

# SQLite doesn't support connection pool size parameters — use them only for PostgreSQL
_is_sqlite = settings.DATABASE_URL.startswith("sqlite")

if _is_sqlite:
    import os
    if os.getenv("RAILWAY_ENVIRONMENT") or os.getenv("RAILWAY_PROJECT_ID"):
        print(
            "⚠️  WARNING: Using SQLite on Railway. "
            "Data will be lost on every redeploy. "
            "Add a PostgreSQL plugin and set DATABASE_URL for persistent storage."
        )
    engine = create_engine(
        settings.DATABASE_URL,
        echo=settings.DEBUG,
        connect_args={"check_same_thread": False},
    )
else:
    engine = create_engine(
        settings.DATABASE_URL,
        echo=settings.DEBUG,
        pool_pre_ping=True,
        pool_size=20,
        max_overflow=30,
    )

# Session factory for background tasks
SessionLocal = lambda: Session(engine)


def get_session() -> Generator[Session, None, None]:
    """Get database session."""
    with Session(engine) as session:
        yield session


def init_db():
    """Initialize database tables."""
    from sqlmodel import SQLModel
    from src.db.models import (
        User, Case, Note, File, Task, 
        HelpPlanDraft, Insight, AIActionLog, Highlight,
        ReportTemplate, Report
    )
    
    SQLModel.metadata.create_all(engine)

