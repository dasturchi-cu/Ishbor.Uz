import base64
import json

from app.payments.payme import (
    build_checkout_url,
    rpc_error,
    rpc_result,
    som_to_tiyin,
    verify_basic_auth,
)


def test_som_to_tiyin():
    assert som_to_tiyin(1) == 100
    assert som_to_tiyin(50000) == 5_000_000


def test_verify_basic_auth_valid():
    token = base64.b64encode(b"Paycom:my-secret").decode()
    assert verify_basic_auth(f"Basic {token}", "Paycom", "my-secret") is True


def test_verify_basic_auth_rejects_invalid():
    assert verify_basic_auth("Basic bad", "Paycom", "my-secret") is False
    assert verify_basic_auth(None, "Paycom", "my-secret") is False


def test_build_checkout_url_encodes_payload():
    url = build_checkout_url(
        merchant_id="cashbox-1",
        amount_tiyin=1_500_000,
        account={"order_id": "intent-id"},
        return_url="http://localhost:3000/dashboard/orders/x",
    )
    assert url.startswith("https://checkout.paycom.uz/")
    token = url.split("/")[-1]
    padded = token + "=" * (-len(token) % 4)
    decoded = json.loads(base64.b64decode(padded).decode())
    assert decoded["m"] == "cashbox-1"
    assert decoded["a"] == 1_500_000
    assert decoded["ac"]["order_id"] == "intent-id"


def test_rpc_result_and_error():
    ok = rpc_result(1, {"allow": True})
    assert ok["id"] == 1
    assert ok["result"]["allow"] is True

    err = rpc_error(2, code=-31001, message="Wrong amount", data="amount")
    assert err["error"]["code"] == -31001
    assert err["id"] == 2
