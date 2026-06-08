from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field

MAX_MONEY = 2_147_483_647


class ProfileResponse(BaseModel):
    id: str
    role: Literal["freelancer", "client"]
    full_name: str | None = None
    email: str | None = None
    phone: str | None = None
    bio: str | None = None
    region: str | None = None
    specialty: str | None = None
    avatar_url: str | None = None
    is_admin: bool = False
    is_verified: bool = False
    wallet_balance: int = 0
    profile_views: int = 0
    onboarding_completed: bool = False
    username: str | None = None
    is_banned: bool = False
    portfolio_urls: list[str] = Field(default_factory=list)
    skills: list[str] = Field(default_factory=list)
    hourly_rate: int | None = None
    experience_level: str | None = None
    languages: list[dict] = Field(default_factory=list)
    created_at: datetime | None = None


class ProfilePublicResponse(BaseModel):
    id: str
    role: Literal["freelancer", "client"]
    full_name: str | None = None
    bio: str | None = None
    region: str | None = None
    specialty: str | None = None
    avatar_url: str | None = None
    created_at: datetime | None = None
    avg_rating: float | None = None
    review_count: int = 0
    completed_orders: int = 0
    profile_views: int = 0
    is_verified: bool = False
    portfolio_urls: list[str] = Field(default_factory=list)
    languages: list[dict] = Field(default_factory=list)


class ProfileUpdate(BaseModel):
    role: Literal["freelancer", "client"] | None = None
    full_name: str | None = None
    phone: str | None = None
    bio: str | None = None
    region: str | None = None
    specialty: str | None = None
    avatar_url: str | None = None
    onboarding_completed: bool | None = None
    username: str | None = Field(default=None, min_length=3, max_length=30)
    skills: list[str] | None = None
    hourly_rate: int | None = Field(default=None, ge=0, le=MAX_MONEY)
    experience_level: str | None = None
    languages: list[dict] | None = None
    portfolio_urls: list[str] | None = None


class ServicePackage(BaseModel):
    id: str
    label_key: str
    price: int
    delivery_days: int


class ServiceCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=10)
    price: int = Field(gt=0, le=MAX_MONEY)
    category: str = Field(min_length=2)
    region: str = Field(min_length=2)
    image_urls: list[str] = Field(default_factory=list)
    delivery_days: int = Field(default=5, gt=0, le=365)
    packages: list[ServicePackage] = Field(default_factory=list)


class ServiceUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=200)
    description: str | None = Field(default=None, min_length=10)
    price: int | None = Field(default=None, gt=0, le=MAX_MONEY)
    category: str | None = Field(default=None, min_length=2)
    region: str | None = Field(default=None, min_length=2)
    image_urls: list[str] | None = None
    delivery_days: int | None = Field(default=None, gt=0, le=365)
    packages: list[ServicePackage] | None = None


class ServiceResponse(BaseModel):
    id: str
    freelancer_id: str
    title: str
    description: str
    price: int
    category: str
    region: str
    image_urls: list[str] = Field(default_factory=list)
    delivery_days: int = 5
    packages: list[dict] = Field(default_factory=list)
    view_count: int = 0
    created_at: datetime | None = None
    profiles: dict | None = None


class ServiceListResponse(BaseModel):
    items: list[ServiceResponse]
    total: int


class OrderCreate(BaseModel):
    service_id: str
    notes: str | None = None
    package_id: str | None = None


class ReferralApply(BaseModel):
    referrer_id: str


class ReferralStatsResponse(BaseModel):
    count: int
    bonus_earned: int = 0


class NotificationPrefsResponse(BaseModel):
    emailNewOrders: bool = True
    emailPromotions: bool = False
    smsUrgent: bool = False
    telegramConnect: bool = False
    chatMuted: bool = False


class NotificationPrefsUpdate(BaseModel):
    emailNewOrders: bool | None = None
    emailPromotions: bool | None = None
    smsUrgent: bool | None = None
    telegramConnect: bool | None = None
    chatMuted: bool | None = None


class UsernameCheckResponse(BaseModel):
    available: bool


class AdminUserUpdate(BaseModel):
    role: Literal["freelancer", "client"] | None = None
    is_banned: bool | None = None
    is_verified: bool | None = None


class NotificationResponse(BaseModel):
    id: str
    type: Literal["order", "message", "review"]
    title: str
    body: str
    created_at: datetime
    href: str | None = None
    unread: bool = True


