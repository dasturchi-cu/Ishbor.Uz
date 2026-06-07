from fastapi import APIRouter, HTTPException, status

from app.database import get_supabase
from app.deps import CurrentUserId

router = APIRouter(prefix="/admin", tags=["admin"])


def _require_admin(user_id: str):
    supabase = get_supabase()
    profile = supabase.table("profiles").select("is_admin").eq("id", user_id).single().execute()
    if not profile.data or not profile.data.get("is_admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin ruxsati kerak")


@router.get("/stats")
def admin_stats(user_id: CurrentUserId):
    _require_admin(user_id)
    supabase = get_supabase()

    users = supabase.table("profiles").select("id", count="exact").execute()
    orders = supabase.table("orders").select("id", count="exact").execute()
    services = supabase.table("services").select("id", count="exact").execute()
    projects = supabase.table("projects").select("id", count="exact").execute()

    return {
        "users": users.count or 0,
        "orders": orders.count or 0,
        "services": services.count or 0,
        "projects": projects.count or 0,
    }


@router.get("/users")
def admin_list_users(user_id: CurrentUserId):
    _require_admin(user_id)
    supabase = get_supabase()
    result = (
        supabase.table("profiles")
        .select("id, full_name, email, role, region, created_at, is_admin")
        .order("created_at", desc=True)
        .limit(100)
        .execute()
    )
    return result.data or []


@router.get("/orders")
def admin_list_orders(user_id: CurrentUserId):
    _require_admin(user_id)
    supabase = get_supabase()
    result = (
        supabase.table("orders")
        .select("*, services(title)")
        .order("created_at", desc=True)
        .limit(100)
        .execute()
    )
    return result.data or []
