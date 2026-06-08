"""Template-based text suggestions (no external AI API)."""

from typing import Literal

SuggestKind = Literal[
    "project_description",
    "service_description",
    "service_title",
    "profile_bio",
    "cover_letter",
]

_CATEGORY_LABEL = {
    "uz": {
        "web": "veb-sayt",
        "mobile": "mobil ilova",
        "design": "dizayn",
        "graphic": "grafik dizayn",
        "writing": "kontent yozish",
        "video": "video montaj",
        "seo": "SEO",
        "uiux": "UI/UX",
    },
    "ru": {
        "web": "веб-сайт",
        "mobile": "мобильное приложение",
        "design": "дизайн",
        "graphic": "графический дизайн",
        "writing": "копирайтинг",
        "video": "видеомонтаж",
        "seo": "SEO",
        "uiux": "UI/UX",
    },
    "en": {
        "web": "website",
        "mobile": "mobile app",
        "design": "design",
        "graphic": "graphic design",
        "writing": "content writing",
        "video": "video editing",
        "seo": "SEO",
        "uiux": "UI/UX",
    },
}


def _lang(language: str) -> str:
    if language in ("uz", "ru", "en"):
        return language
    return "uz"


def _cat_label(category: str, language: str) -> str:
    return _CATEGORY_LABEL.get(_lang(language), _CATEGORY_LABEL["uz"]).get(
        category.lower(), category or "—"
    )


def suggest_project_description(
    *,
    title: str,
    category: str,
    skills: list[str],
    language: str,
) -> str:
    lang = _lang(language)
    title = title.strip() or ("Loyiha" if lang == "uz" else "Project")
    cat = _cat_label(category, lang)
    skill_text = ", ".join(s.strip() for s in skills if s.strip())[:120]

    if lang == "ru":
        return (
            f"Нужен специалист для проекта «{title}» в категории {cat}.\n\n"
            f"Задачи: уточнить требования, подготовить план работ и сдать результат в срок.\n"
            f"{f'Навыки: {skill_text}.' if skill_text else ''}\n\n"
            "Ожидаю качественную коммуникацию, промежуточные отчёты и готовность к правкам."
        ).strip()
    if lang == "en":
        return (
            f"Looking for a specialist for «{title}» ({cat}).\n\n"
            "Scope: clarify requirements, deliver milestones on time, and hand over final files.\n"
            f"{f'Preferred skills: {skill_text}.' if skill_text else ''}\n\n"
            "Clear communication and revision rounds are expected."
        ).strip()
    skills_line = f"Ko'nikmalar: {skill_text}.\n" if skill_text else ""
    return (
        f"«{title}» loyihasi uchun {cat} yo'nalishida mutaxassis kerak.\n\n"
        "Vazifalar: talablarni aniqlashtirish, bosqichma-bosqich natija topshirish va muddatga rioya qilish.\n"
        f"{skills_line}\n"
        "Muloqot ochiq bo'lsin, o'zgarishlar va qo'shimcha savollarga tayyor bo'ling."
    ).strip()


def suggest_service_description(
    *,
    title: str,
    category: str,
    region: str,
    language: str,
) -> str:
    lang = _lang(language)
    title = title.strip() or ("Xizmat" if lang == "uz" else "Service")
    cat = _cat_label(category, lang)
    region = region.strip()

    if lang == "ru":
        return (
            f"Предлагаю услугу «{title}» ({cat}).\n\n"
            "Включено: консультация, выполнение работы по ТЗ и 1–2 раунда правок.\n"
            f"{f'Работаю с заказчиками из {region}.' if region else ''}\n\n"
            "Сроки и детали согласуем после заказа."
        ).strip()
    if lang == "en":
        return (
            f"I offer «{title}» ({cat}).\n\n"
            "Includes: kickoff call, delivery per brief, and 1–2 revision rounds.\n"
            f"{f'Based in {region}, open to remote clients.' if region else ''}\n\n"
            "Timeline and deliverables are confirmed after you order."
        ).strip()
    return (
        f"«{title}» xizmatini taklif qilaman ({cat}).\n\n"
        "Xizmatga kiradi: qisqa maslahat, texnik vazifa bo'yicha ish va 1–2 marta tuzatish.\n"
        f"{f'{region} va boshqa viloyatlardan buyurtmalar qabul qilaman.' if region else ''}\n\n"
        "Muddat va natijalar buyurtma berilgach aniqlashtiriladi."
    ).strip()


