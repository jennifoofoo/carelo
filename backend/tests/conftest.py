"""
Pytest Configuration and Fixtures for Carelo Backend Tests
"""

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, create_engine, SQLModel
from sqlmodel.pool import StaticPool
from unittest.mock import Mock, patch
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.main import app
from src.db.session import get_session
from src.db.models import User
from src.utils.jwt import hash_password


# ============================================
# DATABASE FIXTURES
# ============================================

@pytest.fixture(name="engine")
def engine_fixture():
    """Create in-memory SQLite database for testing"""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    yield engine
    SQLModel.metadata.drop_all(engine)


@pytest.fixture(name="session")
def session_fixture(engine):
    """Create database session for testing"""
    with Session(engine) as session:
        yield session


@pytest.fixture(name="client")
def client_fixture(session: Session):
    """Create FastAPI test client with test database"""
    def get_session_override():
        return session

    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


# ============================================
# USER FIXTURES
# ============================================

@pytest.fixture(name="test_user")
def test_user_fixture(session: Session):
    """Create the demo user that auth_demo expects.
    All routes use auth_demo which looks up demo@carelo.de."""
    user = User(
        email="demo@carelo.de",
        password=hash_password("demo"),
        full_name="Demo User",
        organization="CareLo Demo",
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@pytest.fixture(name="auth_user")
def auth_user_fixture(session: Session):
    """Create a real user for JWT auth endpoint tests."""
    user = User(
        email="test@carelo.de",
        password=hash_password("test123"),
        full_name="Test User",
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@pytest.fixture(name="auth_headers")
def auth_headers_fixture(test_user: User):
    """Auth headers for demo mode (token not verified by auth_demo)."""
    return {"Authorization": "Bearer demo-token"}


# ============================================
# MOCK FIXTURES
# ============================================

@pytest.fixture(name="mock_openai")
def mock_openai_fixture():
    """Mock Gemini AI API calls (via OpenAI-compatible client).
    Patches get_chat_client at all import sites since they use `from ... import`."""
    mock_instance = Mock()
    mock_instance.chat.completions.create.return_value = Mock(
        choices=[Mock(
            message=Mock(
                content='{"risks": [], "protective_factors": [], "key_facts": [], "emotional_state": "neutral"}'
            )
        )]
    )
    patch_targets = [
        'src.utils.ai_client.get_chat_client',
        'src.ai.insights_engine.get_chat_client',
        'src.ai.pipeline.get_chat_client',
        'src.ai.case_matcher.get_chat_client',
        'src.ai.report_generator.get_chat_client',
        'src.ai.anonymizer.get_chat_client',
    ]
    patches = []
    for target in patch_targets:
        try:
            p = patch(target, return_value=mock_instance)
            p.start()
            patches.append(p)
        except (AttributeError, ModuleNotFoundError):
            pass
    yield mock_instance
    for p in patches:
        p.stop()

@pytest.fixture(name="mock_gemini_audio")
def mock_gemini_audio_fixture():
    """Mock Gemini audio transcription calls"""
    with patch('google.generativeai.GenerativeModel') as mock_model_cls:
        mock_model = Mock()
        mock_model.generate_content.return_value = Mock(text="This is a test transcription")
        mock_model_cls.return_value = mock_model
        yield mock_model


@pytest.fixture(name="mock_redis")
def mock_redis_fixture():
    """Mock Redis client"""
    with patch('src.utils.redis_cache.get_redis_client') as mock:
        mock_client = Mock()
        mock_client.get.return_value = None
        mock_client.set.return_value = True
        mock_client.delete.return_value = True
        mock.return_value = mock_client
        yield mock_client


# ============================================
# DATA FIXTURES
# ============================================

@pytest.fixture(name="test_case")
def test_case_fixture(session: Session, test_user: User):
    """Create a test case owned by the demo user."""
    from src.db.models import Case
    case = Case(
        user_id=test_user.id,
        client_name="Emma Schmidt",
        status="active",
    )
    session.add(case)
    session.commit()
    session.refresh(case)
    return case


@pytest.fixture(name="test_note")
def test_note_fixture(session: Session, test_case):
    """Create a test note"""
    from src.db.models import Note
    note = Note(
        case_id=test_case.id,
        source="text",
        raw_content="Test note content",
        normalized="Test note content",
        processing_status="completed",
    )
    session.add(note)
    session.commit()
    session.refresh(note)
    return note


@pytest.fixture(name="test_template")
def test_template_fixture(session: Session):
    """Create a report template in the test DB (lifespan creates in production DB only)."""
    from src.db.models import ReportTemplate
    import json
    template = ReportTemplate(
        name="Hilfeplan",
        category="youth_office",
        description="Standard Hilfeplan template",
        template_structure=json.dumps({
            "sections": [
                {"title": "Ausgangssituation", "type": "text"},
                {"title": "Ziele", "type": "text"},
            ]
        }),
        required_fields=json.dumps(["client_name", "case_status"]),
        is_system_template=True,
        is_active=True,
    )
    session.add(template)
    session.commit()
    session.refresh(template)
    return template


# ============================================
# CLEANUP
# ============================================

@pytest.fixture(autouse=True)
def reset_app_state():
    """Reset app state between tests"""
    yield
    app.dependency_overrides.clear()
