from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator

from app.url_safety import is_allowed_storage_file_url

MAX_MONEY = 2_147_483_647


class ContractResponse(BaseModel):
    id: str
    project_id: str
    proposal_id: str
    order_id: str | None = None
    client_id: str
    freelancer_id: str
    title: str
    amount: int
    deadline: date | None = None
    status: str
    payment_status: str
    delivery_notes: str | None = None
    revision_count: int = 0
    created_at: datetime | None = None
    updated_at: datetime | None = None
    project: dict | None = None
    client_profile: dict | None = None
    freelancer_profile: dict | None = None


class ContractStatusUpdate(BaseModel):
    status: Literal[
        "pending_payment",
        "active",
        "submitted",
        "revision_requested",
        "completed",
        "cancelled",
        "disputed",
    ]
    delivery_notes: str | None = None


class ContractFundRequest(BaseModel):
    provider: Literal["sandbox"] = "sandbox"
    provider_ref: str | None = None


class EscrowTransactionResponse(BaseModel):
    id: str
    source_type: str
    source_id: str
    client_id: str
    freelancer_id: str
    amount: int
    action: str
    provider: str
    status: str
    metadata: dict = Field(default_factory=dict)
    created_at: datetime | None = None


class MilestoneCreate(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    description: str | None = None
    amount: int = Field(gt=0, le=MAX_MONEY)
    due_date: date | None = None
    sort_order: int = 0


class MilestoneStatusUpdate(BaseModel):
    status: Literal["pending", "funded", "submitted", "approved", "released", "cancelled"]


class MilestoneResponse(BaseModel):
    id: str
    contract_id: str
    title: str
    description: str | None = None
    amount: int
    due_date: date | None = None
    sort_order: int = 0
    status: str
    payment_status: str
    created_at: datetime | None = None


class DisputeCreate(BaseModel):
    reason: str = Field(min_length=10, max_length=4000)


class DisputeMessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=4000)
    attachments: list[dict] = Field(default_factory=list)


class DisputeResolve(BaseModel):
    resolution: Literal["resolved_client", "resolved_freelancer", "closed"]
    admin_notes: str | None = None


class DisputeResponse(BaseModel):
    id: str
    contract_id: str | None = None
    order_id: str | None = None
    opened_by: str
    reason: str
    status: str
    admin_notes: str | None = None
    resolution: str | None = None
    resolved_at: datetime | None = None
    created_at: datetime | None = None
    contract: dict | None = None
    order: dict | None = None


class DisputeMessageResponse(BaseModel):
    id: str
    dispute_id: str
    sender_id: str
    content: str
    attachments: list[dict] = Field(default_factory=list)
    created_at: datetime | None = None


class ProjectFileCreate(BaseModel):
    file_name: str
    file_url: str
    file_type: str | None = None
    file_size: int | None = None
    purpose: Literal["attachment", "deliverable", "dispute_evidence", "revision"] = "deliverable"

    @field_validator("file_url")
    @classmethod
    def validate_file_url(cls, value: str) -> str:
        if not is_allowed_storage_file_url(value):
            raise ValueError("Faqat Supabase storage URL qabul qilinadi")
        return value


class ProjectFileResponse(BaseModel):
    id: str
    project_id: str | None = None
    contract_id: str | None = None
    uploaded_by: str
    file_name: str
    file_url: str
    file_type: str | None = None
    file_size: int | None = None
    purpose: str
    created_at: datetime | None = None


class ProjectReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str | None = Field(default=None, max_length=4000)


class ProjectReviewResponse(BaseModel):
    id: str
    contract_id: str
    reviewer_id: str
    reviewee_id: str
    direction: str
    rating: int
    comment: str | None = None
    created_at: datetime | None = None


class ProjectStatusHistoryResponse(BaseModel):
    id: str
    project_id: str
    from_status: str | None = None
    to_status: str
    changed_by: str | None = None
    note: str | None = None
    created_at: datetime | None = None


class ConversationThreadResponse(BaseModel):
    id: str
    type: str
    order_id: str | None = None
    contract_id: str | None = None
    project_id: str | None = None
    participant_ids: list[str]
    other_user_id: str | None = None
    other_user_name: str | None = None
    title: str | None = None
    last_message: str | None = None
    last_message_at: datetime | None = None
    unread_count: int = 0
    created_at: datetime | None = None


class ConversationMessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=4000)
    message_type: Literal["text", "image", "file", "document"] = "text"
    attachments: list[dict] = Field(default_factory=list)


class ConversationMessageResponse(BaseModel):
    id: str
    conversation_id: str
    order_id: str | None = None
    sender_id: str
    receiver_id: str
    content: str
    message_type: str = "text"
    attachments: list[dict] = Field(default_factory=list)
    read_at: datetime | None = None
    created_at: datetime | None = None


class PresenceUpdate(BaseModel):
    is_online: bool | None = None
    typing_in: str | None = None


class PresenceResponse(BaseModel):
    user_id: str
    is_online: bool
    last_seen_at: datetime | None = None
    typing_in: str | None = None


class CallCreate(BaseModel):
    conversation_id: str | None = None
    contract_id: str | None = None
    callee_id: str
    call_type: Literal["one_to_one", "interview", "project_discussion"] = "project_discussion"


class CallSignalUpdate(BaseModel):
    status: Literal["ringing", "active", "ended", "missed", "declined"] | None = None
    media_state: dict | None = None
    signaling: dict | None = None


class CallSessionResponse(BaseModel):
    id: str
    conversation_id: str | None = None
    contract_id: str | None = None
    initiator_id: str
    callee_id: str
    call_type: str
    status: str
    media_state: dict = Field(default_factory=dict)
    signaling: dict = Field(default_factory=dict)
    started_at: datetime | None = None
    ended_at: datetime | None = None
    created_at: datetime | None = None


class ProjectPublishResponse(BaseModel):
    id: str
    status: str
