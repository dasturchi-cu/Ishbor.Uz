import hashlib

from app.payments.click import (
    build_pay_url,
    click_error_response,
    verify_complete_signature,
    verify_prepare_signature,
)


def test_verify_prepare_signature_valid():
    secret = "test-secret"
    payload = {
        "click_trans_id": 1,
        "service_id": 2,
        "merchant_trans_id": "intent-uuid",
        "amount": 50000.0,
        "action": 0,
        "sign_time": "2024-06-01 12:00:00",
    }
    raw = (
        f"{payload['click_trans_id']}{payload['service_id']}{secret}"
        f"{payload['merchant_trans_id']}{payload['amount']}{payload['action']}{payload['sign_time']}"
    )
    payload["sign_string"] = hashlib.md5(raw.encode()).hexdigest()
    assert verify_prepare_signature(payload, secret) is True


def test_verify_prepare_signature_rejects_wrong_secret():
    payload = {
        "click_trans_id": 1,
        "service_id": 2,
        "merchant_trans_id": "x",
        "amount": 100.0,
        "action": 0,
        "sign_time": "2024-06-01 12:00:00",
        "sign_string": "bad",
    }
    assert verify_prepare_signature(payload, "secret") is False


def test_verify_complete_signature_valid():
    secret = "test-secret"
    payload = {
        "click_trans_id": 9,
        "service_id": 2,
        "merchant_trans_id": "intent-uuid",
        "merchant_prepare_id": 42,
        "amount": 50000.0,
        "action": 1,
        "sign_time": "2024-06-01 12:05:00",
    }
    raw = (
        f"{payload['click_trans_id']}{payload['service_id']}{secret}"
        f"{payload['merchant_trans_id']}{payload['merchant_prepare_id']}"
        f"{payload['amount']}{payload['action']}{payload['sign_time']}"
    )
    payload["sign_string"] = hashlib.md5(raw.encode()).hexdigest()
    assert verify_complete_signature(payload, secret) is True


def test_build_pay_url():
    url = build_pay_url(
        merchant_id=11,
        service_id=22,
        amount=100000,
        merchant_trans_id="abc-123",
        return_url="http://localhost:3000/dashboard/orders/abc",
    )
    assert url.startswith("https://my.click.uz/services/pay?")
    assert "merchant_id=11" in url
    assert "transaction_param=abc-123" in url


def test_click_error_response_shape():
    body = click_error_response(
        click_trans_id=5,
        merchant_trans_id="order-1",
        merchant_prepare_id=99,
        error=0,
        error_note="Success",
    )
    assert body["error"] == 0
    assert body["merchant_prepare_id"] == 99
