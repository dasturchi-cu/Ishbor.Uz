"""Pinpoint require_user_auth hang."""
from __future__ import annotations

import os
import sys
import time

import httpx

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
os.chdir(os.path.join(os.path.dirname(__file__), ".."))

from dotenv import load_dotenv

load_dotenv(".env")


def step(label: str, fn) -> None:
    print(f"[step] {label}...", flush=True)
    t0 = time.perf_counter()
    fn()
    print(f"[ok] {label} {time.perf_counter() - t0:.3f}s", flush=True)


def main() -> None:
    url = os.environ["SUPABASE_URL"]
    anon = os.environ["SUPABASE_ANON_KEY"]
    res = httpx.post(
        f"{url}/auth/v1/token?grant_type=password",
        json={"email": "diag-timeout-test@ishbor.uz", "password": "DiagTest123!"},
        headers={"apikey": anon, "Content-Type": "application/json"},
        timeout=15,
    )
    token = res.json()["access_token"]
    uid = res.json()["user"]["id"]
    print("token uid", uid, flush=True)

    from app.auth.jwt_verify import verify_supabase_token
    from app.database import create_supabase_user_client, get_supabase_admin, reset_supabase_client
    from app.deps import _fetch_guard_row
    from app.auth_profile_cache import fetch_profile_guard_deduped, _cache, _inflight
    from app.db_utils import run_query

    _cache.clear()
    _inflight.clear()

    step("verify_supabase_token", lambda: verify_supabase_token(token))
    step("create_supabase_user_client", lambda: create_supabase_user_client(token))

    uc = create_supabase_user_client(token)
    step("admin guard direct", lambda: run_query(
        lambda: get_supabase_admin().table("profiles")
        .select("is_banned,is_suspended,suspended_until")
        .eq("id", uid)
        .limit(1)
        .execute()
    ))
    step("_fetch_guard_row", lambda: _fetch_guard_row(uid))
    step("fetch_profile_guard_deduped", lambda: fetch_profile_guard_deduped(uid, lambda: _fetch_guard_row(uid)))
    step("user profile select", lambda: run_query(
        lambda: uc.table("profiles").select("*").eq("id", uid).limit(1).execute()
    ))

    from fastapi.security import HTTPAuthorizationCredentials
    from app.deps import require_user_auth

    cred = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
    step("require_user_auth", lambda: require_user_auth(cred))


if __name__ == "__main__":
    main()
