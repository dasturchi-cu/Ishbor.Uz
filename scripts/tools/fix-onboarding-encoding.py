"""Fix UTF-16 corruption in onboarding-page.tsx and verify UTF-8."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
p = ROOT / "src/presentation/features/onboarding/onboarding-page.tsx"
raw = p.read_bytes()
print(f"bytes={len(raw)} nulls_in_head={raw[:80].count(0)}")

if b"\x00" in raw:
    for enc in ("utf-16-le", "utf-16"):
        try:
            text = raw.decode(enc)
            if "'use client'" in text:
                p.write_text(text, encoding="utf-8", newline="\n")
                print(f"converted from {enc}, lines={text.count(chr(10)) + 1}")
                break
        except UnicodeError as e:
            print(f"{enc} failed: {e}")
else:
    text = raw.decode("utf-8")
    print(f"already utf-8, lines={text.count(chr(10)) + 1}")

# verify
tsc_check = p.read_bytes()
assert b"\x00" not in tsc_check[:200], "still corrupted"
print("ok")
