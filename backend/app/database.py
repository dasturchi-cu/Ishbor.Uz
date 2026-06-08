from functools import lru_cache

from supabase import Client, create_client

from app.config import settings


@lru_cache
def get_supabase_admin() -> Client:
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise RuntimeError("SUPABASE_URL va SUPABASE_SERVICE_ROLE_KEY .env da kerak")
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


def create_supabase_user_client(access_token: str) -> Client:
    if not settings.supabase_url or not settings.supabase_anon_key:
        raise RuntimeError("SUPABASE_URL va SUPABASE_ANON_KEY .env da kerak")
    client = create_client(settings.supabase_url, settings.supabase_anon_key)
    client.postgrest.auth(access_token)
    return client


def get_supabase() -> Client:
    """Service role — faqat RPC, webhook, admin va RLS dan tashqari operatsiyalar."""
    return get_supabase_admin()


def reset_supabase_client() -> None:
    get_supabase_admin.cache_clear()
