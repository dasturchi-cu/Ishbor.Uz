"""Scan repo for UTF-16 LE/BOM source files."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKIP = {".git", "node_modules", ".next", ".venv", "__pycache__"}
EXT = {".ts", ".tsx", ".js", ".jsx", ".css", ".md", ".json", ".mjs"}

bad: list[Path] = []
for p in ROOT.rglob("*"):
    if any(part in SKIP for part in p.parts):
        continue
    if p.suffix not in EXT:
        continue
    try:
        head = p.read_bytes()[:2]
    except OSError:
        continue
    if head == b"\xff\xfe" or (len(head) == 2 and head[1] == 0 and head[0] != 0):
        bad.append(p)

print(f"UTF-16 suspects: {len(bad)}")
for p in bad:
    print(p.relative_to(ROOT))
