from fastapi import APIRouter, HTTPException, status

from app.deps import UserAuthDep

router = APIRouter(prefix="/saved-items", tags=["saved-items"])


@router.get("/services/enriched")
def list_saved_services_enriched(auth: UserAuthDep):
    user_id = auth.user_id
    supabase = auth.supabase
    saved = (
        supabase.table("saved_items")
        .select("service_id")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    ids = [row["service_id"] for row in (saved.data or [])]
    if not ids:
        return []
    result = (
        supabase.table("services")
        .select("*")
        .in_("id", ids)
        .eq("is_hidden", False)
        .execute()
    )
    by_id = {row["id"]: row for row in (result.data or [])}
    return [by_id[sid] for sid in ids if sid in by_id]


@router.get("/freelancers/enriched")
def list_saved_freelancers_enriched(auth: UserAuthDep):
    user_id = auth.user_id
    supabase = auth.supabase
    try:
        saved = (
            supabase.table("saved_freelancers")
            .select("freelancer_id")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
    except Exception:
        return []
    ids = [row["freelancer_id"] for row in (saved.data or [])]
    if not ids:
        return []
    result = (
        supabase.table("profiles")
        .select(
            "id, role, full_name, bio, region, specialty, avatar_url, created_at, profile_views, is_verified"
        )
        .in_("id", ids)
        .execute()
    )
    by_id = {row["id"]: row for row in (result.data or [])}
    return [by_id[fid] for fid in ids if fid in by_id]


@router.get("")
def list_saved_services(auth: UserAuthDep):
    user_id = auth.user_id
    supabase = auth.supabase
    result = (
        supabase.table("saved_items")
        .select("service_id, created_at")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return {"service_ids": [row["service_id"] for row in (result.data or [])]}


@router.post("/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
def save_service(service_id: str, auth: UserAuthDep):
    user_id = auth.user_id
    supabase = auth.supabase
    service = supabase.table("services").select("id").eq("id", service_id).single().execute()
    if not service.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Xizmat topilmadi")

    existing = (
        supabase.table("saved_items")
        .select("id")
        .eq("user_id", user_id)
        .eq("service_id", service_id)
        .limit(1)
        .execute()
    )
    if existing.data:
        return None

    supabase.table("saved_items").insert({"user_id": user_id, "service_id": service_id}).execute()
    return None


@router.delete("/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
def unsave_service(service_id: str, auth: UserAuthDep):
    user_id = auth.user_id
    supabase = auth.supabase
    supabase.table("saved_items").delete().eq("user_id", user_id).eq("service_id", service_id).execute()
    return None


@router.get("/freelancers")
def list_saved_freelancers(auth: UserAuthDep):
    user_id = auth.user_id
    supabase = auth.supabase
    try:
        result = (
            supabase.table("saved_freelancers")
            .select("freelancer_id, created_at")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
        return {"freelancer_ids": [row["freelancer_id"] for row in (result.data or [])]}
    except Exception:
        return {"freelancer_ids": []}


@router.post("/freelancers/{freelancer_id}", status_code=status.HTTP_204_NO_CONTENT)
def save_freelancer(freelancer_id: str, auth: UserAuthDep):
    user_id = auth.user_id
    supabase = auth.supabase
    profile = (
        supabase.table("profiles")
        .select("id, role")
        .eq("id", freelancer_id)
        .single()
        .execute()
    )
    if not profile.data or profile.data.get("role") != "freelancer":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Freelancer topilmadi")
    if freelancer_id == user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="O'zingizni saqlay olmaysiz")

    existing = (
        supabase.table("saved_freelancers")
        .select("id")
        .eq("user_id", user_id)
        .eq("freelancer_id", freelancer_id)
        .limit(1)
        .execute()
    )
    if existing.data:
        return None

    supabase.table("saved_freelancers").insert(
        {"user_id": user_id, "freelancer_id": freelancer_id}
    ).execute()
    return None


@router.delete("/freelancers/{freelancer_id}", status_code=status.HTTP_204_NO_CONTENT)
def unsave_freelancer(freelancer_id: str, auth: UserAuthDep):
    user_id = auth.user_id
    supabase = auth.supabase
    supabase.table("saved_freelancers").delete().eq("user_id", user_id).eq(
        "freelancer_id", freelancer_id
    ).execute()
    return None


@router.get("/projects")
def list_saved_projects(auth: UserAuthDep):
    user_id = auth.user_id
    supabase = auth.supabase
    rows = (
        supabase.table("saved_projects")
        .select("project_id, created_at, projects(*, profiles(full_name, region))")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return rows.data or []


@router.post("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def save_project(project_id: str, auth: UserAuthDep):
    user_id = auth.user_id
    supabase = auth.supabase
    existing = (
        supabase.table("saved_projects")
        .select("id")
        .eq("user_id", user_id)
        .eq("project_id", project_id)
        .limit(1)
        .execute()
    )
    if existing.data:
        return None
    supabase.table("saved_projects").insert(
        {"user_id": user_id, "project_id": project_id}
    ).execute()
    return None


@router.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def unsave_project(project_id: str, auth: UserAuthDep):
    user_id = auth.user_id
    supabase = auth.supabase
    supabase.table("saved_projects").delete().eq("user_id", user_id).eq(
        "project_id", project_id
    ).execute()
    return None
