from unittest.mock import MagicMock

from app.client_ip import get_client_ip


def _request(*, forwarded: str | None = None, host: str | None = "127.0.0.1"):
    req = MagicMock()
    req.headers = {}
    if forwarded is not None:
        req.headers["x-forwarded-for"] = forwarded
    if host is None:
        req.client = None
    else:
        req.client = MagicMock(host=host)
    return req


def test_get_client_ip_uses_first_x_forwarded_for_hop():
    req = _request(forwarded="203.0.113.1, 10.0.0.1")
    assert get_client_ip(req) == "203.0.113.1"


def test_get_client_ip_falls_back_to_client_host():
    req = _request(host="192.168.1.5")
    assert get_client_ip(req) == "192.168.1.5"


def test_get_client_ip_unknown_when_missing():
    req = _request(host=None)
    assert get_client_ip(req) == "unknown"
