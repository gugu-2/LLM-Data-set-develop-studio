"""
Hypasia AI — Text/Markdown/HTML/EPUB parser.
"""
from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

from hypasia.schema import HypasiaRow


def parse_text(path: Path) -> list[HypasiaRow]:
    ext = path.suffix.lower()
    if ext == ".epub":
        return _parse_epub(path)
    elif ext in (".html", ".htm"):
        return _parse_html(path)
    else:
        return _parse_plain(path)


def _parse_plain(path: Path) -> list[HypasiaRow]:
    """Parse .txt or .md — chunk by paragraphs or headers."""
    try:
        text = path.read_text(encoding="utf-8", errors="replace")
    except Exception:
        return []

    source = str(path.resolve())
    rows: list[HypasiaRow] = []

    # Split by double newline (paragraphs)
    chunks = [c.strip() for c in text.split("\n\n") if len(c.strip()) > 80]

    if not chunks:
        chunks = [text.strip()]

    for chunk in chunks:
        lines = chunk.splitlines()
        instruction = lines[0].lstrip("# ").strip() if lines else path.stem
        response = "\n".join(lines[1:]).strip() if len(lines) > 1 else chunk
        if not response:
            response = chunk

        rows.append(HypasiaRow(
            instruction=instruction,
            response=response,
            source=source,
            source_type="file",
            title=path.stem,
            raw_text=chunk,
            date_extracted=datetime.now(timezone.utc).isoformat(),
        ))

    return rows


def _parse_html(path: Path) -> list[HypasiaRow]:
    try:
        import trafilatura
        html = path.read_text(encoding="utf-8", errors="replace")
        text = trafilatura.extract(html, favor_precision=True) or ""
    except Exception:
        from bs4 import BeautifulSoup
        html = path.read_text(encoding="utf-8", errors="replace")
        text = BeautifulSoup(html, "lxml").get_text(separator="\n")

    if not text.strip():
        return []

    source = str(path.resolve())
    return [HypasiaRow(
        instruction=f"Summarize the HTML document: {path.name}",
        response=text.strip(),
        source=source,
        source_type="file",
        title=path.stem,
        raw_text=text.strip(),
        date_extracted=datetime.now(timezone.utc).isoformat(),
    )]


def _parse_epub(path: Path) -> list[HypasiaRow]:
    try:
        import ebooklib
        from ebooklib import epub
        from bs4 import BeautifulSoup
    except ImportError:
        raise ImportError("ebooklib not installed: pip install ebooklib")

    book = epub.read_epub(str(path))
    source = str(path.resolve())
    rows: list[HypasiaRow] = []

    for item in book.get_items_of_type(ebooklib.ITEM_DOCUMENT):
        soup = BeautifulSoup(item.get_content(), "lxml")
        text = soup.get_text(separator="\n").strip()
        if len(text) < 100:
            continue
        title_tag = soup.find(["h1", "h2", "title"])
        title = title_tag.get_text().strip() if title_tag else path.stem

        rows.append(HypasiaRow(
            instruction=f"What does the chapter '{title}' cover?",
            response=text,
            source=source,
            source_type="file",
            title=title,
            raw_text=text,
            date_extracted=datetime.now(timezone.utc).isoformat(),
        ))

    return rows
