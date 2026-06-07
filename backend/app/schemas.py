from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field


class ProfileResponse(BaseModel):
    id: str
    role: Literal["freelancer", "client"]
    full_name: str | None = None
    email: str | None = None
    phone: str | None = None
    bio: str | None = None
    region: str | None = None
    specialty: str | None = None
    is_admin: bool = False
    created_at: datetime | None = None


class ProfilePublicResponse(BaseModel):
    id: str
    role: Literal["freelancer", "client"]
    full_name: str | None = None
    bio: str | None = None
    region: str | None = None
    specialty: str | None = None
    created_at: datetime | None = None
    avg_rating: float | None = None
    review_count: int = 0


class ProfileUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    bio: str | None = None
    region: str | None = None
    specialty: str | None = None
    role: Literal["freelancer", "client"] | None = None


MAX_MONEY = 2_147_483_647


class ServiceCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=10)
    price: int = Field(gt=0, le=MAX_MONEY)
    category: str = Field(min_length=2)
    region: str = Field(min_length=2)


class ServiceResponse(BaseModel):
    id: str
    freelancer_id: str
    title: str
    description: str
    price: int
    category: str
    region: str
    created_at: datetime | None = None
    profiles: dict | None = None


class OrderCreate(BaseModel):
    service_id: str
    notes: str | None = None


class OrderStatusUpdate(BaseModel):
    status: Literal["pending", "active", "delivered", "completed", "disputed", "cancelled"]


class OrderResponse(BaseModel):
    id: str
    service_id: str | None = None
    client_id: str
    freelancer_id: str
    amount: int
    status: str
    notes: str | None = None
    created_at: datetime | None = None
    services: dict | None = None
    client_profile: dict | None = None
    freelancer_profile: dict | None = None


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
    attachment_urls: list[str] = Field(default_factory=list)
    created_at: datetime | None = None
    profiles: dict | None = None


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
    created_at: datetime | None = None
    profiles: dict | None = None


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
