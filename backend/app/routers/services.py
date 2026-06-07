from fastapi import APIRouter, HTTPException, Query, status

from app.database import get_supabase
from app.deps import CurrentUserId
from app.schemas import ServiceCreate, ServiceResponse

router = APIRouter(prefix="/services", tags=["services"])


@router.get("/mine", response_model=list[ServiceResponse])
def list_my_services(user_id: CurrentUserId):
    supabase = get_supabase()
    result = (
        supabase.table("services")
        .select("*")
        .eq("freelancer_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


@router.get("/freelancer/{freelancer_id}", response_model=list[ServiceResponse])
def list_freelancer_services(freelancer_id: str):
    supabase = get_supabase()
    result = (
        supabase.table("services")
        .select("*")
        .eq("freelancer_id", freelancer_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


@router.get("", response_model=list[ServiceResponse])
def list_services(
    category: str | None = Query(default=None),
    region: str | None = Query(default=None),
    search: str | None = Query(default=None),
):
    supabase = get_supabase()
    query = supabase.table("services").select("*, profiles(full_name, specialty, region)")

    if category:
        query = query.eq("category", category)
    if region:
        query = query.eq("region", region)
    if search:
        query = query.or_(f"title.ilike.%{search}%,description.ilike.%{search}%")

    result = query.order("created_at", desc=True).execute()
    return result.data or []


@router.get("/{service_id}", response_model=ServiceResponse)
def get_service(service_id: str):
    supabase = get_supabase()
    result = (
        supabase.table("services")
        .select("*, profiles(full_name, specialty, region, bio)")
        .eq("id", service_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Xizmat topilmadi")
    return result.data


@router.post("", response_model=ServiceResponse, status_code=status.HTTP_201_CREATED)
def create_service(payload: ServiceCreate, user_id: CurrentUserId):
    supabase = get_supabase()

    profile = supabase.table("profiles").select("role").eq("id", user_id).single().execute()
    if not profile.data or profile.data.get("role") != "freelancer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Faqat freelancer xizmat yaratishi mumkin",
        )

    data = {**payload.model_dump(), "freelancer_id": user_id}
    result = supabase.table("services").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Xizmat yaratilmadi")
    return result.data[0]
