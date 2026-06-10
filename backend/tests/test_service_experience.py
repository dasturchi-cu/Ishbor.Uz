from app.service_experience import (
    filter_service_rows_by_experience,
    freelancer_matches_experience,
    parse_experience_param,
)


def test_parse_experience_param():
    assert parse_experience_param(None) == set()
    assert parse_experience_param("exp_new,exp_expert") == {"exp_new", "exp_expert"}
    assert parse_experience_param("bad,exp_mid") == {"exp_mid"}


def test_freelancer_matches_experience():
    assert freelancer_matches_experience(0.0, {"exp_new"})
    assert freelancer_matches_experience(4.5, {"exp_mid"})
    assert freelancer_matches_experience(4.8, {"exp_expert"})
    assert not freelancer_matches_experience(4.8, {"exp_new"})


def test_filter_service_rows_by_experience():
    rows = [
        {"id": "s1", "freelancer_id": "f1"},
        {"id": "s2", "freelancer_id": "f2"},
    ]
    stats = {"f1": (3.5, 2), "f2": (4.8, 10)}
    filtered = filter_service_rows_by_experience(rows, stats, {"exp_expert"})
    assert len(filtered) == 1
    assert filtered[0]["id"] == "s2"
