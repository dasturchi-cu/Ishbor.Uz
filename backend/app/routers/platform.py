import logging

from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, HTTPException, Query, Request, status

from app.database import get_supabase_admin
from app.db_utils import run_query
from app.deps import OptionalUserId, UserAuthDep
from app.platform_services import (
    build_user_activity_feed,
    get_user_reputation,
    log_activity,
    log_audit,
    track_analytics_event,
)
from app.schemas_platform import (
    ActivityFeedItemResponse,
    AnalyticsTrack,
    ClientErrorReport,
    DraftResponse,
    DraftUpsert,
    FeatureFlagResponse,
    ReportCreate,
    ReportMessageCreate,
    ReportMessageResponse,
    ReportResponse,
    RequestAuditClientBatch,
    RequestAuditStat,
    StorageSignedUrlRequest,
    StorageSignedUrlResponse,
    UserActivityResponse,
    UserReputationResponse,
    VerificationCreate,
    VerificationResponse,
)
from app.config import settings
from app.supabase_instrumentation import get_stats, get_top10, is_debug_enabled, merge_client_events, reset_stats

router = APIRouter(prefix="/platform", tags=["platform"])
_client_error_logger = logging.getLogger("ishbor.client_errors")


def _require_request_audit_access(auth: UserAuthDep) -> None:
    """Debug stats — admin in production; dev only when SUPABASE_REQUEST_DEBUG=1."""
    from app.admin_rbac import require_admin_role

    if settings.is_production:
        require_admin_role(auth.user_id, "moderator")
        return
    if not is_debug_enabled():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")


@router.get("/activities", response_model=list[UserActivityResponse])
def list_my_activities(
    auth: UserAuthDep,
    limit: int = Query(default=30, le=100),
    offset: int = Query(default=0, ge=0),
):
    result = run_query(
        lambda: auth.supabase.table("user_activities")
        .select("*")
        .eq("user_id", auth.user_id)
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )
    return result.data or []


@router.get("/activity-feed", response_model=list[ActivityFeedItemResponse])
def merged_activity_feed(auth: UserAuthDep, limit: int = Query(default=12, le=50)):
    return build_user_activity_feed(auth.user_id, limit=limit)


@router.get("/reputation/{user_id}", response_model=UserReputationResponse)
def get_reputation(user_id: str):
    row = get_user_reputation(user_id)
    if not row:
        return UserReputationResponse(user_id=user_id)
    return row


@router.get("/reputation/me", response_model=UserReputationResponse)
def get_my_reputation(auth: UserAuthDep):
    row = get_user_reputation(auth.user_id)
    if not row:
        return UserReputationResponse(user_id=auth.user_id)
    return row


@router.post("/verifications", response_model=VerificationResponse, status_code=status.HTTP_201_CREATED)
def request_verification(payload: VerificationCreate, auth: UserAuthDep, request: Request):
    existing = run_query(
        lambda: auth.supabase.table("user_verifications")
        .select("id")
        .eq("user_id", auth.user_id)
        .eq("verification_type", payload.verification_type)
        .eq("status", "pending")
        .limit(1)
        .execute()
    )
    if existing.data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tasdiqlash so'rovi allaqachon mavjud")

    result = run_query(
        lambda: auth.supabase.table("user_verifications")
        .insert(
            {
                "user_id": auth.user_id,
                "verification_type": payload.verification_type,
                "document_urls": payload.document_urls,
                "notes": payload.notes,
            }
        )
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="So'rov yaratilmadi")

    log_audit(
        actor_id=auth.user_id,
        action="verification_request",
        entity_type="verification",
        entity_id=result.data[0]["id"],
        metadata={"type": payload.verification_type},
        request=request,
    )
    log_activity(
        auth.user_id,
        "verification_requested",
        "Tasdiqlash so'rovi yuborildi",
        payload.verification_type,
        "/dashboard/settings",
    )
    return result.data[0]


