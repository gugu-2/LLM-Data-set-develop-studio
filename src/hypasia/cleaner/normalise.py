"""
Hypasia AI — Text normalisation.
Strips HTML, fixes encoding, collapses whitespace, removes boilerplate.
"""
from __future__ import annotations

import re
from typing import TYPE_CHECKING

from hypasia.schema import HypasiaRow

if TYPE_CHECKING:
    pass


def normalise_rows(
    rows: list[HypasiaRow],
    progress=None,
    task_id=None,
) -> list[HypasiaRow]:
    cleaned = []
    for row in rows:
        row.instruction = normalise_text(row.instruction)
        row.response = normalise_text(row.response)
        row.recompute_id()
        if row.is_valid():
            cleaned.append(row)
        if progress and task_id is not None:
            progress.advance(task_id, 1)
    return cleaned


def normalise_text(text: str) -> str:
    """Clean a single text string."""
    if not text:
        return ""

    # Fix encoding issues
    try:
        import ftfy
        text = ftfy.fix_text(text)
    except ImportError:
        pass

    # Strip HTML tags
    try:
        import bleach
        text = bleach.clean(text, tags=[], strip=True)
    except ImportError:
        text = re.sub(r'<[^>]+>', ' ', text)

    # Decode HTML entities
    import html
    text = html.unescape(text)

    # Remove URLs (optional — keep for context)
    # text = re.sub(r'https?://\S+', '[URL]', text)

    # Collapse whitespace
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = text.strip()

    # Remove zero-width characters
    text = re.sub(r'[\u200b\u200c\u200d\ufeff]', '', text)

    # Remove excessive punctuation repetition (e.g. "!!!!!!")
    text = re.sub(r'([!?.])\1{3,}', r'\1', text)

    return text