class OrderStatusUpdate(BaseModel):
    status: Literal["pending", "active", "delivered", "completed", "disputed", "cancelled"]
    delivery_notes: str | None = None
    dispute_reason: str | None = None


class OrderResponse(BaseModel):
    id: str
    service_id: str | None = None
    client_id: str
    freelancer_id: str
    amount: int
    platform_fee: int = 0
    status: str
    payment_status: str | None = "unpaid"
    notes: str | None = None
    delivery_notes: str | None = None
    dispute_reason: str | None = None
    package_id: str | None = None
    created_at: datetime | None = None
    services: dict | None = None
    client_profile: dict | None = None
    freelancer_profile: dict | None = None


class PaymentIntentResponse(BaseModel):
    id: str
    order_id: str
    provider: str
    amount: int
    status: str
    redirect_url: str | None = None


class CheckoutResponse(BaseModel):
    order: OrderResponse
    payment_intent: PaymentIntentResponse | None = None
    redirect_url: str | None = None


class TransactionResponse(BaseModel):
    id: str
    order_id: str | None = None
    user_id: str
    type: str
    amount: int
    provider: str | None = None
    status: str
    created_at: datetime | None = None


class WithdrawalResponse(BaseModel):
    id: str
    freelancer_id: str
    amount: int
    status: str
    note: str | None = None
    created_at: datetime | None = None


class ProjectCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=10)
    category: str = Field(min_length=2)
    skills: list[str] = Field(default_factory=list)
    budget: int = Field(gt=0, le=MAX_MONEY)
    budget_type: str = "fixed"
    deadline: date | None = None
    level: str = "intermediate"
    region: str = Field(min_length=2)
    attachment_urls: list[str] = Field(default_factory=list)
    is_public: bool = True


class ProjectStatusUpdate(BaseModel):
    status: Literal["open", "closed", "in_progress"]


class ProjectResponse(BaseModel):
    id: str
    client_id: str
    title: str
    description: str
    category: str
    skills: list[str] = Field(default_factory=list)
    budget: int
    budget_type: str
    deadline: date | None = None
    level: str
    region: str
    status: str
    is_public: bool = True
    attachment_urls: list[str] = Field(default_factory=list)
    created_at: datetime | None = None
    profiles: dict | None = None
    application_count: int = 0


class ApplicationCreate(BaseModel):
    project_id: str
    cover_letter: str = Field(min_length=10, max_length=4000)
    proposed_budget: int = Field(gt=0, le=MAX_MONEY)
    proposed_days: int = Field(default=7, gt=0, le=365)


class ApplicationStatusUpdate(BaseModel):
    status: Literal["submitted", "shortlisted", "rejected", "hired"]


class ApplicationResponse(BaseModel):
    id: str
    project_id: str
    freelancer_id: str
    cover_letter: str
    proposed_budget: int
    proposed_days: int
    status: str
    created_at: datetime | None = None
    updated_at: datetime | None = None
    freelancer_profile: dict | None = None
    project: dict | None = None


class MessageCreate(BaseModel):
    order_id: str
    content: str = Field(min_length=1, max_length=2000)


class MessageResponse(BaseModel):
    id: str
    order_id: str
    sender_id: str
    receiver_id: str
    content: str
    read_at: datetime | None = None
    created_at: datetime | None = None


class ConversationResponse(BaseModel):
    order_id: str
    other_user_id: str
    other_user_name: str
    order_title: str
    order_status: str
    last_message: str | None = None
    last_message_at: datetime | None = None
    unread_count: int = 0


class ReviewCreate(BaseModel):
    order_id: str
    rating: int = Field(ge=1, le=5)
    comment: str | None = None


class ReviewResponse(BaseModel):
    id: str
    order_id: str
    reviewer_id: str
    freelancer_id: str
    rating: int
    comment: str | None = None
    reply: str | None = None
    replied_at: datetime | None = None
    created_at: datetime | None = None
    profiles: dict | None = None


class ReviewReplyUpdate(BaseModel):
    reply: str = Field(min_length=1, max_length=2000)


class PublicReviewResponse(BaseModel):
    id: str
    rating: int
    comment: str
    created_at: datetime | None = None
    author_name: str
    author_role: str | None = None
    freelancer_id: str
    freelancer_name: str | None = None
    freelancer_specialty: str | None = None
