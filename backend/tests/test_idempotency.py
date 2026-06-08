from app.idempotency import _hash_request, _normalize_key, _route_key


def test_route_key_matches_checkout():
    assert (
        _route_key("/api/v1/payments/orders/abc/checkout", "POST")
        == "/api/v1/payments/orders/abc/checkout"
    )
    assert _route_key("/api/v1/payments/orders/abc/checkout", "GET") is None
    assert _route_key("/api/v1/orders", "POST") == "/api/v1/orders"
    assert _route_key("/api/v1/payments/withdrawals", "POST") == "/api/v1/payments/withdrawals"


def test_normalize_key():
    assert _normalize_key("abc12345") == "abc12345"
    assert _normalize_key("short") is None
    assert _normalize_key(None) is None
    assert _normalize_key("bad key!") is None


def test_hash_request_stable():
    body = b'{"provider":"sandbox"}'
    assert _hash_request(body) == _hash_request(body)
    assert _hash_request(body) != _hash_request(b'{"provider":"click"}')
