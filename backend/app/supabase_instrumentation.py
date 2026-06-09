"""Supabase PostgREST so'rovlarini sanash — SUPABASE_REQUEST_DEBUG=1."""

from __future__ import annotations

import os
import threading
import time
from contextvars import ContextVar
from dataclasses import dataclass, field
from typing import Any

_request_route: ContextVar[str | None] = ContextVar("request_route", default=None)
_request_component: ContextVar[str | None] = ContextVar("request_component", default=None)
_lock = threading.Lock()
HOUR_SEC = 3600


@dataclass
class QueryStat:
    query_name: str
    endpoint: str
    component: str
    count_total: int = 0
    timestamps: list[float] = field(default_factory=list)


_store: dict[str, QueryStat] = {}
_client_events: list[dict[str, Any]] = []


def is_debug_enabled() -> bool:
    return os.environ.get("SUPABASE_REQUEST_DEBUG", "").strip().lower() in ("1", "true", "yes")


def set_request_route(method: str, path: str):
    return _request_route.set(f"{method} {path}")


def reset_request_route(token) -> None:
    _request_route.reset(token)


def set_request_component(name: str):
    return _request_component.set(name)


def reset_request_component(token) -> None:
    _request_component.reset(token)


def record_query(
    *,
    table: str,
    operation: str,
    component: str = "backend",
    endpoint: str | None = None,
) -> None:
    if not is_debug_enabled():
        return

    ep = endpoint or _request_route.get() or "unknown"
    comp = _request_component.get() or component
    query_name = f"{table}.{operation}"
    key = f"{comp}|{query_name}|{ep}"
    now = time.time()

    with _lock:
        stat = _store.get(key)
        if stat is None:
            stat = QueryStat(query_name=query_name, endpoint=ep, component=comp)
            _store[key] = stat
        stat.count_total += 1
        stat.timestamps.append(now)
        cutoff = now - HOUR_SEC
        if len(stat.timestamps) > 5000:
            stat.timestamps = [t for t in stat.timestamps if t >= cutoff]


def merge_client_events(events: list[dict[str, Any]]) -> None:
    if not is_debug_enabled() or not events:
        return
    with _lock:
        _client_events.extend(events)
        if len(_client_events) > 20_000:
            _client_events[:] = _client_events[-10_000:]


def _count_last_hour(timestamps: list[float]) -> int:
    cutoff = time.time() - HOUR_SEC
    return sum(1 for t in timestamps if t >= cutoff)


def get_stats() -> list[dict[str, Any]]:
    cutoff = time.time() - HOUR_SEC
    rows: list[dict[str, Any]] = []

    with _lock:
        for stat in _store.values():
            last_hour = sum(1 for t in stat.timestamps if t >= cutoff)
            rows.append(
                {
                    "query_name": stat.query_name,
                    "endpoint": stat.endpoint,
                    "component": stat.component,
                    "kind": "db",
                    "count_total": stat.count_total,
                    "count_last_hour": last_hour,
                }
            )

        grouped: dict[str, dict[str, Any]] = {}
        for event in _client_events:
            key = (
                f"{event.get('kind', 'client')}|"
                f"{event.get('queryName', event.get('query_name', '?'))}|"
                f"{event.get('endpoint', 'client')}|"
                f"{event.get('component', 'unknown')}"
            )
            row = grouped.get(key)
            if row is None:
                row = {
                    "query_name": event.get("queryName") or event.get("query_name") or "?",
                    "endpoint": event.get("endpoint") or "client",
                    "component": event.get("component") or "unknown",
                    "kind": event.get("kind") or "client",
                    "count_total": 0,
                    "count_last_hour": 0,
                }
                grouped[key] = row
            row["count_total"] += int(event.get("count_total") or event.get("countTotal") or 1)
            row["count_last_hour"] += int(event.get("count_last_hour") or event.get("countLastHour") or 1)

        rows.extend(grouped.values())

    rows.sort(key=lambda r: (r["count_last_hour"], r["count_total"]), reverse=True)
    return rows


def get_top10() -> list[dict[str, Any]]:
    return get_stats()[:10]


def reset_stats() -> None:
    with _lock:
        _store.clear()
        _client_events.clear()


class _InstrumentedBuilder:
    __slots__ = ("_inner", "_table", "_op")

    def __init__(self, inner: Any, table: str):
        object.__setattr__(self, "_inner", inner)
        object.__setattr__(self, "_table", table)
        object.__setattr__(self, "_op", "select")

    def __getattr__(self, name: str) -> Any:
        if name in ("select", "insert", "update", "delete", "upsert"):
            object.__setattr__(self, "_op", name)
        attr = getattr(self._inner, name)
        if callable(attr):

            def caller(*args: Any, **kwargs: Any) -> Any:
                result = attr(*args, **kwargs)
                if result is not self._inner and hasattr(result, "execute"):
                    return _InstrumentedBuilder(result, self._table)
                return result

            return caller
        return attr

    def execute(self) -> Any:
        comp = _request_component.get() or "backend"
        record_query(table=self._table, operation=self._op, component=comp)
        return self._inner.execute()


def instrument_supabase_client(client: Any) -> Any:
    if not is_debug_enabled():
        return client

    orig_table = client.table
    orig_rpc = client.rpc

    def table(name: str) -> _InstrumentedBuilder:
        return _InstrumentedBuilder(orig_table(name), name)

    def rpc(fn: str, params: Any = None, **kwargs: Any) -> Any:
        record_query(table=f"rpc:{fn}", operation="rpc", component="backend")
        return orig_rpc(fn, params, **kwargs)

    client.table = table  # type: ignore[method-assign]
    client.rpc = rpc  # type: ignore[method-assign]
    return client
