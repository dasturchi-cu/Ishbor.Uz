import pytest

from app.database import UserSupabaseMisconfiguredError, create_supabase_user_client
from app.config import settings


def test_create_user_client_rejects_publishable_anon(monkeypatch):
    monkeypatch.setattr(settings, "supabase_url", "https://example.supabase.co")
    monkeypatch.setattr(settings, "supabase_anon_key", "sb_publishable_test_key")
    with pytest.raises(UserSupabaseMisconfiguredError):
        create_supabase_user_client("fake-jwt-token")
