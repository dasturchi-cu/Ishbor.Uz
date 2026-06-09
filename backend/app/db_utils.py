import time
from collections.abc import Callable
from typing import TypeVar

import httpx

T = TypeVar("T")

_RETRYABLE: tuple[type[Exception], ...] = (
    httpx.RemoteProtocolError,
    httpx.ReadError,
    httpx.ConnectError,
    httpx.WriteError,
    httpx.ReadTimeout,
    httpx.ConnectTimeout,
    httpx.PoolTimeout,
    httpx.NetworkError,
    httpx.TimeoutException,
)


def run_query(fn: Callable[[], T], retries: int = 5) -> T:
    """Supabase HTTP uzilishlarida qayta urinish."""
    last_exc: Exception | None = None

    for attempt in range(retries):
        try:
            return fn()
        except _RETRYABLE as exc:
            last_exc = exc
            if attempt >= retries - 1:
                break
            # Client cache faqat connection uzilganda tozalanadi (har retry da emas)
            if attempt == 0:
                from app.database import reset_supabase_client

                reset_supabase_client()
            time.sleep(0.2 * (2**attempt))

    assert last_exc is not None
    raise last_exc