def suggest_service_title(*, category: str, region: str, language: str) -> str:
    lang = _lang(language)
    cat = _cat_label(category, lang)
    region = region.strip()

    if lang == "ru":
        base = f"Профессиональные услуги: {cat}"
        return f"{base} — {region}" if region else base
    if lang == "en":
        base = f"Professional {cat} service"
        return f"{base} — {region}" if region else base
    base = f"Professional {cat} xizmati"
    return f"{base} — {region}" if region else base


def suggest_profile_bio(
    *,
    specialty: str,
    skills: list[str],
    region: str,
    language: str,
) -> str:
    lang = _lang(language)
    specialty = specialty.strip() or ("Freelancer" if lang == "en" else "Mutaxassis")
    skill_text = ", ".join(s.strip() for s in skills if s.strip())[:80]
    region = region.strip()

    if lang == "ru":
        lines = [
            f"Я {specialty} с опытом удалённой работы.",
            f"Регион: {region}." if region else "",
            f"Навыки: {skill_text}." if skill_text else "",
            "Работаю прозрачно: сроки, этапы и обратная связь на каждом шаге.",
        ]
        return "\n\n".join(x for x in lines if x).strip()
    if lang == "en":
        lines = [
            f"I'm a {specialty} focused on clear delivery and client communication.",
            f"Based in {region}." if region else "",
            f"Skills: {skill_text}." if skill_text else "",
            "I break work into milestones and welcome revision rounds.",
        ]
        return "\n\n".join(x for x in lines if x).strip()
    lines = [
        f"Men {specialty} — masofadan ham sifatli ish yetkazaman.",
        f"Viloyat: {region}." if region else "",
        f"Ko'nikmalar: {skill_text}." if skill_text else "",
        "Ishni bosqichlarga bo'lib, muddat va natijani ochiq muhokama qilaman.",
    ]
    return "\n\n".join(x for x in lines if x).strip()


def suggest_cover_letter(
    *,
    project_title: str,
    project_description: str,
    specialty: str,
    language: str,
) -> str:
    lang = _lang(language)
    title = project_title.strip() or ("Loyiha" if lang == "uz" else "Project")
    specialty = specialty.strip() or ("freelancer" if lang == "en" else "mutaxassis")
    excerpt = " ".join(project_description.split())[:200]

    if lang == "ru":
        return (
            f"Здравствуйте! Я {specialty} и хочу работать над «{title}».\n\n"
            f"{'Кратко о задаче: ' + excerpt + '…' if excerpt else ''}\n"
            "Готов(а) обсудить этапы, сроки и предложить план работ. "
            "Есть опыт похожих проектов и открытость к обратной связи."
        ).strip()
    if lang == "en":
        return (
            f"Hello! I'm a {specialty} interested in «{title}».\n\n"
            f"{'Project summary: ' + excerpt + '…' if excerpt else ''}\n"
            "Happy to share a milestone plan, timeline, and samples of similar work."
        ).strip()
    return (
        f"Assalomu alaykum! Men {specialty} sifatida «{title}» loyihasiga ariza bermoqchiman.\n\n"
        f"{'Loyiha mazmuni: ' + excerpt + '…' if excerpt else ''}\n"
        "Ish bosqichlari, muddat va o'xshash ishlarimni muhokama qilishga tayyorman."
    ).strip()


def build_suggestion(kind: SuggestKind, payload: dict) -> str:
    language = str(payload.get("language") or "uz")
    if kind == "project_description":
        return suggest_project_description(
            title=str(payload.get("title") or ""),
            category=str(payload.get("category") or ""),
            skills=list(payload.get("skills") or []),
            language=language,
        )
    if kind == "service_description":
        return suggest_service_description(
            title=str(payload.get("title") or ""),
            category=str(payload.get("category") or ""),
            region=str(payload.get("region") or ""),
            language=language,
        )
    if kind == "service_title":
        return suggest_service_title(
            category=str(payload.get("category") or ""),
            region=str(payload.get("region") or ""),
            language=language,
        )
    if kind == "profile_bio":
        return suggest_profile_bio(
            specialty=str(payload.get("specialty") or payload.get("title") or ""),
            skills=list(payload.get("skills") or []),
            region=str(payload.get("region") or ""),
            language=language,
        )
    return suggest_cover_letter(
        project_title=str(payload.get("title") or ""),
        project_description=str(payload.get("project_description") or ""),
        specialty=str(payload.get("specialty") or ""),
        language=language,
    )
