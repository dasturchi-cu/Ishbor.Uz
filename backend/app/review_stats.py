"""Review statistikalarini batch so'rov bilan hisoblash (N+1 dan qochish)."""

from supabase import Client

from app.database import get_supabase_admin
from app.db_utils import run_query


def batch_review_stats(supabase: Client, freelancer_ids: list[str]) -> dict[str, tuple[float, int]]:
    if not freelancer_ids:
        return {}

    result = run_query(
        lambda: get_supabase_admin()
        .table("reviews")
        .select("freelancer_id, rating")
        .in_("freelancer_id", freelancer_ids)
        .execute()
    )

    buckets: dict[str, list[int]] = {}
    for row in result.data or []:
        fid = row["freelancer_id"]
        buckets.setdefault(fid, []).append(row["rating"])

    stats: dict[str, tuple[float, int]] = {}
    for fid in freelancer_ids:
        ratings = buckets.get(fid, [])
        if ratings:
            stats[fid] = (round(sum(ratings) / len(ratings), 1), len(ratings))
        else:
            stats[fid] = (0.0, 0)
    return stats


def batch_min_service_prices(supabase: Client, freelancer_ids: list[str]) -> dict[str, int]:
    if not freelancer_ids:
        return {}

    result = (
        supabase.table("services")
        .select("freelancer_id, price")
        .in_("freelancer_id", freelancer_ids)
        .execute()
    )

    prices: dict[str, int] = {}
    for row in result.data or []:
        fid = row["freelancer_id"]
        price = row["price"]
        if fid not in prices or price < prices[fid]:
            prices[fid] = price
    return prices


def batch_trust_scores(supabase: Client, user_ids: list[str]) -> dict[str, int]:
    if not user_ids:
        return {}

    result = run_query(
        lambda: supabase.table("user_reputation")
        .select("user_id, trust_score")
        .in_("user_id", user_ids)
        .execute()
    )

    scores: dict[str, int] = {}
    for row in result.data or []:
        scores[row["user_id"]] = int(row.get("trust_score") or 0)
    return scores
