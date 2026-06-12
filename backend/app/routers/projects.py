from fastapi import APIRouter, BackgroundTasks, HTTPException, Query, Request, status



from app.database import get_supabase_admin

from app.db_utils import run_query

from app.deps import OptionalUserId, UserAuthDep

from app.platform_services import track_activation_once, track_analytics_event
from app.project_transitions import validate_project_transition

from app.schemas import ProjectCreate, ProjectResponse, ProjectStatusUpdate, ProjectUpdate

from app.schemas_marketplace import ProjectStatusHistoryResponse

from app.postgrest_embed import PROJECT_CLIENT_PROFILE



router = APIRouter(prefix="/projects", tags=["projects"])





@router.get("", response_model=list[ProjectResponse])

def list_projects(

    status_filter: str | None = Query(default="open", alias="status"),

    client_id: str | None = Query(default=None),

    q: str | None = Query(default=None),

    region: str | None = Query(default=None),

    category: str | None = Query(default=None),

    budget_min: int | None = Query(default=None, ge=0),

    budget_max: int | None = Query(default=None, ge=0),

    limit: int = Query(default=50, le=200),

    offset: int = Query(default=0, ge=0),

    user_id: OptionalUserId = None,

):

    supabase = get_supabase_admin()

    query = supabase.table("projects").select(f"*, {PROJECT_CLIENT_PROFILE}(full_name, region)")



    if status_filter and status_filter != "all":

        query = query.eq("status", status_filter)

    elif not client_id:

        query = query.eq("status", "open")

    if client_id:

        if not user_id or client_id != user_id:

            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Ruxsat yo'q")

        query = query.eq("client_id", client_id)

    else:

        query = query.eq("is_public", True)

    if region:

        query = query.eq("region", region)

    if category:

        query = query.eq("category", category)

    if budget_min is not None:

        query = query.gte("budget", budget_min)

    if budget_max is not None:

        query = query.lte("budget", budget_max)

    from app.catalog_quality import filter_quality_project_rows
    from app.search_query import (
        MAX_SEARCH_SCAN,
        apply_search_tokens,
        sort_by_relevance,
        tokenize_search,
    )

    search_tokens = tokenize_search(q)
    if search_tokens:
        query = apply_search_tokens(query, search_tokens, ["title", "description", "category"])

    if search_tokens:
        result = run_query(
            lambda: query.order("created_at", desc=True).range(0, MAX_SEARCH_SCAN - 1).execute()
        )
        rows = result.data or []
        if not client_id:
            rows = filter_quality_project_rows(rows)
        rows = sort_by_relevance(rows, q)
        rows = rows[offset : offset + limit]
    else:
        result = run_query(
            lambda: query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
        )
        rows = result.data or []
        if not client_id:
            rows = filter_quality_project_rows(rows)

    if not rows:

        return []

    project_ids = [r["id"] for r in rows]

    counts = run_query(

        lambda: supabase.table("project_applications")

        .select("project_id")

        .in_("project_id", project_ids)

        .execute()

    )

    count_map: dict[str, int] = {}

    for row in counts.data or []:

        pid = row["project_id"]

        count_map[pid] = count_map.get(pid, 0) + 1

    return [{**r, "application_count": count_map.get(r["id"], 0)} for r in rows]





def _can_view_project(project: dict, user_id: str | None, supabase) -> bool:

    if project.get("is_public"):

        return True

    if not user_id:

        return False

    if project.get("client_id") == user_id:

        return True

    apps = run_query(

        lambda: supabase.table("project_applications")

        .select("id")

        .eq("project_id", project["id"])

        .eq("freelancer_id", user_id)

        .limit(1)

        .execute()

    )

    return bool(apps.data)


_HIRED_PROJECT_STATUSES = frozenset(
    {"accepted", "active", "submitted", "revision_requested", "completed", "disputed"}
)


