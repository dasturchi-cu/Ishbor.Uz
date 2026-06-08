"""Click SHOP-API (prepare/complete) va to'lov havolasi."""

from __future__ import annotations

import hashlib
from typing import Any
from urllib.parse import urlencode

CLICK_PAY_BASE = "https://my.click.uz/services/pay"


def verify_prepare_signature(payload: dict[str, Any], secret_key: str) -> bool:
    sign_string = payload.get("sign_string")
    if not sign_string or not secret_key:
        return False
    raw = (
        f"{payload.get('click_trans_id', '')}"
        f"{payload.get('service_id', '')}"
        f"{secret_key}"
        f"{payload.get('merchant_trans_id', '')}"
        f"{payload.get('amount', '')}"
        f"{payload.get('action', '')}"
        f"{payload.get('sign_time', '')}"
    )
    return hashlib.md5(raw.encode()).hexdigest() == sign_string


def verify_complete_signature(payload: dict[str, Any], secret_key: str) -> bool:
    sign_string = payload.get("sign_string")
    if not sign_string or not secret_key:
        return False
    raw = (
        f"{payload.get('click_trans_id', '')}"
        f"{payload.get('service_id', '')}"
        f"{secret_key}"
        f"{payload.get('merchant_trans_id', '')}"
        f"{payload.get('merchant_prepare_id', '')}"
        f"{payload.get('amount', '')}"
        f"{payload.get('action', '')}"
        f"{payload.get('sign_time', '')}"
    )
    return hashlib.md5(raw.encode()).hexdigest() == sign_string


def build_pay_url(
    *,
    merchant_id: int,
    service_id: int,
    amount: int,
    merchant_trans_id: str,
    return_url: str,
) -> str:
    params = {
        "service_id": service_id,
        "merchant_id": merchant_id,
        "amount": amount,
        "transaction_param": merchant_trans_id,
        "return_url": return_url,
    }
    return f"{CLICK_PAY_BASE}?{urlencode(params)}"


def click_error_response(
    *,
    click_trans_id: int | str,
    merchant_trans_id: str,
    merchant_prepare_id: int | None = None,
    merchant_confirm_id: int | None = None,
    error: int,
    error_note: str,
) -> dict[str, Any]:
    body: dict[str, Any] = {
        "click_trans_id": click_trans_id,
        "merchant_trans_id": merchant_trans_id,
        "error": error,
        "error_note": error_note,
    }
    if merchant_prepare_id is not None:
        body["merchant_prepare_id"] = merchant_prepare_id
    if merchant_confirm_id is not None:
        body["merchant_confirm_id"] = merchant_confirm_id
    return body
