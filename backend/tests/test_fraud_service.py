from app.fraud_service import scan_message_content


def test_off_platform_payment_detected():
    hits = scan_message_content("Telegram orqali to'lov qiling, platformadan tashqari")
    assert any(h[0] == "off_platform_payment" for h in hits)


def test_phone_contact_leak():
    hits = scan_message_content("Menga +998 90 123 45 67 qo'ng'iroq qiling")
    assert any(h[0] == "contact_leak" for h in hits)


def test_clean_message_no_flags():
    assert scan_message_content("Salom, ishni boshlayman") == []
