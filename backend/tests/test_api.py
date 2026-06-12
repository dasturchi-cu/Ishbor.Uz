def test_root(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["message"] == "IshBor.uz API"


def test_health(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["service"] == "ishbor-api"


def test_health_live(client):
    response = client.get("/api/v1/health/live")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_payments_config_includes_checkout_available(client):
    response = client.get("/api/v1/payments/config")
    assert response.status_code == 200
    body = response.json()
    assert set(body.keys()) == {"sandbox_allowed", "checkout_available"}
    assert isinstance(body["checkout_available"], bool)


def test_health_ready_unconfigured(client, monkeypatch):
    from app.config import settings

    monkeypatch.setattr(settings, "supabase_url", "")
    monkeypatch.setattr(settings, "supabase_service_role_key", "")
    response = client.get("/api/v1/health/ready")
    assert response.status_code == 503


def test_public_stats_includes_commission(client, monkeypatch):
    from app.routers import stats as stats_router

    class _CountResult:
        count = 0
        data = []

    class _FakeQuery:
        def select(self, *args, **kwargs):
            return self

        def eq(self, *args, **kwargs):
            return self

        def order(self, *args, **kwargs):
            return self

        def limit(self, *args, **kwargs):
            return self

        def execute(self):
            return _CountResult()

    class _RpcQuery:
        def __init__(self, data):
            self._data = data

        def execute(self):
            return type("RpcResult", (), {"data": self._data})()

    class _FakeSupabase:
        def table(self, _name):
            return _FakeQuery()

        def rpc(self, name, *_args, **_kwargs):
            if name == "get_reviews_aggregate":
                return _RpcQuery({"avg_rating": 4.5, "count": 10})
            if name == "get_service_category_counts":
                return _RpcQuery({"web": 3})
            raise AssertionError(f"unexpected rpc: {name}")

    monkeypatch.setattr(stats_router, "get_supabase_admin", lambda: _FakeSupabase())
    monkeypatch.setattr(stats_router, "batch_review_stats", lambda *_a, **_k: {})
    monkeypatch.setattr(stats_router, "batch_min_service_prices", lambda *_a, **_k: {})

    response = client.get("/api/v1/stats/public")
    assert response.status_code == 200
    body = response.json()
    assert body["commission_percent"] == 10
    assert body["freelancer_payout_percent"] == 90


def test_services_list_public(client):
    response = client.get("/api/v1/services?limit=3")
    assert response.status_code == 200, response.text
    body = response.json()
    assert "items" in body
    assert "total" in body


def test_projects_list_public(client):
    response = client.get("/api/v1/projects?limit=3")
    assert response.status_code == 200, response.text


def test_payments_config(client):
    response = client.get("/api/v1/payments/config")
    assert response.status_code == 200
    body = response.json()
    assert "sandbox_allowed" in body
    assert "checkout_available" in body


def test_admin_disputes_require_auth(client):
    response = client.get("/api/v1/admin/disputes")
    assert response.status_code == 401


def test_admin_waitlist_require_auth(client):
    response = client.get("/api/v1/admin/waitlist")
    assert response.status_code == 401


def test_checkout_rejects_unknown_provider(monkeypatch, client):
    from app.config import settings

    monkeypatch.setattr(settings, "environment", "development")
    response = client.post(
        "/api/v1/payments/orders/00000000-0000-0000-0000-000000000001/checkout",
        json={"provider": "stripe"},
    )
    assert response.status_code == 401


def test_orders_require_auth(client):
    response = client.get("/api/v1/orders")
    assert response.status_code == 401


def test_checkout_requires_auth(client):
    response = client.post(
        "/api/v1/payments/orders/00000000-0000-0000-0000-000000000001/checkout",
        json={"provider": "sandbox"},
    )
    assert response.status_code == 401


def test_payment_intent_requires_auth(client):
    response = client.get(
        "/api/v1/payments/orders/00000000-0000-0000-0000-000000000001/payment-intent",
    )
    assert response.status_code == 401


def test_projects_list_client_id_requires_auth(client):
    response = client.get(
        "/api/v1/projects",
        params={"client_id": "00000000-0000-0000-0000-000000000001"},
    )
    assert response.status_code == 403


def test_private_project_hidden_without_auth(client):
    response = client.get(
        "/api/v1/projects/00000000-0000-4000-8000-000000000099",
    )
    assert response.status_code in (404, 400)


def test_mark_all_read_requires_auth(client):
    response = client.post("/api/v1/notifications/mark-all-read")
    assert response.status_code == 401


def test_services_accepts_delivery_filters(client):
    response = client.get(
        "/api/v1/services",
        params={"max_delivery_days": 7, "sort": "delivery-fast", "limit": 5},
    )
    assert response.status_code == 200
    body = response.json()
    assert "items" in body
    assert "total" in body


def test_notification_channels(client):
    response = client.get("/api/v1/notifications/channels")
    assert response.status_code == 200
    body = response.json()
    assert set(body.keys()) == {"email", "sms", "telegram", "telegram_bot_username", "redis"}


def test_dashboard_summary_requires_auth(client):
    response = client.get("/api/v1/dashboard/summary", params={"role": "client"})
    assert response.status_code == 401


def test_dashboard_overview_requires_auth(client):
    response = client.get("/api/v1/dashboard/overview", params={"role": "client"})
    assert response.status_code == 401


def test_notification_response_accepts_broadcast_type():
    from datetime import datetime, timezone

    from app.schemas_notifications import NotificationResponse

    item = NotificationResponse(
        id="n1",
        type="broadcast",
        title="Test",
        body="Hello",
        created_at=datetime.now(timezone.utc),
        unread=True,
    )
    assert item.type == "broadcast"


def test_list_notifications_serializes_broadcast(monkeypatch, client):
    from datetime import datetime, timezone

    from app.deps import UserAuth, require_user_auth
    from app.main import app

    broadcast_item = {
        "id": "n1",
        "type": "broadcast",
        "title": "Yangilik",
        "body": "Salom",
        "created_at": datetime.now(timezone.utc),
        "href": None,
        "unread": True,
    }
    auth = UserAuth(user_id="u1", _token="test-token", _supabase=object())

    monkeypatch.setattr(
        "app.routers.notifications._db_notifications",
        lambda _s, _u: [broadcast_item],
    )
    monkeypatch.setattr("app.routers.notifications._synthetic_notifications", lambda _s, _u: [])
    monkeypatch.setattr("app.routers.notifications._dismissed_ids_for_user", lambda _s, _u: set())
    monkeypatch.setattr("app.routers.notifications._read_ids_for_user", lambda _s, _u: set())

    app.dependency_overrides[require_user_auth] = lambda: auth
    try:
        response = client.get("/api/v1/notifications", headers={"Authorization": "Bearer test"})
        assert response.status_code == 200
        assert response.json()[0]["type"] == "broadcast"
    finally:
        app.dependency_overrides.clear()


def test_sandbox_checkout_blocked_in_production(monkeypatch, client):
    from app.config import settings

    monkeypatch.setattr(settings, "environment", "production")
    response = client.post(
        "/api/v1/payments/orders/00000000-0000-0000-0000-000000000001/checkout",
        json={"provider": "sandbox"},
    )
    assert response.status_code in (401, 403)


def test_withdraw_application_requires_auth(client):
    response = client.delete("/api/v1/applications/00000000-0000-4000-8000-000000000001")
    assert response.status_code == 401


def test_dismiss_notifications_requires_auth(client):
    response = client.post(
        "/api/v1/notifications/dismiss",
        json={"ids": ["order-00000000-0000-4000-8000-000000000001-pending"]},
    )
    assert response.status_code == 401


def test_update_project_requires_auth(client):
    response = client.patch(
        "/api/v1/projects/00000000-0000-4000-8000-000000000099",
        json={"title": "Updated title"},
    )
    assert response.status_code == 401


def test_platform_activities_require_auth(client):
    response = client.get("/api/v1/platform/activities")
    assert response.status_code == 401


def test_platform_feature_flags_public(client):
    response = client.get("/api/v1/platform/feature-flags")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_fetch_public_profile_row_by_username(monkeypatch):
    from app.routers import profiles as profiles_router

    fake_row = {
        "id": "11111111-1111-1111-1111-111111111111",
        "role": "freelancer",
        "username": "ali_dev",
        "full_name": "Ali",
    }

    class _FakeQuery:
        def __init__(self):
            self._filters = {}

        def select(self, *_a, **_k):
            return self

        def eq(self, key, value):
            self._filters[key] = value
            return self

        def limit(self, _n):
            return self

        def execute(self):
            class _Result:
                data = [fake_row] if self._filters.get("username") == "ali_dev" else []

            return _Result()

    class _FakeSupabase:
        def table(self, name):
            assert name == profiles_router._PUBLIC_PROFILE_TABLE
            return _FakeQuery()

    row = profiles_router._fetch_public_profile_row(_FakeSupabase(), "ali_dev")
    assert row["username"] == "ali_dev"


def test_storage_signed_url_requires_auth(client):
    response = client.post(
        "/api/v1/platform/storage/signed-url",
        json={"bucket": "project-attachments", "path": "a/chat/b/c.jpg"},
    )
    assert response.status_code == 401


def test_client_error_report_accepts_anonymous(client):
    response = client.post(
        "/api/v1/platform/client-errors",
        json={
            "scope": "dashboard",
            "message": "test load failure",
            "status": 500,
            "api_path": "/api/v1/dashboard/home",
            "page": "/dashboard",
        },
    )
    assert response.status_code == 204


def test_admin_audit_logs_require_auth(client):
    response = client.get("/api/v1/admin/audit-logs")
    assert response.status_code == 401


def test_admin_analytics_require_auth(client):
    response = client.get("/api/v1/admin/analytics")
    assert response.status_code == 401


def test_security_phone_send_requires_auth(client):
    response = client.post(
        "/api/v1/security/phone/send",
        json={"phone": "998901234567"},
    )
    assert response.status_code == 401


def test_security_audit_login_accepts_anon(client):
    response = client.post(
        "/api/v1/security/audit/login",
        json={"success": False, "email": "test@example.com"},
    )
    assert response.status_code == 204


def test_wallet_topup_requires_auth(client):
    response = client.post(
        "/api/v1/payments/wallet/topup",
        json={"amount": 100000, "provider": "sandbox"},
    )
    assert response.status_code == 401


def test_pay_order_from_wallet_requires_auth(client):
    response = client.post("/api/v1/payments/orders/00000000-0000-4000-8000-000000000099/pay-wallet")
    assert response.status_code == 401


def test_milestone_status_requires_auth(client):
    response = client.patch(
        "/api/v1/milestones/00000000-0000-4000-8000-000000000099/status",
        json={"status": "funded"},
    )
    assert response.status_code == 401


def test_admin_verifications_require_auth(client):
    response = client.get("/api/v1/admin/verifications?status=pending")
    assert response.status_code == 401


def test_platform_verifications_require_auth(client):
    response = client.post(
        "/api/v1/platform/verifications",
        json={"verification_type": "freelancer"},
    )
    assert response.status_code == 401


def test_profile_response_coerces_null_arrays():
    from app.schemas import ProfileResponse

    row = ProfileResponse.model_validate(
        {
            "id": "00000000-0000-0000-0000-000000000001",
            "role": "client",
            "skills": None,
            "portfolio_urls": None,
            "languages": None,
        }
    )
    assert row.skills == []
    assert row.portfolio_urls == []
    assert row.languages == []
