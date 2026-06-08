from fastapi import HTTPException

from app.supabase_rpc import map_rpc_error


class FakeAPIError(Exception):
    def __init__(self, message: str):
        self.message = message
        super().__init__(message)


def test_map_rpc_error_known_codes():
    exc = map_rpc_error(FakeAPIError("ORDER_NOT_FOUND"))
    assert isinstance(exc, HTTPException)
    assert exc.status_code == 404

    exc = map_rpc_error(FakeAPIError("ALREADY_HELD"))
    assert exc.status_code == 400
    assert "allaqachon" in exc.detail.lower()


def test_map_rpc_error_unknown():
    exc = map_rpc_error(FakeAPIError("SOMETHING_ELSE"))
    assert exc.status_code == 500
