"""Freelancer tajriba (rating) bo'yicha xizmat filtrlash."""

from __future__ import annotations

EXPERIENCE_LEVELS = frozenset({"exp_new", "exp_mid", "exp_expert"})
MAX_EXPERIENCE_SCAN = 500


def parse_experience_param(raw: str | None) -> set[str]:
    if not raw or not raw.strip():
        return set()
    return {part.strip() for part in raw.split(",") if part.strip() in EXPERIENCE_LEVELS}


def freelancer_matches_experience(avg_rating: float, levels: set[str]) -> bool:
    if not levels:
        return True
    checks: list[bool] = []
    if "exp_new" in levels:
        checks.append(avg_rating < 4 or avg_rating == 0)
    if "exp_mid" in levels:
        checks.append(avg_rating >= 4 and avg_rating < 4.7)
    if "exp_expert" in levels:
        checks.append(avg_rating >= 4.7)
    return any(checks)


def filter_service_rows_by_experience(
    rows: list[dict],
    stats_map: dict[str, tuple[float, int]],
    levels: set[str],
) -> list[dict]:
    if not levels:
        return rows
    filtered: list[dict] = []
    for row in rows:
        fid = row.get("freelancer_id")
        avg, _count = stats_map.get(fid, (0.0, 0)) if fid else (0.0, 0)
        if freelancer_matches_experience(avg, levels):
            filtered.append(row)
    return filtered
