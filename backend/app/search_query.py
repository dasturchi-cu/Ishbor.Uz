"""Shared search tokenization, synonym expansion, and relevance ranking."""

from __future__ import annotations

import re
from typing import Any, Callable

from app.search_utils import sanitize_search_term

_TOKEN_SPLIT = re.compile(r"[\s,;.+/\\-]+")

# uz / ru / en aliases → related terms for broader recall
_TOKEN_EXPANSIONS: dict[str, list[str]] = {
    "dizayn": ["design", "graphic", "uiux", "logo", "brend", "branding"],
    "design": ["dizayn", "graphic", "uiux", "logo"],
    "logo": ["graphic", "brend", "branding", "dizayn", "logotip"],
    "logotip": ["logo", "graphic"],
    "python": ["django", "fastapi", "backend", "dasturlash", "dastur"],
    "django": ["python", "web"],
    "telegram": ["tg", "bot", "бот"],
    "bot": ["telegram", "бот", "bot"],
    "tg": ["telegram", "bot"],
    "web": ["veb", "website", "site", "sayt", "sayt"],
    "sayt": ["web", "veb", "website", "site"],
    "veb": ["web", "sayt", "website"],
    "website": ["web", "sayt", "veb"],
    "seo": ["sem", "marketing", "qidiruv", "optimizatsiya"],
    "smm": ["marketing", "instagram", "telegram", "target"],
    "grafik": ["graphic", "dizayn", "design"],
    "graphic": ["grafik", "dizayn", "logo"],
    "ui": ["uiux", "ux", "dizayn"],
    "ux": ["uiux", "ui", "dizayn"],
    "uiux": ["ui", "ux", "dizayn", "design"],
    "dasturlash": ["web", "mobile", "python", "developer"],
    "dastur": ["web", "mobile", "python"],
    "developer": ["web", "dasturlash"],
    "mutaxassis": ["freelancer", "specialist"],
    "marketing": ["smm", "seo"],
    "video": ["montaj", "youtube"],
    "writing": ["matn", "copy", "content"],
    "matn": ["writing", "content"],
}

MAX_SEARCH_SCAN = 500

SERVICE_CATEGORY_SLUGS = frozenset(
    {"web", "mobile", "uiux", "graphic", "writing", "video", "seo", "smm", "design"}
)

# Search aliases that map to canonical category slugs (enum values)
_CATEGORY_ALIASES: dict[str, str] = {
    "design": "graphic",
    "dizayn": "graphic",
    "grafik": "graphic",
    "logo": "graphic",
    "logotip": "graphic",
    "ui": "uiux",
    "ux": "uiux",
    "veb": "web",
    "sayt": "web",
    "website": "web",
    "site": "web",
    "bot": "web",
    "telegram": "web",
    "python": "web",
    "django": "web",
    "marketing": "smm",
}


def tokenize_search(raw: str | None, max_tokens: int = 5) -> list[str]:
    cleaned = sanitize_search_term(raw, max_len=120)
    if not cleaned:
        return []
    tokens = [t for t in _TOKEN_SPLIT.split(cleaned.lower()) if len(t) >= 2]
    return tokens[:max_tokens]


def expand_tokens(tokens: list[str]) -> list[str]:
    out: list[str] = []
    seen: set[str] = set()
    for token in tokens:
        variants = [token, *(_TOKEN_EXPANSIONS.get(token, []))]
        for variant in variants:
            v = variant.lower().strip()
            if v and len(v) >= 2 and v not in seen:
                seen.add(v)
                out.append(v)
    return out


def _category_slug_for_term(term: str) -> str | None:
    if term in SERVICE_CATEGORY_SLUGS:
        return term
    return _CATEGORY_ALIASES.get(term)


def apply_search_tokens(query: Any, tokens: list[str], text_fields: list[str]) -> Any:
    """AND each original token; each token matches any expanded variant on any field."""
    if not tokens:
        return query
    for token in tokens:
        variants = expand_tokens([token])
        parts: list[str] = []
        for variant in variants:
            pattern = f"%{variant}%"
            cat_slug = _category_slug_for_term(variant)
            for field in text_fields:
                if field == "category":
                    if cat_slug:
                        parts.append(f"category.eq.{cat_slug}")
                else:
                    parts.append(f"{field}.ilike.{pattern}")
        if parts:
            query = query.or_(",".join(parts))
    return query


def relevance_score(
    row: dict,
    tokens: list[str],
    *,
    title_key: str = "title",
    desc_key: str = "description",
    cat_key: str = "category",
    name_key: str = "full_name",
    specialty_key: str = "specialty",
    bio_key: str = "bio",
    skills_key: str = "skills",
) -> int:
    title = (row.get(title_key) or "").lower()
    desc = (row.get(desc_key) or "").lower()
    cat = (row.get(cat_key) or "").lower()
    specialty = (row.get(specialty_key) or "").lower()
    bio = (row.get(bio_key) or "").lower()
    name = (row.get(name_key) or "").lower()
    username = (row.get("username") or "").lower()
    skills = " ".join(str(s) for s in (row.get(skills_key) or [])).lower()
    terms = expand_tokens(tokens)
    score = 0
    for term in terms:
        if term in title or term in name:
            score += 14
        elif term in username:
            score += 12
        elif term in specialty:
            score += 11
        elif term in cat:
            score += 9
        elif term in skills:
            score += 8
        elif term in desc or term in bio:
            score += 4
        elif any(term in part for part in (title, desc, specialty, skills)):
            score += 2
    return score


def sort_by_relevance(
    rows: list[dict],
    raw_query: str | None,
    score_fn: Callable[[dict], int] | None = None,
) -> list[dict]:
    tokens = tokenize_search(raw_query)
    if not tokens:
        return rows
    scorer = score_fn or (lambda row: relevance_score(row, tokens))
    return sorted(
        rows,
        key=lambda row: (scorer(row), str(row.get("created_at") or "")),
        reverse=True,
    )
