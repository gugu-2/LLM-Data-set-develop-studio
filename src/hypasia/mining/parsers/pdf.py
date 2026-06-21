"""
Hypasia AI — PDF parser using pdfplumber.
Extracts text page-by-page, creates one row per page.
"""
from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

from hypasia.schema import HypasiaRow


def parse_pdf(path: Path) -> list[HypasiaRow]:
    try:
        import pdfplumber
    except ImportError:
        raise ImportError("pdfplumber not installed: pip install pdfplumber")

    rows: list[HypasiaRow] = []
    source = str(path.resolve())

    with pdfplumber.open(path) as pdf:
        full_text_pages = []
        for i, page in enumerate(pdf.pages):
            text = page.extract_text()
            if text and len(text.strip()) > 50:
                full_text_pages.append((i + 1, text.strip()))

    # If short doc, combine all pages into one row
    if len(full_text_pages) <= 3:
        combined = "\n\n".join(t for _, t in full_text_pages)
        if combined:
            rows.append(HypasiaRow(
                instruction=f"Summarize the following document: {path.name}",
                response=combined,
                source=source,
                source_type="file",
                title=path.stem,
                raw_text=combined,
                date_extracted=datetime.now(timezone.utc).isoformat(),
            ))
        return rows

    # Longer docs: one row per page
    for page_num, text in full_text_pages:
        sentences = [s.strip() for s in text.split(".") if len(s.strip()) > 20]
        if len(sentences) >= 2:
            instruction = sentences[0] + "."
            response = ". ".join(sentences[1:]).strip()
        else:
            instruction = f"What does page {page_num} of {path.name} discuss?"
            response = text

        rows.append(HypasiaRow(
            instruction=instruction,
            response=response,
            source=f"{source}#page={page_num}",
            source_type="file",
            title=f"{path.stem} — page {page_num}",
            raw_text=text,
            date_extracted=datetime.now(timezone.utc).isoformat(),
        ))

    return rows
