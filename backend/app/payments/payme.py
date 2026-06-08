"""Payme Merchant API (JSON-RPC 2.0) va checkout havolasi."""

from __future__ import annotations

import base64
import json
import time
from typing import Any

PAYME_CHECKOUT_BASE = "https://checkout.paycom.uz"

# Payme transaction states
STATE_CREATED = 1
STATE_COMPLETED = 2
STATE_CANCELLED = -1
STATE_CANCELLED_AFTER_COMPLETE = -2

# JSON-RPC error codes
ERR_INVALID_JSON = -32700
ERR_METHOD_NOT_FOUND = -32601
ERR_ACCESS_DENIED = -32504
ERR_SYSTEM = -32400
ERR_WRONG_AMOUNT = -31001
ERR_TRANSACTION_NOT_FOUND = -31003
ERR_CANT_CANCEL = -31007
ERR_UNABLE_TO_COMPLETE = -31008
ERR_ORDER_NOT_FOUND = -31050
ERR_IN_PROGRESS = -31088
ERR_TERMINAL_STATE = -31098


def som_to_tiyin(amount_som: int) -> int:
    return amount_som * 100


def tiyin_to_som(amount_tiyin: int) -> int:
    return amount_tiyin // 100


def verify_basic_auth(authorization: str | None, login: str, password: str) -> bool:
    if not authorization or not authorization.startswith("Basic ") or not password:
        return False
    try:
        decoded = base64.b64decode(authorization[6:].strip()).decode("utf-8")
    except (ValueError, UnicodeDecodeError):
        return False
    user, _, pwd = decoded.partition(":")
    return user == login and pwd == password


def build_checkout_url(
    *,
    merchant_id: str,
    amount_tiyin: int,
    account: dict[str, str],
    return_url: str,
    language: str = "uz",
) -> str:
    payload = {
        "m": merchant_id,
        "ac": account,
        "a": amount_tiyin,
        "c": return_url,
        "l": language,
    }
    raw = json.dumps(payload, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    token = base64.b64encode(raw).decode("ascii").rstrip("=")
    return f"{PAYME_CHECKOUT_BASE}/{token}"


def rpc_result(request_id: int | str | None, result: dict[str, Any]) -> dict[str, Any]:
    body: dict[str, Any] = {"result": result}
    if request_id is not None:
        body["id"] = request_id
    return body


def rpc_error(
    request_id: int | str | None,
    *,
    code: int,
    message: str,
    data: str | None = None,
) -> dict[str, Any]:
    err: dict[str, Any] = {"code": code, "message": message}
    if data is not None:
        err["data"] = data
    body: dict[str, Any] = {"error": err}
    if request_id is not None:
        body["id"] = request_id
    return body


def now_ms() -> int:
    return int(time.time() * 1000)
