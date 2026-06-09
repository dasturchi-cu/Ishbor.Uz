"""URL va href validatsiyasi — XSS, phishing va open redirect oldini olish."""

from urllib.parse import urlparse

ALLOWED_PAYMENT_HOSTS = frozenset({"my.click.uz", "checkout.paycom.uz"})
ALLOWED_STORAGE_HOST_SUFFIX = ".supabase.co"


def is_safe_internal_href(href: str | None) -> bool:
    if not href:
        return True
    cleaned = href.strip()
    if not cleaned.startswith("/"):
        return False
    return not cleaned.startswith("//")


def is_safe_external_https_url(raw: str) -> bool:
    try:
        parsed = urlparse(raw.strip())
    except ValueError:
        return False
    if parsed.scheme != "https":
        return False
    host = (parsed.hostname or "").lower()
    return bool(host) and host not in ("localhost", "127.0.0.1", "0.0.0.0")


def is_allowed_storage_file_url(raw: str) -> bool:
    try:
        parsed = urlparse(raw.strip())
    except ValueError:
        return False
    if parsed.scheme != "https":
        return False
    host = (parsed.hostname or "").lower()
    if not host.endswith(ALLOWED_STORAGE_HOST_SUFFIX):
        return False
    return "/storage/v1/object/" in parsed.path


def is_allowed_payment_redirect_url(raw: str) -> bool:
    try:
        parsed = urlparse(raw.strip())
    except ValueError:
        return False
    if parsed.scheme != "https":
        return False
    return (parsed.hostname or "").lower() in ALLOWED_PAYMENT_HOSTS
