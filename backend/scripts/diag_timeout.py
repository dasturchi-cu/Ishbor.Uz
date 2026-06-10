"""Diagnose API timeout — user-scoped vs admin Supabase queries."""
from __future__ import annotations

import concurrent.futures
import os
import sys
import time

import httpx

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from app.database import create_supabase_user_client, get_supabase_admin
from app.db_utils import run_query


def _timed(label: str, fn) -> None:
    t0 = time.perf_counter()
    try:
        r = fn()
        dt = time.perf_counter() - t0
        count = getattr(r, "count", None)
        rows = len(r.data or [])
        print(f"{label}: OK in {dt:.3f}s count={count} rows={rows}")
    except Exception as exc:
        print(f"{label}: FAIL {type(exc).__name__} after {time.perf_counter() - t0:.3f}s — {exc}")


def main() -> None:
    url = os.environ["SUPABASE_URL"]
    anon = os.environ["SUPABASE_ANON_KEY"]
    email = os.environ.get("TEST_USER_EMAIL", "").strip()
    password = os.environ.get("TEST_USER_PASSWORD", "").strip()

    if not email or not password:
        print("Set TEST_USER_EMAIL and TEST_USER_PASSWORD in backend/.env for full diag")
        return

    res = httpx.post(
        f"{url}/auth/v1/token?grant_type=password",
        json={"email": email, "password": password},
        headers={"apikey": anon, "Content-Type": "application/json"},
        timeout=15,
    )
    print("auth status", res.status_code)
    if res.status_code != 200:
        print(res.text[:500])
        return

    body = res.json()
    token = body["access_token"]
    uid = body["user"]["id"]
    print("user", uid)

    uc = create_supabase_user_client(token)
    admin = get_supabase_admin()

    _timed("user_guard", lambda: uc.table("profiles").select("is_banned,is_suspended,suspended_until").eq("id", uid).limit(1).execute())
    _timed("user_full", lambda: uc.table("profiles").select("*").eq("id", uid).single().execute())
    _timed("admin_guard", lambda: admin.table("profiles").select("is_banned,is_suspended,suspended_until").eq("id", uid).limit(1).execute())
    _timed("user_messages", lambda: uc.table("messages").select("id", count="exact").eq("receiver_id", uid).is_("read_at", "null").execute())
    _timed("user_notif", lambda: uc.table("notifications").select("id", count="exact").eq("user_id", uid).is_("read_at", "null").execute())

    print("\n--- concurrent (onboarding-like) ---")
    t0 = time.perf_counter()

    def patch_sim():
        return run_query(lambda: admin.table("profiles").update({"bio": "diag"}).eq("id", uid).execute())

    def badges_sim():
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
            m = pool.submit(lambda: run_query(lambda: uc.table("messages").select("id", count="exact").eq("receiver_id", uid).is_("read_at", "null").execute()))
            n = pool.submit(lambda: run_query(lambda: uc.table("notifications").select("id", count="exact").eq("user_id", uid).is_("read_at", "null").execute()))
            return m.result(), n.result()

    def summary_sim():
        return run_query(lambda: uc.table("profiles").select("*").eq("id", uid).single().execute())

    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        f1 = pool.submit(lambda: _timed("concurrent_guard", lambda: uc.table("profiles").select("is_banned,is_suspended,suspended_until").eq("id", uid).limit(1).execute()))
        f2 = pool.submit(badges_sim)
        f3 = pool.submit(summary_sim)
        concurrent.futures.wait([f1, f2, f3])

    print(f"concurrent total: {time.perf_counter() - t0:.3f}s")

    # Direct API test
    api = os.environ.get("API_URL", "http://127.0.0.1:8002")
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    for path, method, payload in [
        ("/api/v1/dashboard/badges", "GET", None),
        ("/api/v1/dashboard/summary?role=client", "GET", None),
        ("/api/v1/profiles/me", "PATCH", {"full_name": "Diag Test", "region": "Toshkent"}),
    ]:
        t0 = time.perf_counter()
        try:
            if method == "GET":
                r = httpx.get(f"{api}{path}", headers=headers, timeout=30)
            else:
                r = httpx.patch(f"{api}{path}", headers=headers, json=payload, timeout=30)
            print(f"API {method} {path}: {r.status_code} in {time.perf_counter() - t0:.3f}s")
        except Exception as exc:
            print(f"API {method} {path}: FAIL after {time.perf_counter() - t0:.3f}s — {exc}")


if __name__ == "__main__":
    main()
