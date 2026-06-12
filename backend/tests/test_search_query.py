from app.search_query import (
    apply_search_tokens,
    expand_tokens,
    relevance_score,
    sort_by_relevance,
    tokenize_search,
)


class _FakeQuery:
    def __init__(self):
        self.filters: list[str] = []

    def or_(self, expr: str):
        self.filters.append(expr)
        return self


def test_tokenize_search_splits_words():
    assert tokenize_search("telegram bot") == ["telegram", "bot"]
    assert tokenize_search("  web sayt  ") == ["web", "sayt"]


def test_expand_tokens_synonyms():
    expanded = expand_tokens(["dizayn"])
    assert "design" in expanded
    assert "graphic" in expanded


def test_apply_search_tokens_uses_category_eq_for_slugs():
    q = _FakeQuery()
    apply_search_tokens(q, ["web"], ["title", "description", "category"])
    assert len(q.filters) == 1
    assert "category.eq.web" in q.filters[0]


def test_relevance_score_prefers_title():
    row = {"title": "Logo dizayn", "description": "", "category": "graphic"}
    score = relevance_score(row, ["logo"])
    low = relevance_score({"title": "Xizmat", "description": "logo haqida", "category": "web"}, ["logo"])
    assert score > low


def test_sort_by_relevance_orders_rows():
    rows = [
        {"title": "Umumiy xizmat", "description": "python haqida", "created_at": "2024-01-02"},
        {"title": "Python dasturlash", "description": "", "created_at": "2024-01-01"},
    ]
    out = sort_by_relevance(rows, "python")
    assert out[0]["title"] == "Python dasturlash"
