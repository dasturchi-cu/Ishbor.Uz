from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from app.deps import UserAuth, require_user_auth
from app.main import app
from app.routers import profiles as profiles_router


@pytest.fixture
def authed_client(client: TestClient, monkeypatch):
    user_id = "00000000-0000-4000-8000-000000000001"
    fake_row = {
        "id": user_id,
        "role": "freelancer",
        "full_name": "Test User",
        "email": "test@example.com",
        "username": "testuser99",
        "region": "Xorazm",
        "bio": "hello world!",
        "onboarding_completed": False,
        "is_admin": False,
        "is_verified": False,
        "wallet_balance": 0,
        "profile_views": 0,
        "portfolio_urls": [],
        "skills": [],
        "languages": [],
        "ui_preferences": {},
    }

    mock_taken = MagicMock()
    mock_taken.data = []
    mock_supabase = MagicMock()
    mock_supabase.table.return_value.select.return_value.eq.return_value.neq.return_value.limit.return_value.execute.return_value = mock_taken

    def fake_update(_uid: str, data: dict) -> dict:
        return {**fake_row, **data}

    monkeypatch.setattr(profiles_router, "update_profile_row", fake_update)
    app.dependency_overrides[require_user_auth] = lambda: UserAuth(
        user_id=user_id,
        _token="test-token",
        _supabase=mock_supabase,
    )
    yield client, user_id
    app.dependency_overrides.clear()


def test_patch_profile_me_onboarding_payload(authed_client):
    client, _user_id = authed_client
    payload = {
        "full_name": "dsaa",
        "username": "dasturcfdfddfshi7ads42",
        "region": "Xorazm",
        "specialty": "dsaaa",
        "bio": "dsaaaaaaaa",
        "experience_level": "mid",
        "role": "freelancer",
    }
    response = client.patch("/api/v1/profiles/me", json=payload)
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["full_name"] == "dsaa"
    assert body["region"] == "Xorazm"
    assert body["username"] == "dasturcfdfddfshi7ads42"
