from fastapi import APIRouter, HTTPException, Query, status



from app.database import get_supabase

from app.deps import CurrentUserId

from app.review_stats import batch_review_stats

from app.schemas import ProfilePublicResponse, ProfileResponse, ProfileUpdate



router = APIRouter(prefix="/profiles", tags=["profiles"])





@router.get("/me", response_model=ProfileResponse)

def get_my_profile(user_id: CurrentUserId):

    supabase = get_supabase()

    result = supabase.table("profiles").select("*").eq("id", user_id).single().execute()

    if not result.data:

        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profil topilmadi")

    return result.data





@router.patch("/me", response_model=ProfileResponse)

def update_my_profile(payload: ProfileUpdate, user_id: CurrentUserId):

    supabase = get_supabase()

    data = payload.model_dump(exclude_none=True)

    if not data:

        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Yangilash ma'lumoti yo'q")



    result = supabase.table("profiles").update(data).eq("id", user_id).execute()

    if not result.data:

        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profil topilmadi")

    return result.data[0]





@router.get("/freelancers", response_model=list[ProfilePublicResponse])

def list_freelancers(limit: int = Query(default=12, le=50)):

    supabase = get_supabase()

    result = (

        supabase.table("profiles")

        .select("id, role, full_name, bio, region, specialty, created_at")

        .eq("role", "freelancer")

        .order("created_at", desc=True)

        .limit(limit)

        .execute()

    )

    rows = result.data or []

    ids = [row["id"] for row in rows]

    stats_map = batch_review_stats(supabase, ids)



    profiles = []

    for row in rows:

        avg, count = stats_map.get(row["id"], (0.0, 0))

        profiles.append({**row, "avg_rating": avg, "review_count": count})

    return profiles





@router.get("/{profile_id}", response_model=ProfilePublicResponse)

def get_profile(profile_id: str):

    supabase = get_supabase()

    result = (

        supabase.table("profiles")

        .select("id, role, full_name, bio, region, specialty, created_at")

        .eq("id", profile_id)

        .single()

        .execute()

    )

    if not result.data:

        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profil topilmadi")

    avg, count = batch_review_stats(supabase, [profile_id]).get(profile_id, (0.0, 0))

    return {**result.data, "avg_rating": avg, "review_count": count}

