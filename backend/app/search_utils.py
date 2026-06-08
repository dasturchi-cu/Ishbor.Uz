import re

_POSTGREST_FILTER_UNSAFE = re.compile(r"[,().\\%]")


def sanitize_search_term(raw: str | None, max_len: int = 80) -> str | None:
    """PostgREST .or_ filter uchun xavfsiz qidiruv matni."""
    if not raw:
        return None
    cleaned = _POSTGREST_FILTER_UNSAFE.sub(" ", raw.strip())
    cleaned = " ".join(cleaned.split())
    if not cleaned:
        return None
    return cleaned[:max_len]
