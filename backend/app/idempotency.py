"""Idempotency-Key middleware (POST checkout, orders, withdrawals)."""

from __future__ import annotations

import hashlib
import json
import re
from datetime import UTC, datetime, timedelta

from fastapi import Request
from fastapi.responses import JSONResponse, Response
from starlette.responses import StreamingResponse

from app.auth.jwt_verify import verify_supabase_token
from app.database import get_supabase_admin

IDEMPOTENCY_HEADER = "Idempotency-Key"
KEY_PATTERN = re.compile(r"^[A-Za-z0-9_-]{8,128}$")
TTL_HOURS = 24

def _route_key(path: str, method: str) -> str | None:
    if method != "POST":
        return None
    if path.endswith("/checkout") and path.startswith("/api/v1/payments/orders/"):
        return path
    if path == "/api/v1/payments/withdrawals":
        return path
    if path == "/api/v1/orders":
        return path
    if path == "/api/v1/projects":
        return path
    return None


def _normalize_key(raw: str | None) -> str | None:
    if not raw:
        return None
    key = raw.strip()
    if not KEY_PATTERN.fullmatch(key):
        return None
    return key


def _hash_request(body: bytes) -> str:
    return hashlib.sha256(body).hexdigest()


def _extract_user_id(request: Request) -> str | None:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None
    token = auth[7:].strip()
    if not token:
        return None
    try:
        payload = verify_supabase_token(token)
    except Exception:
        return None
    return payload.get("sub")


def _lookup(idempotency_key: str, user_id: str, route: str) -> dict | None:
    admin = get_supabase_admin()
    result = (
        admin.table("idempotency_keys")
        .select("*")
        .eq("idempotency_key", idempotency_key)
        .eq("user_id", user_id)
        .eq("route", route)
        .limit(1)
        .execute()
    )
    rows = result.data or []
    if not rows:
        return None
    row = rows[0]
    expires = row.get("expires_at")
    if expires:
        try:
            exp_dt = datetime.fromisoformat(str(expires).replace("Z", "+00:00"))
            if exp_dt < datetime.now(UTC):
                admin.table("idempotency_keys").delete().eq("id", row["id"]).execute()
                return None
        except ValueError:
            pass
    return row


def _store(
    *,
    idempotency_key: str,
    user_id: str,
    route: str,
    request_hash: str,
    status_code: int,
    response_body: object,
) -> None:
    admin = get_supabase_admin()
    expires_at = (datetime.now(UTC) + timedelta(hours=TTL_HOURS)).isoformat()
    admin.table("idempotency_keys").upsert(
        {
            "idempotency_key": idempotency_key,
            "user_id": user_id,
            "route": route,
            "request_hash": request_hash,
            "status_code": status_code,
            "response_body": response_body,
            "expires_at": expires_at,
        },
        on_conflict="idempotency_key,user_id,route",
    ).execute()


async def idempotency_middleware(request: Request, call_next):
    route = _route_key(request.url.path, request.method)
    if not route:
        return await call_next(request)

    idempotency_key = _normalize_key(request.headers.get(IDEMPOTENCY_HEADER))
    if not idempotency_key:
        return await call_next(request)

    user_id = _extract_user_id(request)
    if not user_id:
        return JSONResponse(status_code=401, content={"detail": "Token kerak"})

    body = await request.body()
    request_hash = _hash_request(body)

    cached = _lookup(idempotency_key, user_id, route)
    if cached:
        if cached.get("request_hash") != request_hash:
            return JSONResponse(
                status_code=409,
                content={"detail": "Idempotency-Key boshqa so'rov bilan ishlatilgan"},
            )
        return JSONResponse(
            status_code=int(cached["status_code"]),
            content=cached["response_body"],
        )

    async def receive():
        return {"type": "http.request", "body": body, "more_body": False}

    request._receive = receive  # type: ignore[attr-defined]

    response = await call_next(request)

    if isinstance(response, StreamingResponse):
        return response

    raw_chunks: list[bytes] = []
    async for chunk in response.body_iterator:
        raw_chunks.append(chunk)
    raw = b"".join(raw_chunks)

    parsed_body: object
    try:
        parsed_body = json.loads(raw.decode()) if raw else {}
    except json.JSONDecodeError:
        parsed_body = {"raw": raw.decode(errors="replace")}

    if 200 <= response.status_code < 300:
        try:
            _store(
                idempotency_key=idempotency_key,
                user_id=user_id,
                route=route,
                request_hash=request_hash,
                status_code=response.status_code,
                response_body=parsed_body,
            )
        except Exception:
            if route.startswith("/api/v1/payments/"):
                return JSONResponse(
                    status_code=503,
                    content={"detail": "Idempotency saqlanmadi — qayta urinib ko'ring"},
                )

    return Response(
        content=raw,
        status_code=response.status_code,
        headers=dict(response.headers),
        media_type=response.media_type,
    )
