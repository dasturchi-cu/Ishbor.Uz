"""Verify POST /api/v1/projects idempotency — duplicate key returns one row."""
from __future__ import annotations

import os
import sys
import uuid

import httpx

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from app.config import settings


def main() -> int:
    api_base = os.environ.get("API_URL", "http://127.0.0.1:8002").rstrip("/")
    supabase_url = settings.supabase_url.rstrip("/")
    anon = settings.supabase_anon_key

    suffix = uuid.uuid4().hex[:10]
    email = f"p1-idem-{suffix}@ishbor.test"
    password = "AuditTest123!"

    signup = httpx.post(
        f"{supabase_url}/auth/v1/signup",
        json={"email": email, "password": password},
        headers={"apikey": anon, "Content-Type": "application/json"},
        timeout=15,
    )
    signup.raise_for_status()
    token = signup.json()["access_token"]
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Idempotency-Key": f"idem-{suffix}-project",
    }

    httpx.patch(
        f"{api_base}/api/v1/profiles/me/role",
        json={"role": "client"},
        headers=headers,
        timeout=15,
    ).raise_for_status()

    payload = {
        "title": f"P1 Idempotency {suffix}",
        "description": "Duplicate submit guard verification for marketplace flow.",
        "category": "Dasturlash",
        "skills": ["Python"],
        "budget": 2_500_000,
        "budget_type": "fixed",
        "deadline": "2026-12-31T00:00:00Z",
        "level": "mid",
        "region": "Toshkent",
        "attachment_urls": [],
        "is_public": True,
    }

    r1 = httpx.post(f"{api_base}/api/v1/projects", json=payload, headers=headers, timeout=30)
    r2 = httpx.post(f"{api_base}/api/v1/projects", json=payload, headers=headers, timeout=30)
    r1.raise_for_status()
    r2.raise_for_status()

    id1 = r1.json()["id"]
    id2 = r2.json()["id"]
    print(f"first={id1} second={id2} status=({r1.status_code},{r2.status_code})")

    if id1 != id2:
        print("FAIL: idempotency returned different project IDs")
        return 1

    admin = settings.supabase_service_role_key
    count_res = httpx.get(
        f"{supabase_url}/rest/v1/projects",
        params={"title": f"eq.P1 Idempotency {suffix}", "select": "id"},
        headers={"apikey": anon, "Authorization": f"Bearer {admin}"},
        timeout=15,
    )
    count_res.raise_for_status()
    rows = count_res.json()
    print(f"db_rows={len(rows)}")
    if len(rows) != 1:
        print("FAIL: expected exactly 1 DB row")
        return 1

    print("OK: idempotency — 2 POSTs, 1 row")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
