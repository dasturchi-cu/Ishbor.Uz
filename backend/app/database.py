from functools import lru_cache

from httpx import Timeout
from supabase import Client, create_client
from supabase.lib.client_options import SyncClientOptions

from app.config import settings
from app.supabase_instrumentation import instrument_supabase_client

# Read/connect qisqa — dev da frontend 15–25s timeout; uzoq osilish → 408
_SUPABASE_TIMEOUT = Timeout(12.0, connect=5.0)


class UserSupabaseMisconfiguredError(RuntimeError):
    """JWT anon key yo'q — user-scoped Supabase client yaratib bo'lmaydi."""


def _is_jwt_supabase_key(key: str) -> bool:
    k = key.strip()
    return k.startswith("eyJ") and len(k) > 80


def _build_supabase_admin_client() -> Client:
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise RuntimeError("SUPABASE_URL va SUPABASE_SERVICE_ROLE_KEY .env da kerak")
    options = SyncClientOptions(postgrest_client_timeout=_SUPABASE_TIMEOUT)
    return instrument_supabase_client(
        create_client(settings.supabase_url, settings.supabase_service_role_key, options=options)
    )


@lru_cache
def get_supabase_admin() -> Client:
    return _build_supabase_admin_client()


def create_supabase_admin_client() -> Client:
    """Parallel threadlar uchun — singleton httpx client thread-safe emas."""
    return _build_supabase_admin_client()


def create_supabase_user_client(access_token: str) -> Client:
    """Autentifikatsiya qilingan foydalanuvchi uchun RLS-scoped Supabase client.

    Faqat legacy JWT anon key (eyJ...) bilan ishlaydi — user JWT PostgREST orqali RLS ni qo'llaydi.
    Publishable (sb_publishable_*) kalitlar user client sifatida ishlatilmaydi.
    """
    if not settings.supabase_url:
        raise RuntimeError("SUPABASE_URL kerak")

    anon = settings.supabase_anon_key.strip()
    if not _is_jwt_supabase_key(anon):
        raise UserSupabaseMisconfiguredError(
            "SUPABASE_ANON_KEY legacy JWT (eyJ...) bo'lishi kerak. "
            "Publishable kalit bilan service_role fallback taqiqlangan — RLS buziladi."
        )

    options = SyncClientOptions(postgrest_client_timeout=_SUPABASE_TIMEOUT)
    client = create_client(settings.supabase_url, anon, options=options)
    client.postgrest.auth(access_token)
    return instrument_supabase_client(client)


def get_supabase() -> Client:
    """Service role — faqat RPC, webhook, admin va RLS dan tashqari operatsiyalar."""
    return get_supabase_admin()


def reset_supabase_client() -> None:
    get_supabase_admin.cache_clear()
