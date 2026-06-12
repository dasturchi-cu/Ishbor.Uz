"""Conversion funnel report builder."""

from unittest.mock import patch

from app.analytics_funnel import build_funnel_report


def test_build_funnel_report_stages_and_rates():
    counts = {
        "funnel_register_view": 100,
        "register": 25,
        "login": 40,
        "onboarding_complete": 20,
        "service_view": 50,
        "freelancer_view": 30,
        "project_view": 20,
        "checkout_started": 5,
        "funnel_checkout_started": 3,
        "payment_attempt": 6,
        "payment_succeeded": 4,
        "message_started": 12,
    }

    def fake_count(event_name: str, _since: str) -> int:
        return counts.get(event_name, 0)

    with patch("app.analytics_funnel._count_events_since", side_effect=fake_count):
        report = build_funnel_report("2026-01-01T00:00:00+00:00", 30)

    assert report["period_days"] == 30
    stages = {s["id"]: s for s in report["stages"]}

    assert stages["registrations"]["count"] == 25
    assert stages["registrations"]["rate_from_previous"] == 25.0
    assert stages["discovery_views"]["count"] == 100
    assert stages["discovery_views"]["breakdown"] == {
        "service_view": 50,
        "freelancer_view": 30,
        "project_view": 20,
    }
    assert stages["checkout_started"]["count"] == 8
    assert stages["payment_succeeded"]["rate_from_previous"] == round(4 / 6 * 100, 1)

    assert report["summary"]["signup_rate"] == 25.0
    assert report["summary"]["onboarding_rate"] == 80.0
    assert report["summary"]["checkout_rate"] == 8.0
    assert report["summary"]["payment_conversion"] == round(4 / 6 * 100, 1)


def test_build_funnel_report_zero_denominators():
    with patch("app.analytics_funnel._count_events_since", return_value=0):
        report = build_funnel_report("2026-01-01T00:00:00+00:00", 7)

    assert all(s["count"] == 0 for s in report["stages"])
    assert report["summary"]["signup_rate"] == 0.0
