import pytest
from fastapi.testclient import TestClient

from app.deps import UserAuth, require_user_auth
from app.main import app


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def authed_ai_client(client: TestClient):
    """AI suggest endpoints require authenticated user."""
    app.dependency_overrides[require_user_auth] = lambda: UserAuth(
        user_id="00000000-0000-4000-8000-000000000099",
        _token="test-ai-token",
    )
    yield client
    app.dependency_overrides.clear()
