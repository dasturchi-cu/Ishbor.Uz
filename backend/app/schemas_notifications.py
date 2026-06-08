from pydantic import BaseModel, Field


class NotificationMarkRead(BaseModel):
    ids: list[str] = Field(min_length=1, max_length=100)
