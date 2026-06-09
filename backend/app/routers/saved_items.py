from fastapi import APIRouter, HTTPException, status

from app.db_utils import run_query
from app.deps import UserAuthDep
from app.postgrest_embed import PROJECT_CLIENT_PROFILE

router = APIRouter(prefix="/saved-items", tags=["saved-items"])

_PUBLIC_FREELANCER_TABLE = "public_freelancer_profiles"
_PUBLIC_FREELANCER_COLUMNS = (
    "id, role, full_name, bio, region, specialty, avatar_url, created_at, profile_views, is_verified"
)


@router.get("/services/enriched")
def list_saved_services_enriched(auth: UserAuthDep):
    user_id = auth.user_id
    supabase = auth.supabase
    saved = run_query(
        lambda: supabase.table("saved_items")
        .select("service_id")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    ids = [row["service_id"] for row in (saved.data or [])]
    if not ids:
        return []
    result = run_query(
        lambda: supabase.table("services")
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
        saved = run_query(
            lambda: supabase.table("saved_freelancers")
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
    result = run_query(
        lambda: supabase.table(_PUBLIC_FREELANCER_TABLE)
        .select(_PUBLIC_FREELANCER_COLUMNS)
        .in_("id", ids)
        .execute()
    )
    by_id = {row["id"]: row for row in (result.data or [])}
    return [by_id[fid] for fid in ids if fid in by_id]


@router.get("")
def list_saved_services(auth: UserAuthDep):
    user_id = auth.user_id
    supabase = auth.supabase
    result = run_query(
        lambda: supabase.table("saved_items")
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
    service = run_query(
        lambda: supabase.table("services").select("id").eq("id", service_id).single().execute()
    )
    if not service.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Xizmat topilmadi")

    existing = run_query(
        lambda: supabase.table("saved_items")
        .select("id")
        .eq("user_id", user_id)
        .eq("service_id", service_id)
        .limit(1)
        .execute()
    )
    if existing.data:
        return None

    run_query(
        lambda: supabase.table("saved_items")
        .insert({"user_id": user_id, "service_id": service_id})
        .execute()
    )
    return None


@router.delete("/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
def unsave_service(service_id: str, auth: UserAuthDep):
    user_id = auth.user_id
    supabase = auth.supabase
    run_query(
        lambda: supabase.table("saved_items")
        .delete()
        .eq("user_id", user_id)
        .eq("service_id", service_id)
        .execute()
    )
    return None


@router.get("/freelancers")
def list_saved_freelancers(auth: UserAuthDep):
    user_id = auth.user_id
    supabase = auth.supabase
    try:
        result = run_query(
            lambda: supabase.table("saved_freelancers")
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
    profile = run_query(
        lambda: supabase.table("profiles")
        .select("id, role")
        .eq("id", freelancer_id)
        .single()
        .execute()
    )
    if not profile.data or profile.data.get("role") != "freelancer":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Freelancer topilmadi")
    if freelancer_id == user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="O'zingizni saqlay olmaysiz")

    existing = run_query(
        lambda: supabase.table("saved_freelancers")
        .select("id")
        .eq("user_id", user_id)
        .eq("freelancer_id", freelancer_id)
        .limit(1)
        .execute()
    )
    if existing.data:
        return None

    run_query(
        lambda: supabase.table("saved_freelancers")
        .insert({"user_id": user_id, "freelancer_id": freelancer_id})
        .execute()
    )
    return None


@router.delete("/freelancers/{freelancer_id}", status_code=status.HTTP_204_NO_CONTENT)
def unsave_freelancer(freelancer_id: str, auth: UserAuthDep):
    user_id = auth.user_id
    supabase = auth.supabase
    run_query(
        lambda: supabase.table("saved_freelancers")
        .delete()
        .eq("user_id", user_id)
        .eq("freelancer_id", freelancer_id)
        .execute()
    )
    return None


@router.get("/projects")
def list_saved_projects(auth: UserAuthDep):
    user_id = auth.user_id
    supabase = auth.supabase
    try:
        saved = run_query(
            lambda: supabase.table("saved_projects")
            .select("project_id, created_at")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
    except Exception:
        return []
    project_ids = [row["project_id"] for row in (saved.data or [])]
    if not project_ids:
        return []
    try:
        projects_result = run_query(
            lambda: supabase.table("projects")
            .select(f"*, {PROJECT_CLIENT_PROFILE}(full_name, region)")
            .in_("id", project_ids)
            .execute()
        )
    except Exception:
        projects_result = run_query(
            lambda: supabase.table("projects").select("*").in_("id", project_ids).execute()
        )
    by_id = {row["id"]: row for row in (projects_result.data or [])}
    return [
        {
            "project_id": row["project_id"],
            "created_at": row["created_at"],
            "projects": by_id.get(row["project_id"]),
        }
        for row in (saved.data or [])
        if row["project_id"] in by_id
    ]


@router.post("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def save_project(project_id: str, auth: UserAuthDep):
    user_id = auth.user_id
    supabase = auth.supabase
    existing = run_query(
        lambda: supabase.table("saved_projects")
        .select("id")
        .eq("user_id", user_id)
        .eq("project_id", project_id)
        .limit(1)
        .execute()
    )
    if existing.data:
        return None

    project = run_query(
        lambda: supabase.table("projects").select("id").eq("id", project_id).single().execute()
    )
    if not project.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Loyiha topilmadi")

    run_query(
        lambda: supabase.table("saved_projects")
        .insert({"user_id": user_id, "project_id": project_id})
        .execute()
    )
    return None


@router.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def unsave_project(project_id: str, auth: UserAuthDep):
    user_id = auth.user_id
    supabase = auth.supabase
    run_query(
        lambda: supabase.table("saved_projects")
        .delete()
        .eq("user_id", user_id)
        .eq("project_id", project_id)
        .execute()
    )
    return None
