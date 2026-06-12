def test_security_config_public(client):
    response = client.get("/api/v1/security/config")
    assert response.status_code == 200
    body = response.json()
    assert "require_email_verified" in body
    assert "session_idle_minutes" in body
