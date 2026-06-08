import time
from collections.abc import Callable
from typing import TypeVar

import httpx

T = TypeVar("T")

_RETRYABLE = (
    httpx.RemoteProtocolError,
    httpx.ReadError,
    httpx.ConnectError,
    httpx.WriteError,
)


def run_query(fn: Callable[[], T], retries: int = 3) -> T:
    """Supabase HTTP/2 uzilishlarida qayta urinish."""
    last_exc: Exception | None = None

    for attempt in range(retries):
        try:
            return fn()
        except _RETRYABLE as exc:
            last_exc = exc
            if attempt >= retries - 1:
                break
            from app.database import reset_supabase_client

            reset_supabase_client()
            time.sleep(0.15 * (attempt + 1))

    assert last_exc is not None
    raise last_exc
