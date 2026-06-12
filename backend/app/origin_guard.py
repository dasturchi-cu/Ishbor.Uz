"""Origin validation — CSRF defense-in-depth for browser clients."""

from __future__ import annotations

from fastapi import Request
from starlette.responses import JSONResponse

from app.config import settings

_SAFE_METHODS = frozenset({"GET", "HEAD", "OPTIONS"})


def validate_origin(request: Request) -> JSONResponse | None:
    if request.method in _SAFE_METHODS:
        return None
    env = settings.environment.strip().lower()
    if env not in ("production", "prod", "staging"):
        return None

    path = request.url.path
    if path.startswith("/api/v1/payments/webhooks") or path.startswith("/api/v1/notifications/telegram"):
        return None

    origin = request.headers.get("origin")
    if not origin:
        referer = request.headers.get("referer", "")
        if referer:
            try:
                from urllib.parse import urlparse

                origin = f"{urlparse(referer).scheme}://{urlparse(referer).netloc}"
            except ValueError:
                origin = None

    if not origin:
        return JSONResponse(status_code=403, content={"detail": "Origin talab qilinadi"})

    allowed = set(settings.cors_origin_list)
    if origin.rstrip("/") not in {o.rstrip("/") for o in allowed}:
        return JSONResponse(status_code=403, content={"detail": "Ruxsat etilmagan origin"})

    return None
