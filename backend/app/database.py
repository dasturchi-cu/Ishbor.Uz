from functools import lru_cache

from supabase import Client, create_client

from app.config import settings


@lru_cache
def get_supabase() -> Client:
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise RuntimeError("SUPABASE_URL va SUPABASE_SERVICE_ROLE_KEY .env da kerak")
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


def reset_supabase_client() -> None:
    get_supabase.cache_clear()
