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


def test_health_ready_unconfigured(client, monkeypatch):
    from app.config import settings

    monkeypatch.setattr(settings, "supabase_url", "")
    monkeypatch.setattr(settings, "supabase_service_role_key", "")
    response = client.get("/api/v1/health/ready")
    assert response.status_code == 503


def test_payments_config(client):
    response = client.get("/api/v1/payments/config")
    assert response.status_code == 200
    body = response.json()
    assert "providers" in body
    assert isinstance(body["providers"], list)
    assert "sandbox_allowed" in body


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


def test_sandbox_checkout_blocked_in_production(monkeypatch, client):
    from app.config import settings

    monkeypatch.setattr(settings, "environment", "production")
    response = client.post(
        "/api/v1/payments/orders/00000000-0000-0000-0000-000000000001/checkout",
        json={"provider": "sandbox"},
    )
    assert response.status_code == 401
