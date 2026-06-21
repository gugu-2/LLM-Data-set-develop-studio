"""
Hypasia AI — Language detection filter.
Keeps only rows matching target languages. Uses langdetect with fallback.
"""
from __future__ import annotations

from hypasia.schema import HypasiaRow


def filter_by_language(
    rows: list[HypasiaRow],
    allowed: list[str] = ("en",),
    min_text_len: int = 20,
    progress=None,
    task_id=None,
) -> list[HypasiaRow]:
    """
    Filter rows to only keep those matching allowed language codes.
    Uses langdetect. If langdetect is not installed, passes all rows through.
    """
    try:
        from langdetect import detect, LangDetectException
        has_langdetect = True
    except ImportError:
        has_langdetect = False

    allowed_set = set(allowed)
    kept = []

    for row in rows:
        if progress and task_id is not None:
            progress.advance(task_id, 1)

        if not has_langdetect:
            row.language = "unknown"
            kept.append(row)
            continue

        text = (row.instruction + " " + row.response).strip()
        if len(text) < min_text_len:
            continue

        try:
            lang = detect(text)
            row.language = lang
            if lang in allowed_set:
                kept.append(row)
        except Exception:
            row.language = "unknown"
            if "unknown" in allowed_set or not allowed_set:
                kept.append(row)

    return kept
