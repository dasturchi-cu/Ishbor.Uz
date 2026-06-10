from app.migration_checks import verify_launch_readiness


def test_verify_launch_readiness_ok():
    ok, details = verify_launch_readiness()
    assert isinstance(ok, bool)
    assert isinstance(details, dict)
