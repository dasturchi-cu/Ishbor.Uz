from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status

from app.db_utils import run_query
from app.deps import UserAuthDep
from app.notification_service import create_notification
from app.schemas_marketplace import CallCreate, CallSessionResponse, CallSignalUpdate

router = APIRouter(prefix="/calls", tags=["calls"])


@router.post("", response_model=CallSessionResponse, status_code=status.HTTP_201_CREATED)
def start_call(payload: CallCreate, auth: UserAuthDep):
    user_id = auth.user_id
    supabase = auth.supabase

    if payload.callee_id == user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="O'zingizga qo'ng'iroq qilib bo'lmaydi")

    if payload.contract_id:
        contract = run_query(
            lambda: supabase.table("contracts")
            .select("client_id, freelancer_id")
            .eq("id", payload.contract_id)
            .single()
            .execute()
        )
        if not contract.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shartnoma topilmadi")
        if user_id not in (contract.data["client_id"], contract.data["freelancer_id"]):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Ruxsat yo'q")
        if payload.callee_id not in (contract.data["client_id"], contract.data["freelancer_id"]):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ishtirokchi emas")

    result = run_query(
        lambda: supabase.table("call_sessions")
        .insert(
            {
                "conversation_id": payload.conversation_id,
                "contract_id": payload.contract_id,
                "initiator_id": user_id,
                "callee_id": payload.callee_id,
                "call_type": payload.call_type,
                "status": "ringing",
            }
        )
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Qo'ng'iroq boshlanmadi")

    row = result.data[0]
    create_notification(
        supabase,
        user_id=payload.callee_id,
        type="message",
        title="Kiruvchi qo'ng'iroq",
        body="Sizga qo'ng'iroq kelmoqda",
        href=f"/dashboard/calls/{row['id']}",
    )
    return row


@router.get("/{call_id}", response_model=CallSessionResponse)
def get_call(call_id: str, auth: UserAuthDep):
    supabase = auth.supabase
    result = run_query(
        lambda: supabase.table("call_sessions").select("*").eq("id", call_id).single().execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Qo'ng'iroq topilmadi")
    call = result.data
    if auth.user_id not in (call["initiator_id"], call["callee_id"]):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Ruxsat yo'q")
    return call


@router.patch("/{call_id}", response_model=CallSessionResponse)
def update_call(call_id: str, payload: CallSignalUpdate, auth: UserAuthDep):
    user_id = auth.user_id
    supabase = auth.supabase
    existing = run_query(
        lambda: supabase.table("call_sessions").select("*").eq("id", call_id).single().execute()
    )
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Qo'ng'iroq topilmadi")
    call = existing.data
    if user_id not in (call["initiator_id"], call["callee_id"]):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Ruxsat yo'q")

    update_data: dict = {}
    if payload.status:
        update_data["status"] = payload.status
        if payload.status == "active":
            update_data["started_at"] = datetime.now(timezone.utc).isoformat()
        if payload.status in ("ended", "missed", "declined"):
            update_data["ended_at"] = datetime.now(timezone.utc).isoformat()
    if payload.media_state is not None:
        update_data["media_state"] = payload.media_state
    if payload.signaling is not None:
        merged = {**(call.get("signaling") or {}), **payload.signaling}
        update_data["signaling"] = merged

    if not update_data:
        return call

    result = run_query(
        lambda: supabase.table("call_sessions").update(update_data).eq("id", call_id).execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Qo'ng'iroq topilmadi")
    return result.data[0]
