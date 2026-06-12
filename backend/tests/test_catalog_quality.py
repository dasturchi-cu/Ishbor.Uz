from app.catalog_quality import (
    filter_quality_freelancer_rows,
    filter_quality_service_rows,
    is_catalog_quality_title,
)


def test_rejects_junk_titles():
    assert not is_catalog_quality_title("test")
    assert not is_catalog_quality_title("tes")
    assert not is_catalog_quality_title("testing junk")
    assert not is_catalog_quality_title("ma suka")
    assert not is_catalog_quality_title("ab")
    assert not is_catalog_quality_title("testfdsssssssss")
    assert not is_catalog_quality_title("tead")


def test_accepts_real_titles():
    assert is_catalog_quality_title("Logo dizayn")
    assert is_catalog_quality_title("Veb-sayt yaratish")


def test_filter_service_rows():
    rows = [{"title": "test"}, {"title": "Landing page dizayn"}]
    out = filter_quality_service_rows(rows)
    assert len(out) == 1
    assert out[0]["title"] == "Landing page dizayn"


def test_filter_freelancer_rows():
    rows = [{"full_name": "dassad"}, {"full_name": "Aziza Karimova"}]
    out = filter_quality_freelancer_rows(rows)
    assert len(out) == 1
    assert out[0]["full_name"] == "Aziza Karimova"
