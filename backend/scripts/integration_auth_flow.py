"""End-to-end auth + onboarding API smoke test (local Supabase + FastAPI)."""
from __future__ import annotations

import os
import sys
import time
import uuid

import httpx

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from app.config import settings


def _timed(label: str, fn) -> tuple[bool, float]:
    t0 = time.perf_counter()
    try:
        fn()
        dt = time.perf_counter() - t0
        print(f"  OK  {label} ({dt:.2f}s)")
        return True, dt
    except Exception as exc:
        dt = time.perf_counter() - t0
        print(f"  FAIL {label} ({dt:.2f}s): {exc}")
        return False, dt


def main() -> int:
    api_base = os.environ.get("API_URL", "http://127.0.0.1:8002").rstrip("/")
    supabase_url = settings.supabase_url.rstrip("/")
    anon = settings.supabase_anon_key

    print(f"API: {api_base}")
    print(f"Supabase: {supabase_url}")

    # Health
    ok, _ = _timed("GET /health", lambda: _assert_status(
        httpx.get(f"{api_base}/api/v1/health", timeout=10), 200
    ))
    if not ok:
        return 1

    suffix = uuid.uuid4().hex[:10]
    email = f"audit-{suffix}@ishbor.test"
    password = "AuditTest123!"
    print(f"Test user: {email}")

    # Register (Supabase Auth)
    def register():
        r = httpx.post(
            f"{supabase_url}/auth/v1/signup",
            json={"email": email, "password": password},
            headers={"apikey": anon, "Content-Type": "application/json"},
            timeout=15,
        )
        _assert_status(r, 200)
        body = r.json()
        if not body.get("access_token"):
            raise RuntimeError(f"No access_token: {body}")
        return body["access_token"], body["user"]["id"]

    try:
        token, uid = register()
        print(f"  user_id={uid}")
        print(f"  OK  Supabase signUp")
    except Exception as exc:
        print(f"  FAIL Supabase signUp: {exc}")
        return 1

    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    # Login (Supabase Auth)
    def login():
        r = httpx.post(
            f"{supabase_url}/auth/v1/token?grant_type=password",
            json={"email": email, "password": password},
            headers={"apikey": anon, "Content-Type": "application/json"},
            timeout=15,
        )
        _assert_status(r, 200)

    _timed("Supabase login", login)

    # Session refresh
    def refresh():
        r = httpx.post(
            f"{supabase_url}/auth/v1/token?grant_type=refresh_token",
            json={"refresh_token": _get_refresh_token(supabase_url, anon, email, password)},
            headers={"apikey": anon, "Content-Type": "application/json"},
            timeout=15,
        )
        _assert_status(r, 200)

    _timed("Supabase refreshSession", refresh)

    # Profile GET (may 404 until created)
    def get_profile():
        r = httpx.get(f"{api_base}/api/v1/profiles/me", headers=headers, timeout=20)
        if r.status_code not in (200, 404):
            raise RuntimeError(f"status {r.status_code}: {r.text[:300]}")

    _timed("GET /profiles/me", get_profile)

    # Username check
    username = f"audit{suffix}"
    _timed(
        "GET /profiles/check-username",
        lambda: _assert_status(
            httpx.get(
                f"{api_base}/api/v1/profiles/check-username?username={username}",
                headers=headers,
                timeout=10,
            ),
            200,
        ),
    )

    # Profile PATCH (onboarding)
    patch_payload = {
        "full_name": "Audit User",
        "username": username,
        "region": "Toshkent",
        "role": "client",
        "bio": "Integration test",
        "onboarding_completed": True,
    }

    def patch_profile():
        r = httpx.patch(
            f"{api_base}/api/v1/profiles/me",
            headers=headers,
            json=patch_payload,
            timeout=25,
        )
        _assert_status(r, 200)
        body = r.json()
        if not body.get("onboarding_completed"):
            raise RuntimeError("onboarding_completed not set")

    ok, _ = _timed("PATCH /profiles/me (onboarding)", patch_profile)
    if not ok:
        return 1

    # Dashboard summary + badges
    _timed(
        "GET /dashboard/summary",
        lambda: _assert_status(
            httpx.get(
                f"{api_base}/api/v1/dashboard/summary?role=client",
                headers=headers,
                timeout=25,
            ),
            200,
        ),
    )
    _timed(
        "GET /dashboard/badges",
        lambda: _assert_status(
            httpx.get(f"{api_base}/api/v1/dashboard/badges", headers=headers, timeout=20),
            200,
        ),
    )

    # Notifications list
    _timed(
        "GET /notifications",
        lambda: _assert_status(
            httpx.get(f"{api_base}/api/v1/notifications", headers=headers, timeout=20),
            200,
        ),
    )

    # Concurrent (onboarding-like burst)
    print("\nConcurrent burst (3 parallel)...")
    import concurrent.futures

    paths = [
        ("GET", f"{api_base}/api/v1/dashboard/badges"),
        ("GET", f"{api_base}/api/v1/dashboard/summary?role=client"),
        ("PATCH", f"{api_base}/api/v1/profiles/me"),
    ]

    def one(method: str, url: str):
        if method == "GET":
            r = httpx.get(url, headers=headers, timeout=25)
        else:
            r = httpx.patch(url, headers=headers, json={"bio": "concurrent test"}, timeout=25)
        _assert_status(r, 200)

    t0 = time.perf_counter()
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        futs = [pool.submit(one, m, u) for m, u in paths]
        for f in concurrent.futures.as_completed(futs):
            f.result()
    print(f"  OK  concurrent burst ({time.perf_counter() - t0:.2f}s)")

    # Logout
    _timed(
        "Supabase signOut",
        lambda: _assert_status(
            httpx.post(
                f"{supabase_url}/auth/v1/logout",
                headers={"apikey": anon, "Authorization": f"Bearer {token}"},
                timeout=10,
            ),
            204,
        ),
    )

    print("\nAll flows passed.")
    return 0


def _get_refresh_token(supabase_url: str, anon: str, email: str, password: str) -> str:
    r = httpx.post(
        f"{supabase_url}/auth/v1/token?grant_type=password",
        json={"email": email, "password": password},
        headers={"apikey": anon, "Content-Type": "application/json"},
        timeout=15,
    )
    _assert_status(r, 200)
    return r.json()["refresh_token"]


def _assert_status(r: httpx.Response, expected: int) -> None:
    if r.status_code != expected:
        raise RuntimeError(f"expected {expected}, got {r.status_code}: {r.text[:400]}")


if __name__ == "__main__":
    raise SystemExit(main())
