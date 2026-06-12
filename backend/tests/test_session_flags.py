from app.deps import UserAuth, require_user_auth
from app.main import app


def test_session_flags_requires_auth(client):
    response = client.get("/api/v1/profiles/session-flags")
    assert response.status_code == 401


def test_session_flags_returns_middleware_fields(client, monkeypatch):
    user_id = "00000000-0000-4000-8000-000000000020"

    class _FakeQuery:
        def select(self, *_a, **_k):
            return self

        def eq(self, *_a, **_k):
            return self

        def limit(self, *_a, **_k):
            return self

        def execute(self):
            return type(
                "Row",
                (),
                {
                    "data": [
                        {
                            "is_banned": False,
                            "is_admin": True,
                            "onboarding_completed": True,
                            "role": "client",
                            "is_suspended": False,
                        }
                    ]
                },
            )()

    class _FakeAdmin:
        def table(self, _name):
            return _FakeQuery()

    from app.routers import profiles as profiles_router

    monkeypatch.setattr(profiles_router, "get_supabase_admin", lambda: _FakeAdmin())
    monkeypatch.setattr(
        profiles_router,
        "verify_supabase_token",
        lambda _token: {"email_verified": True},
    )
    app.dependency_overrides[require_user_auth] = lambda: UserAuth(user_id=user_id, _token="t")
    try:
        response = client.get("/api/v1/profiles/session-flags")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    body = response.json()
    assert body["is_banned"] is False
    assert body["is_admin"] is True
    assert body["onboarding_completed"] is True
    assert body["role"] == "client"
    assert body["is_suspended"] is False
    assert body["email_verified"] is True
    assert "require_email_verified" in body
