from typing import Literal

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.ai_suggest import SuggestKind, build_suggestion
from app.deps import UserAuthDep

router = APIRouter(prefix="/ai", tags=["ai"])


class AiSuggestBody(BaseModel):
    kind: SuggestKind
    title: str = Field(default="", max_length=200)
    category: str = Field(default="", max_length=64)
    skills: list[str] = Field(default_factory=list, max_length=12)
    region: str = Field(default="", max_length=64)
    project_description: str = Field(default="", max_length=4000)
    specialty: str = Field(default="", max_length=120)
    language: Literal["uz", "ru", "en"] = "uz"


class AiSuggestResponse(BaseModel):
    text: str
    kind: SuggestKind


@router.post("/suggest", response_model=AiSuggestResponse)
def ai_suggest(body: AiSuggestBody, _auth: UserAuthDep):
    if body.kind == "project_description" and not body.title.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Loyiha nomi kerak",
        )
    if body.kind == "service_description" and not body.title.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Xizmat nomi kerak",
        )
    if body.kind == "cover_letter" and not body.title.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Loyiha nomi kerak",
        )
    if body.kind == "service_title" and not body.category.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kategoriya kerak",
        )
    if body.kind == "profile_bio" and not (body.specialty.strip() or body.title.strip()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mutaxassislik kerak",
        )

    text = build_suggestion(
        body.kind,
        {
            "title": body.title,
            "category": body.category,
            "skills": body.skills[:12],
            "region": body.region,
            "project_description": body.project_description,
            "specialty": body.specialty,
            "language": body.language,
        },
    )
    if len(text) < 10:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Matn juda qisqa")

    return AiSuggestResponse(text=text[:4000], kind=body.kind)
