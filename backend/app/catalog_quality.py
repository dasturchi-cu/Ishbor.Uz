"""Heuristics to hide low-quality / test listings from public catalog surfaces."""

from __future__ import annotations

import re

_JUNK_TITLES = frozenset(
    {
        "test",
        "tes",
        "asdf",
        "asdas",
        "asd",
        "qwerty",
        "ma suka",
        "xxx",
        "123",
        "1234",
        "aaaa",
        "bbbb",
    }
)

_REPEAT_CHAR = re.compile(r"(.)\1{4,}")


def is_catalog_quality_title(title: str | None) -> bool:
    text = (title or "").strip()
    if len(text) < 6:
        return False
    lower = text.lower()
    if lower in _JUNK_TITLES:
        return False
    if lower.startswith("test") or lower.startswith("tes") or lower.startswith("asd") or lower.startswith("sad"):
        return False
    if "suka" in lower or "asdas" in lower:
        return False
    if _REPEAT_CHAR.search(lower):
        return False
    letters = sum(1 for c in text if c.isalpha())
    if letters < max(4, len(text) // 3):
        return False
    words = [w for w in re.split(r"\s+", lower) if w]
    if len(words) == 1 and len(words[0]) < 6:
        return False
    return True


def is_catalog_quality_profile_name(name: str | None) -> bool:
    text = (name or "").strip()
    if len(text) < 2:
        return False
    lower = text.lower()
    if lower in _JUNK_TITLES or lower in {"dassad", "dasds", "adsdasadas"}:
        return False
    return is_catalog_quality_title(text)


def filter_quality_service_rows(rows: list[dict]) -> list[dict]:
    return [r for r in rows if is_catalog_quality_title(r.get("title"))]


def filter_quality_freelancer_rows(rows: list[dict]) -> list[dict]:
    return [r for r in rows if is_catalog_quality_profile_name(r.get("full_name"))]


def filter_quality_project_rows(rows: list[dict]) -> list[dict]:
    return [r for r in rows if is_catalog_quality_title(r.get("title"))]


def is_catalog_quality_text(text: str | None) -> bool:
    """Reviews, activity feed, and other user-visible prose."""
    return is_catalog_quality_title(text)
