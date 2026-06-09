from functools import lru_cache

from httpx import Timeout
from supabase import Client, create_client
from supabase.lib.client_options import SyncClientOptions

from app.config import settings
from app.supabase_instrumentation import instrument_supabase_client

_SUPABASE_TIMEOUT = Timeout(60.0, connect=15.0)


def _is_jwt_supabase_key(key: str) -> bool:
    k = key.strip()
    return k.startswith("eyJ") and len(k) > 80


@lru_cache
def get_supabase_admin() -> Client:
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise RuntimeError("SUPABASE_URL va SUPABASE_SERVICE_ROLE_KEY .env da kerak")
    options = SyncClientOptions(postgrest_client_timeout=_SUPABASE_TIMEOUT)
    return instrument_supabase_client(
        create_client(settings.supabase_url, settings.supabase_service_role_key, options=options)
    )


def create_supabase_user_client(access_token: str) -> Client:
    """Autentifikatsiya qilingan foydalanuvchi uchun Supabase client.

    Legacy JWT anon key bo'lsa — user JWT bilan RLS ishlaydi.
    Yangi sb_publishable_* kalitlarda supabase-py ishlamaydi; JWT allaqachon
    tekshirilgani uchun service role ishlatiladi (routerlar user_id bo'yicha filtrlashadi).
    """
    if not settings.supabase_url:
        raise RuntimeError("SUPABASE_URL kerak")

    anon = settings.supabase_anon_key.strip()
    if _is_jwt_supabase_key(anon):
        options = SyncClientOptions(postgrest_client_timeout=_SUPABASE_TIMEOUT)
        client = create_client(settings.supabase_url, anon, options=options)
        client.postgrest.auth(access_token)
        return instrument_supabase_client(client)

    if not settings.supabase_service_role_key:
        raise RuntimeError(
            "backend/.env da SUPABASE_SERVICE_ROLE_KEY kerak "
            "(publishable key bilan JWT anon o'rniga)"
        )
    return get_supabase_admin()


def get_supabase() -> Client:
    """Service role — faqat RPC, webhook, admin va RLS dan tashqari operatsiyalar."""
    return get_supabase_admin()


def reset_supabase_client() -> None:
    get_supabase_admin.cache_clear()
