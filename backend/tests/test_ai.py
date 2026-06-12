def test_ai_suggest_project_description(authed_ai_client):
    response = authed_ai_client.post(
        "/api/v1/ai/suggest",
        json={
            "kind": "project_description",
            "title": "Landing page",
            "category": "web",
            "skills": ["React", "Figma"],
            "language": "uz",
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["kind"] == "project_description"
    assert len(body["text"]) >= 10
    assert "Landing page" in body["text"]


def test_ai_suggest_service_description(authed_ai_client):
    response = authed_ai_client.post(
        "/api/v1/ai/suggest",
        json={
            "kind": "service_description",
            "title": "Logo dizayn",
            "category": "graphic",
            "region": "Toshkent",
            "language": "uz",
        },
    )
    assert response.status_code == 200
    assert "Logo dizayn" in response.json()["text"]


def test_ai_suggest_cover_letter(authed_ai_client):
    response = authed_ai_client.post(
        "/api/v1/ai/suggest",
        json={
            "kind": "cover_letter",
            "title": "Mobil ilova",
            "project_description": "Flutter bilan MVP kerak",
            "specialty": "Mobile dev",
            "language": "en",
        },
    )
    assert response.status_code == 200
    assert "Mobil ilova" in response.json()["text"]


def test_ai_suggest_service_title(authed_ai_client):
    response = authed_ai_client.post(
        "/api/v1/ai/suggest",
        json={"kind": "service_title", "category": "web", "region": "Toshkent", "language": "uz"},
    )
    assert response.status_code == 200
    assert "veb" in response.json()["text"].lower() or "web" in response.json()["text"].lower()


def test_ai_suggest_profile_bio(authed_ai_client):
    response = authed_ai_client.post(
        "/api/v1/ai/suggest",
        json={
            "kind": "profile_bio",
            "specialty": "UI dizayner",
            "skills": ["Figma"],
            "region": "Samarqand",
            "language": "uz",
        },
    )
    assert response.status_code == 200
    assert "UI dizayner" in response.json()["text"]


def test_ai_suggest_requires_title(authed_ai_client):
    response = authed_ai_client.post(
        "/api/v1/ai/suggest",
        json={"kind": "project_description", "title": "", "language": "uz"},
    )
    assert response.status_code == 400


def test_ai_suggest_requires_auth(client):
    response = client.post(
        "/api/v1/ai/suggest",
        json={"kind": "service_title", "category": "web", "language": "uz"},
    )
    assert response.status_code == 401
