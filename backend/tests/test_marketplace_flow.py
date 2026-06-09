"""Marketplace escrow flow — auth guards for project → contract → milestone → dispute."""

FAKE_ID = "00000000-0000-4000-8000-000000000099"


def test_marketplace_flow_requires_auth(client):
    steps = [
        ("post", "/api/v1/projects", {"title": "Test", "description": "Flow"}),
        ("post", f"/api/v1/projects/{FAKE_ID}/publish", None),
        ("get", f"/api/v1/contracts/{FAKE_ID}", None),
        ("post", f"/api/v1/contracts/{FAKE_ID}/fund", {"provider": "sandbox"}),
        (
            "post",
            f"/api/v1/milestones/contract/{FAKE_ID}",
            {"title": "Milestone 1", "amount": 100_000},
        ),
        (
            "post",
            f"/api/v1/disputes/contract/{FAKE_ID}",
            {"reason": "Test dispute reason for auth guard"},
        ),
        ("get", "/api/v1/admin/contract-disputes", None),
        (
            "patch",
            f"/api/v1/admin/disputes/{FAKE_ID}/resolve",
            {"resolution": "resolved_client", "admin_notes": "test"},
        ),
    ]

    for method, path, body in steps:
        if method == "get":
            response = client.get(path)
        elif method == "post":
            response = client.post(path, json=body)
        else:
            response = client.patch(path, json=body)
        assert response.status_code == 401, f"{method.upper()} {path} should require auth"


def test_conversations_require_auth(client):
    response = client.get("/api/v1/conversations")
    assert response.status_code == 401


def test_admin_users_search_requires_auth(client):
    response = client.get("/api/v1/admin/users", params={"search": "test"})
    assert response.status_code == 401


def test_admin_users_bulk_requires_auth(client):
    response = client.post(
        "/api/v1/admin/users/bulk",
        json={"user_ids": [FAKE_ID], "action": "ban"},
    )
    assert response.status_code == 401


def test_admin_broadcast_requires_auth(client):
    response = client.post(
        "/api/v1/admin/notifications/broadcast",
        json={"title": "Test", "body": "Broadcast body", "target": "all"},
    )
    assert response.status_code == 401


def test_admin_companies_requires_auth(client):
    response = client.get("/api/v1/admin/companies")
    assert response.status_code == 401
