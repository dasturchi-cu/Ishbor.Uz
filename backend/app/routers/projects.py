from fastapi import APIRouter, HTTPException, Query, status

from app.database import get_supabase
from app.db_utils import run_query
from app.deps import CurrentUserId
from app.schemas import ProjectCreate, ProjectResponse, ProjectStatusUpdate

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=list[ProjectResponse])
def list_projects(
    status_filter: str | None = Query(default="open", alias="status"),
    client_id: str | None = Query(default=None),
    q: str | None = Query(default=None),
    region: str | None = Query(default=None),
    category: str | None = Query(default=None),
    limit: int = Query(default=50, le=200),
    offset: int = Query(default=0, ge=0),
):
    supabase = get_supabase()
    query = supabase.table("projects").select("*, profiles(full_name, region)")

    if status_filter:
        query = query.eq("status", status_filter)
    if client_id:
        query = query.eq("client_id", client_id)
    else:
        query = query.eq("is_public", True)
    if region:
        query = query.eq("region", region)
    if category:
        query = query.eq("category", category)
    if q:
        pattern = f"%{q.strip()}%"
        query = query.or_(f"title.ilike.{pattern},description.ilike.{pattern}")

    result = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
    rows = result.data or []
    if not rows:
        return []
    project_ids = [r["id"] for r in rows]
    counts = (
        supabase.table("project_applications")
        .select("project_id")
        .in_("project_id", project_ids)
        .execute()
    )
    count_map: dict[str, int] = {}
    for row in counts.data or []:
        pid = row["project_id"]
        count_map[pid] = count_map.get(pid, 0) + 1
    return [{**r, "application_count": count_map.get(r["id"], 0)} for r in rows]


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: str):
    supabase = get_supabase()
    result = (
        supabase.table("projects")
        .select("*, profiles(full_name, region)")
        .eq("id", project_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Loyiha topilmadi")
    app_count = (
        supabase.table("project_applications")
        .select("id", count="exact")
        .eq("project_id", project_id)
        .execute()
    )
    return {**result.data, "application_count": app_count.count or 0}


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(payload: ProjectCreate, user_id: CurrentUserId):
    supabase = get_supabase()

    profile = supabase.table("profiles").select("role").eq("id", user_id).single().execute()
    if not profile.data or profile.data.get("role") != "client":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Faqat mijoz loyiha joylashtirishi mumkin",
        )

    data = {**payload.model_dump(mode="json"), "client_id": user_id}
    result = run_query(lambda: get_supabase().table("projects").insert(data).execute())
    if not result.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Loyiha yaratilmadi")
    return result.data[0]


@router.patch("/{project_id}/status", response_model=ProjectResponse)
def update_project_status(project_id: str, payload: ProjectStatusUpdate, user_id: CurrentUserId):
    supabase = get_supabase()

    existing = supabase.table("projects").select("*").eq("id", project_id).single().execute()
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Loyiha topilmadi")
    if existing.data["client_id"] != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Ruxsat yo'q")

    result = (
        supabase.table("projects")
        .update({"status": payload.status})
        .eq("id", project_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Loyiha topilmadi")
    return result.data[0]
