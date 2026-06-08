"""Escrow va balans yordamchilari."""

from fastapi import HTTPException, status


def hold_escrow(supabase, order: dict, user_id: str, provider: str, provider_ref: str | None = None) -> dict:
    if user_id != order["client_id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Faqat mijoz to'laydi")
    if order["status"] != "pending":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Buyurtma pending holatda emas")
    if order.get("payment_status") == "held":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="To'lov allaqachon amalga oshirilgan")

    amount = order["amount"]
    supabase.table("transactions").insert(
        {
            "order_id": order["id"],
            "user_id": user_id,
            "type": "escrow_hold",
            "amount": amount,
            "provider": provider,
            "provider_ref": provider_ref,
            "status": "completed",
        }
    ).execute()

    updated = (
        supabase.table("orders")
        .update({"payment_status": "held"})
        .eq("id", order["id"])
        .execute()
    )
    if not updated.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="To'lov saqlanmadi")
    return updated.data[0]


def release_escrow(supabase, order: dict) -> dict:
    if order.get("payment_status") != "held":
        return order

    amount = order["amount"]
    freelancer_id = order["freelancer_id"]

    freelancer = (
        supabase.table("profiles")
        .select("wallet_balance")
        .eq("id", freelancer_id)
        .single()
        .execute()
    )
    current_balance = int((freelancer.data or {}).get("wallet_balance") or 0)

    supabase.table("profiles").update({"wallet_balance": current_balance + amount}).eq("id", freelancer_id).execute()

    supabase.table("transactions").insert(
        {
            "order_id": order["id"],
            "user_id": freelancer_id,
            "type": "escrow_release",
            "amount": amount,
            "provider": "platform",
            "status": "completed",
        }
    ).execute()

    updated = (
        supabase.table("orders")
        .update({"payment_status": "released"})
        .eq("id", order["id"])
        .execute()
    )
    return (updated.data or [order])[0]


def refund_escrow(supabase, order: dict) -> dict:
    """Return held escrow to client wallet (dispute cancel / refund)."""
    if order.get("payment_status") != "held":
        return order

    amount = int(order["amount"])
    client_id = order["client_id"]

    client = (
        supabase.table("profiles")
        .select("wallet_balance")
        .eq("id", client_id)
        .single()
        .execute()
    )
    balance = int((client.data or {}).get("wallet_balance") or 0)
    supabase.table("profiles").update({"wallet_balance": balance + amount}).eq("id", client_id).execute()

    supabase.table("transactions").insert(
        {
            "order_id": order["id"],
            "user_id": client_id,
            "type": "refund",
            "amount": amount,
            "provider": "platform",
            "status": "completed",
        }
    ).execute()

    updated = (
        supabase.table("orders")
        .update({"payment_status": "refunded"})
        .eq("id", order["id"])
        .execute()
    )
    return (updated.data or [order])[0]
