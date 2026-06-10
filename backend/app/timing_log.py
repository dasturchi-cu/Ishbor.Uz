"""So'rov bosqichlari vaqtini loglash — API_TIMING_DEBUG=1."""

from __future__ import annotations

import logging
import os
import time
from collections.abc import Callable, Generator
from contextlib import contextmanager
from typing import Any, TypeVar

logger = logging.getLogger("ishbor.timing")

T = TypeVar("T")
SLOW_MS = 500.0


def is_timing_enabled() -> bool:
    return os.environ.get("API_TIMING_DEBUG", "").strip().lower() in ("1", "true", "yes")


def _fmt_extra(extra: dict[str, Any]) -> str:
    if not extra:
        return ""
    parts = [f"{k}={v}" for k, v in extra.items()]
    return " " + " ".join(parts)


@contextmanager
def timed(operation: str, **extra: Any) -> Generator[None, None, None]:
    if not is_timing_enabled():
        yield
        return

    t0 = time.perf_counter()
    try:
        yield
    finally:
        ms = (time.perf_counter() - t0) * 1000.0
        level = logging.WARNING if ms >= SLOW_MS else logging.INFO
        logger.log(level, "timing op=%s ms=%.1f%s", operation, ms, _fmt_extra(extra))


def timed_call(operation: str, fn: Callable[[], T], **extra: Any) -> T:
    with timed(operation, **extra):
        return fn()