def _project_contract_id(supabase, project_id: str, status: str) -> str | None:
    if status not in _HIRED_PROJECT_STATUSES:
        return None
    row = run_query(
        lambda: supabase.table("contracts")
        .select("id")
        .eq("project_id", project_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    if row.data:
        return row.data[0]["id"]
    return None


def _viewer_key(request: Request, user_id: str | None) -> str:
    if user_id:
        return f"user:{user_id}"
    ip = request.client.host if request.client else "unknown"
    return f"ip:{ip}"


@router.post("/{project_id}/view", status_code=status.HTTP_204_NO_CONTENT)
def record_project_view(
    project_id: str,
    request: Request,
    user_id: OptionalUserId = None,
):
    supabase = get_supabase_admin()
    existing = run_query(
        lambda: supabase.table("projects").select("id").eq("id", project_id).limit(1).execute()
    )
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Loyiha topilmadi")
    dedup = run_query(
        lambda: supabase.rpc(
            "record_view_if_new",
            {
                "p_target_type": "project",
                "p_target_id": project_id,
                "p_viewer_key": _viewer_key(request, user_id),
            },
        ).execute()
    )
    if not dedup.data:
        return None
    track_analytics_event(
        "project_view",
        user_id=user_id,
        properties={"project_id": project_id},
    )
    return None


@router.get("/{project_id}", response_model=ProjectResponse)

def get_project(project_id: str, user_id: OptionalUserId = None):

    supabase = get_supabase_admin()

    result = run_query(

        lambda: supabase.table("projects")

        .select(f"*, {PROJECT_CLIENT_PROFILE}(full_name, region)")

        .eq("id", project_id)

        .single()

        .execute()

    )

    if not result.data:

        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Loyiha topilmadi")

    if not _can_view_project(result.data, user_id, supabase):

        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Loyiha topilmadi")

    app_count = run_query(

        lambda: supabase.table("project_applications")

        .select("id", count="exact")

        .eq("project_id", project_id)

        .execute()

    )

    data = result.data
    contract_id = _project_contract_id(supabase, project_id, data.get("status") or "")
    return {**data, "application_count": app_count.count or 0, "contract_id": contract_id}





@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)

def create_project(payload: ProjectCreate, auth: UserAuthDep, background_tasks: BackgroundTasks):

    user_id = auth.user_id

    supabase = get_supabase_admin()



    profile = run_query(

        lambda: supabase.table("profiles").select("role").eq("id", user_id).single().execute()

    )

    if not profile.data or profile.data.get("role") != "client":

        raise HTTPException(

            status_code=status.HTTP_403_FORBIDDEN,

            detail="Faqat mijoz loyiha joylashtirishi mumkin",

        )



    initial_status = "open" if payload.is_public else "draft"

    data = {

        **payload.model_dump(mode="json", exclude_none=True),

        "client_id": user_id,

        "status": initial_status,

    }

    result = run_query(lambda: supabase.table("projects").insert(data).execute())

    if not result.data:

        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Loyiha yaratilmadi")

    created = result.data[0]
    background_tasks.add_task(
        track_activation_once,
        user_id,
        "employer_first_action",
        properties={"project_id": created.get("id"), "action": "post_project"},
    )
    return created





@router.patch("/{project_id}", response_model=ProjectResponse)

def update_project(project_id: str, payload: ProjectUpdate, auth: UserAuthDep):

    user_id = auth.user_id

    supabase = auth.supabase



    existing = run_query(

        lambda: supabase.table("projects").select("*").eq("id", project_id).single().execute()

    )

    if not existing.data:

        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Loyiha topilmadi")

    if existing.data["client_id"] != user_id:

        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Ruxsat yo'q")

    if existing.data.get("status") not in ("draft", "open"):

        raise HTTPException(

            status_code=status.HTTP_400_BAD_REQUEST,

            detail="Faqat qoralama yoki ochiq loyihani tahrirlash mumkin",

        )



    updates = payload.model_dump(mode="json", exclude_none=True)

    if not updates:

        return existing.data



    result = run_query(

        lambda: supabase.table("projects").update(updates).eq("id", project_id).execute()

    )

    if not result.data:

        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Loyiha topilmadi")

    return result.data[0]





@router.patch("/{project_id}/status", response_model=ProjectResponse)

def update_project_status(project_id: str, payload: ProjectStatusUpdate, auth: UserAuthDep):

    user_id = auth.user_id

    supabase = auth.supabase



    existing = run_query(

        lambda: supabase.table("projects").select("*").eq("id", project_id).single().execute()

    )

    if not existing.data:

        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Loyiha topilmadi")

    if existing.data["client_id"] != user_id:

        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Ruxsat yo'q")



    current = existing.data.get("status") or "open"

    validate_project_transition(current, payload.status, user_id, existing.data["client_id"])



    result = run_query(

        lambda: supabase.table("projects")

        .update({"status": payload.status})

        .eq("id", project_id)

        .execute()

    )

    if not result.data:

        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Loyiha topilmadi")

    return result.data[0]





@router.post("/{project_id}/publish", response_model=ProjectResponse)

def publish_project(project_id: str, auth: UserAuthDep):

    user_id = auth.user_id

    supabase = auth.supabase

    existing = run_query(

        lambda: supabase.table("projects").select("*").eq("id", project_id).single().execute()

    )

    if not existing.data:

        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Loyiha topilmadi")

    if existing.data["client_id"] != user_id:

        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Ruxsat yo'q")

    current = existing.data.get("status") or "draft"

    validate_project_transition(current, "open", user_id, existing.data["client_id"])

    result = run_query(

        lambda: supabase.table("projects")

        .update({"status": "open", "is_public": True})

        .eq("id", project_id)

        .execute()

    )

    if not result.data:

        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Loyiha topilmadi")

    return result.data[0]





@router.get("/{project_id}/history", response_model=list[ProjectStatusHistoryResponse])

def get_project_history(project_id: str, auth: UserAuthDep):

    supabase = auth.supabase

    project = run_query(

        lambda: supabase.table("projects").select("client_id").eq("id", project_id).single().execute()

    )

    if not project.data:

        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Loyiha topilmadi")

    user_id = auth.user_id

    is_owner = project.data["client_id"] == user_id

    is_applicant = bool(

        run_query(

            lambda: supabase.table("project_applications")

            .select("id")

            .eq("project_id", project_id)

            .eq("freelancer_id", user_id)

            .limit(1)

            .execute()

        ).data

    )

    if not is_owner and not is_applicant:

        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Ruxsat yo'q")

    result = run_query(

        lambda: supabase.table("project_status_history")

        .select("*")

        .eq("project_id", project_id)

        .order("created_at", desc=True)

        .execute()

    )

    return result.data or []


