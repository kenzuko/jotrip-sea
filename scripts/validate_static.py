from __future__ import annotations

from html.parser import HTMLParser
from pathlib import Path
import re
import sys
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
REQUIRED = [
    ROOT / "index.html",
    ROOT / "booking" / "index.html",
    ROOT / "experiences" / "fishing" / "index.html",
    ROOT / "experiences" / "snorkeling" / "index.html",
    ROOT / "experiences" / "scuba-diving" / "index.html",
    ROOT / "experiences" / "private-cano" / "index.html",
    ROOT / "experiences" / "island-trips" / "index.html",
    ROOT / "experiences" / "yacht-charter" / "index.html",
    ROOT / "experiences" / "sunset" / "index.html",
    ROOT / "experiences" / "squid-fishing" / "index.html",
]

BANNED_PATTERNS = [
    (re.compile(r"\bbest\s*seller\b|\bbán\s*chạy\b", re.I), "fake popularity claim"),
    (re.compile(r"\bguaranteed?\s*catch\b|\bđảm\s*bảo\s*(?:có|bắt|câu)\s*cá\b", re.I), "guaranteed catch claim"),
    (re.compile(r"\bfrom\s*\d+[\.,]?\d*\s*(?:vnd|₫|đ)\b|\btừ\s*\d+[\.,]?\d*\s*(?:vnd|₫|đ)\b", re.I), "price on discovery UI"),
]

class Parser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.hrefs: list[str] = []
        self.assets: list[str] = []
        self.ids: list[str] = []
        self.forms: list[dict[str, str | None]] = []

    def handle_starttag(self, tag: str, attrs):
        data = dict(attrs)
        if "id" in data:
            self.ids.append(data["id"])
        if tag == "a" and data.get("href"):
            self.hrefs.append(data["href"])
        if tag == "link" and data.get("href"):
            self.assets.append(data["href"])
        if tag in {"script", "img"} and data.get("src"):
            self.assets.append(data["src"])
        if tag == "form":
            self.forms.append({"action": data.get("action"), "demo": data.get("data-demo-form")})


def route_to_file(href: str) -> Path | None:
    parsed = urlparse(href)
    if parsed.scheme or parsed.netloc or href.startswith("#") or href.startswith("mailto:") or href.startswith("tel:"):
        return None
    path = parsed.path
    if not path:
        return None
    if path == "/":
        return ROOT / "index.html"
    candidate = ROOT / path.lstrip("/")
    if candidate.suffix:
        return candidate
    return candidate / "index.html"


def main() -> int:
    errors: list[str] = []

    for required in REQUIRED:
        if not required.is_file():
            errors.append(f"missing required route: {required.relative_to(ROOT)}")

    for page in ROOT.rglob("*.html"):
        text = page.read_text(encoding="utf-8")
        parser = Parser()
        parser.feed(text)

        if len(parser.ids) != len(set(parser.ids)):
            dupes = sorted({i for i in parser.ids if parser.ids.count(i) > 1})
            errors.append(f"{page.relative_to(ROOT)} duplicate ids: {', '.join(dupes)}")

        for form in parser.forms:
            if form["action"] not in (None, "", "#"):
                errors.append(f"{page.relative_to(ROOT)} form has live action in preview: {form['action']}")

        for href in parser.hrefs:
            target = route_to_file(href)
            if target is not None and not target.exists():
                errors.append(f"{page.relative_to(ROOT)} broken internal link: {href}")

        for asset in parser.assets:
            target = route_to_file(asset)
            if target is not None and not target.exists():
                errors.append(f"{page.relative_to(ROOT)} missing internal asset: {asset}")

        for pattern, label in BANNED_PATTERNS:
            if pattern.search(text):
                errors.append(f"{page.relative_to(ROOT)} contains {label}")

    if errors:
        print("Static validation failed:\n")
        for error in errors:
            print(f"- {error}")
        return 1

    print("Static validation passed.")
    print(f"Checked {len(list(ROOT.rglob('*.html')))} HTML pages.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
