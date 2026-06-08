import threading
import time

import httpx
from fastapi import HTTPException, status
from jose import JWTError, jwk, jwt

from app.config import settings

JWKS_CACHE: dict | None = None
JWKS_CACHE_AT: float = 0.0
JWKS_TTL_SECONDS = 3600
_JWKS_LOCK = threading.Lock()


def _fetch_jwks() -> dict:
    global JWKS_CACHE, JWKS_CACHE_AT
    now = time.time()
    if JWKS_CACHE is not None and now - JWKS_CACHE_AT < JWKS_TTL_SECONDS:
        return JWKS_CACHE

    with _JWKS_LOCK:
        now = time.time()
        if JWKS_CACHE is not None and now - JWKS_CACHE_AT < JWKS_TTL_SECONDS:
            return JWKS_CACHE

        if not settings.supabase_url:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="SUPABASE_URL sozlanmagan",
            )

        url = f"{settings.supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"
        try:
            response = httpx.get(url, timeout=10.0)
            response.raise_for_status()
            JWKS_CACHE = response.json()
            JWKS_CACHE_AT = time.time()
            return JWKS_CACHE
        except httpx.HTTPError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="JWKS olishda xatolik",
            ) from exc


def verify_supabase_token(token: str) -> dict:
    try:
        header = jwt.get_unverified_header(token)
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token yaroqsiz",
        ) from exc

    algorithm = header.get("alg", "HS256")

    if algorithm == "HS256" and settings.supabase_jwt_secret:
        try:
            return jwt.decode(
                token,
                settings.supabase_jwt_secret,
                algorithms=["HS256"],
                audience="authenticated",
            )
        except JWTError:
            pass

    kid = header.get("kid")
    if not kid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token yaroqsiz. Chiqib qayta kiring.",
        )

    jwks = _fetch_jwks()
    key_data = next((k for k in jwks.get("keys", []) if k.get("kid") == kid), None)
    if not key_data:
        with _JWKS_LOCK:
            global JWKS_CACHE, JWKS_CACHE_AT
            JWKS_CACHE = None
            JWKS_CACHE_AT = 0.0
        jwks = _fetch_jwks()
        key_data = next((k for k in jwks.get("keys", []) if k.get("kid") == kid), None)

    if not key_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token yaroqsiz. Chiqib qayta kiring.",
        )

    try:
        public_key = jwk.construct(key_data)
        return jwt.decode(
            token,
            public_key,
            algorithms=[algorithm],
            audience="authenticated",
        )
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token yaroqsiz. Chiqib qayta kiring.",
        ) from exc
