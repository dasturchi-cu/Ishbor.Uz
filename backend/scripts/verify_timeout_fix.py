"""Verify authenticated API endpoints complete under 2s."""
from __future__ import annotations

import os
import sys
import time

import httpx

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
os.chdir(os.path.join(os.path.dirname(__file__), ".."))

from dotenv import load_dotenv

load_dotenv(".env")

MAX_SEC = 2.0
API = os.environ.get("API_URL", "http://127.0.0.1:8002")


def main() -> int:
    url = os.environ["SUPABASE_URL"]
    anon = os.environ["SUPABASE_ANON_KEY"]
    res = httpx.post(
        f"{url}/auth/v1/token?grant_type=password",
        json={"email": "diag-timeout-test@ishbor.uz", "password": "DiagTest123!"},
        headers={"apikey": anon, "Content-Type": "application/json"},
        timeout=15,
    )
    if res.status_code != 200:
        print("FAIL sign-in", res.status_code, res.text[:200])
        return 1

    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    checks = [
        ("GET", "/api/v1/dashboard/badges", None),
        ("GET", "/api/v1/dashboard/summary?role=client", None),
        ("PATCH", "/api/v1/profiles/me", {"full_name": "Diag Verify", "region": "Toshkent"}),
    ]

    failed = 0
    for method, path, body in checks:
        t0 = time.perf_counter()
        try:
            if method == "GET":
                r = httpx.get(f"{API}{path}", headers=headers, timeout=10)
            else:
                r = httpx.patch(f"{API}{path}", headers=headers, json=body, timeout=10)
            dt = time.perf_counter() - t0
            ok = r.status_code < 400 and dt <= MAX_SEC
            status = "OK" if ok else "FAIL"
            print(f"{status} {method} {path} -> {r.status_code} in {dt:.2f}s")
            if not ok:
                failed += 1
                if r.status_code >= 400:
                    print("  body:", r.text[:200])
        except Exception as exc:
            dt = time.perf_counter() - t0
            print(f"FAIL {method} {path} in {dt:.2f}s — {exc}")
            failed += 1

    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
