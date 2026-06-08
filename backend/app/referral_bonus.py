"""Referral bonus — faqat birinchi muvaffaqiyatli buyurtmadan keyin."""

from __future__ import annotations

REFERRAL_BONUS = 50_000


def try_credit_referral_bonus(supabase, completed_user_id: str) -> None:
    """Referred user birinchi buyurtmasini tugatganda referrer ga bonus."""
    profile = (
        supabase.table("profiles")
        .select("referred_by")
        .eq("id", completed_user_id)
        .single()
        .execute()
    )
    if not profile.data:
        return
    referrer_id = profile.data.get("referred_by")
    if not referrer_id:
        return

    referral = (
        supabase.table("referrals")
        .select("id, bonus_credited")
        .eq("referred_id", completed_user_id)
        .eq("referrer_id", referrer_id)
        .limit(1)
        .execute()
    )
    if not referral.data or referral.data[0].get("bonus_credited"):
        return

    referrer = (
        supabase.table("profiles")
        .select("wallet_balance")
        .eq("id", referrer_id)
        .single()
        .execute()
    )
    if not referrer.data:
        return

    balance = int(referrer.data.get("wallet_balance") or 0)
    supabase.table("profiles").update({"wallet_balance": balance + REFERRAL_BONUS}).eq(
        "id", referrer_id
    ).execute()
    supabase.table("transactions").insert(
        {
            "user_id": referrer_id,
            "type": "referral_bonus",
            "amount": REFERRAL_BONUS,
            "provider": "platform",
            "status": "completed",
        }
    ).execute()
    supabase.table("referrals").update({"bonus_credited": True}).eq(
        "id", referral.data[0]["id"]
    ).execute()