@router.get("/verifications/mine", response_model=list[VerificationResponse])
def list_my_verifications(auth: UserAuthDep):
    result = run_query(
        lambda: auth.supabase.table("user_verifications")
        .select("*")
        .eq("user_id", auth.user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


@router.post("/reports", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
def create_report(payload: ReportCreate, auth: UserAuthDep, request: Request):
    if payload.target_type == "user" and payload.target_id == auth.user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="O'zingiz haqingizda shikoyat yuborib bo'lmaydi")

    dup = run_query(
        lambda: auth.supabase.table("reports")
        .select("id")
        .eq("reporter_id", auth.user_id)
        .eq("target_type", payload.target_type)
        .eq("target_id", payload.target_id)
        .in_("status", ["open", "reviewing"])
        .limit(1)
        .execute()
    )
    if dup.data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Shikoyat allaqachon yuborilgan")

    result = run_query(
        lambda: auth.supabase.table("reports")
        .insert(
            {
                "reporter_id": auth.user_id,
                "target_type": payload.target_type,
                "target_id": payload.target_id,
                "category": payload.category,
                "description": payload.description.strip(),
            }
        )
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Shikoyat yaratilmadi")

    log_audit(
        actor_id=auth.user_id,
        action="report_create",
        entity_type="report",
        entity_id=result.data[0]["id"],
        metadata={"category": payload.category, "target_type": payload.target_type},
        request=request,
    )
    return result.data[0]


@router.get("/reports/mine", response_model=list[ReportResponse])
def list_my_reports(auth: UserAuthDep):
    result = run_query(
        lambda: auth.supabase.table("reports")
        .select("*")
        .eq("reporter_id", auth.user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


@router.get("/reports/{report_id}/messages", response_model=list[ReportMessageResponse])
def list_report_messages(report_id: str, auth: UserAuthDep):
    report = run_query(
        lambda: auth.supabase.table("reports")
        .select("reporter_id")
        .eq("id", report_id)
        .single()
        .execute()
    )
    if not report.data or report.data["reporter_id"] != auth.user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shikoyat topilmadi")

    result = run_query(
        lambda: auth.supabase.table("report_messages")
        .select("*")
        .eq("report_id", report_id)
        .order("created_at", desc=False)
        .execute()
    )
    return result.data or []


@router.post("/reports/{report_id}/messages", response_model=ReportMessageResponse, status_code=status.HTTP_201_CREATED)
def post_report_message(report_id: str, payload: ReportMessageCreate, auth: UserAuthDep):
    report = run_query(
        lambda: auth.supabase.table("reports")
        .select("reporter_id, status")
        .eq("id", report_id)
        .single()
        .execute()
    )
    if not report.data or report.data["reporter_id"] != auth.user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shikoyat topilmadi")
    if report.data["status"] in ("resolved", "dismissed"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Shikoyat yopilgan")

    result = run_query(
        lambda: auth.supabase.table("report_messages")
        .insert(
            {
                "report_id": report_id,
                "sender_id": auth.user_id,
                "message": payload.message.strip(),
                "is_admin": False,
            }
        )
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Xabar yuborilmadi")
    return result.data[0]


@router.get("/drafts/{draft_key}", response_model=DraftResponse | None)
def get_draft(draft_key: str, auth: UserAuthDep):
    result = run_query(
        lambda: auth.supabase.table("saved_drafts")
        .select("*")
        .eq("user_id", auth.user_id)
        .eq("draft_key", draft_key)
        .limit(1)
        .execute()
    )
    if not result.data:
        return None
    return result.data[0]


@router.put("/drafts", response_model=DraftResponse)
def upsert_draft(payload: DraftUpsert, auth: UserAuthDep):
    now = datetime.now(timezone.utc).isoformat()
    result = run_query(
        lambda: auth.supabase.table("saved_drafts")
        .upsert(
            {
                "user_id": auth.user_id,
                "draft_key": payload.draft_key,
                "payload": payload.payload,
                "updated_at": now,
            },
            on_conflict="user_id,draft_key",
        )
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Draft saqlanmadi")
    return result.data[0]


@router.delete("/drafts/{draft_key}", status_code=status.HTTP_204_NO_CONTENT)
def delete_draft(draft_key: str, auth: UserAuthDep):
    run_query(
        lambda: auth.supabase.table("saved_drafts")
        .delete()
        .eq("user_id", auth.user_id)
        .eq("draft_key", draft_key)
        .execute()
    )
    return None


@router.post("/analytics/track", status_code=status.HTTP_204_NO_CONTENT)
def track_event(payload: AnalyticsTrack, request: Request, user_id: OptionalUserId = None):
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Autentifikatsiya talab qilinadi")
    track_analytics_event(
        payload.event_name,
        user_id=user_id,
        properties=payload.properties,
        session_id=payload.session_id,
    )
    if payload.event_name == "search" and user_id:
        log_audit(
            actor_id=user_id,
            action="search",
            metadata=payload.properties,
            request=request,
        )
    return None


_CHAT_STORAGE_BUCKET = "project-attachments"


def _assert_storage_signed_url_access(admin, user_id: str, bucket: str, path: str) -> None:
    if bucket != _CHAT_STORAGE_BUCKET:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Bucket qo'llab-quvvatlanmaydi")
    if ".." in path or path.startswith("/"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Noto'g'ri yo'l")
    parts = path.split("/")
    if parts[0] == user_id:
        return
    if len(parts) >= 4 and parts[1] == "chat":
        scope_id = parts[2]
        conv = run_query(
            lambda: admin.table("conversations")
            .select("participant_ids")
            .eq("id", scope_id)
            .limit(1)
            .execute()
        )
        if conv.data and user_id in (conv.data[0].get("participant_ids") or []):
            return
        order = run_query(
            lambda: admin.table("orders")
            .select("client_id, freelancer_id")
            .eq("id", scope_id)
            .limit(1)
            .execute()
        )
        if order.data:
            row = order.data[0]
            if user_id in (row.get("client_id"), row.get("freelancer_id")):
                return
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Ruxsat yo'q")


@router.post("/storage/signed-url", response_model=StorageSignedUrlResponse)
def storage_signed_url(payload: StorageSignedUrlRequest, auth: UserAuthDep):
    admin = get_supabase_admin()
    _assert_storage_signed_url_access(admin, auth.user_id, payload.bucket, payload.path)
    try:
        result = admin.storage.from_(payload.bucket).create_signed_url(payload.path, 3600)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fayl topilmadi",
        ) from exc
    url = None
    if isinstance(result, dict):
        url = result.get("signedURL") or result.get("signedUrl") or result.get("signed_url")
    else:
        url = getattr(result, "signed_url", None) or getattr(result, "signedURL", None)
    if not url:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="URL yaratilmadi")
    return {"url": url}


_PUBLIC_FLAG_KEYS = frozenset({"live_payments", "vacancies", "companies"})


@router.get("/feature-flags", response_model=list[FeatureFlagResponse])
def list_feature_flags():
    admin = get_supabase_admin()
    result = run_query(
        lambda: admin.table("feature_flags")
        .select("key, enabled, description")
        .eq("enabled", True)
        .in_("key", list(_PUBLIC_FLAG_KEYS))
        .order("key")
        .execute()
    )
    return result.data or []


@router.post("/audit/login", status_code=status.HTTP_204_NO_CONTENT)
def audit_login(auth: UserAuthDep, request: Request, background_tasks: BackgroundTasks):
    background_tasks.add_task(log_audit, actor_id=auth.user_id, action="login", request=request)
    background_tasks.add_task(log_activity, auth.user_id, "login", "Tizimga kirildi", href="/dashboard")
    return None


@router.post("/audit/register", status_code=status.HTTP_204_NO_CONTENT)
def audit_register(auth: UserAuthDep, request: Request, background_tasks: BackgroundTasks):
    background_tasks.add_task(log_audit, actor_id=auth.user_id, action="register", request=request)
    background_tasks.add_task(track_analytics_event, "register", user_id=auth.user_id)
    background_tasks.add_task(log_activity, auth.user_id, "register", "Ro'yxatdan o'tildi", href="/onboarding")
    return None


@router.post("/client-errors", status_code=status.HTTP_204_NO_CONTENT)
def report_client_error(
    payload: ClientErrorReport,
    request: Request,
    user_id: OptionalUserId = None,
):
    meta = payload.model_dump(exclude_none=True)
    _client_error_logger.warning(
        "client_error scope=%s status=%s api_path=%s page=%s msg=%s",
        payload.scope,
        payload.status,
        payload.api_path,
        payload.page,
        payload.message[:200],
    )
    log_audit(
        actor_id=user_id,
        action="client_error",
        entity_type="frontend",
        metadata=meta,
        request=request,
    )
    return None


@router.get("/request-audit/top", response_model=list[RequestAuditStat])
def request_audit_top(auth: UserAuthDep):
    """SUPABASE_REQUEST_DEBUG=1 — oxirgi 1 soatda eng ko'p DB so'rovlar (backend + client batch)."""
    _require_request_audit_access(auth)
    return [RequestAuditStat.model_validate(row) for row in get_top10()]


@router.get("/request-audit/all", response_model=list[RequestAuditStat])
def request_audit_all(auth: UserAuthDep):
    _require_request_audit_access(auth)
    return [RequestAuditStat.model_validate(row) for row in get_stats()]


@router.post("/request-audit/client", status_code=status.HTTP_204_NO_CONTENT)
def request_audit_client_batch(payload: RequestAuditClientBatch, auth: UserAuthDep):
    _require_request_audit_access(auth)
    merge_client_events([e.model_dump(by_alias=True) for e in payload.events])
    return None


@router.post("/request-audit/reset", status_code=status.HTTP_204_NO_CONTENT)
def request_audit_reset(auth: UserAuthDep):
    _require_request_audit_access(auth)
    reset_stats()
    return None
