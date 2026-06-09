from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class NotificationMarkRead(BaseModel):
    ids: list[str] = Field(min_length=1, max_length=100)


class NotificationResponse(BaseModel):
    """Bildirishnoma — DB type: order | message | review | broadcast."""

    id: str
    type: Literal["order", "message", "review", "broadcast"]
    title: str
    body: str
    created_at: datetime
    href: str | None = None
    unread: bool = True
