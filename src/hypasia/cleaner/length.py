"""
Hypasia AI — Token length filter.
Removes rows that are too short (garbage) or too long (exceeds context).
"""
from __future__ import annotations

from hypasia.schema import HypasiaRow


def filter_by_length(
    rows: list[HypasiaRow],
    min_tokens: int = 20,
    max_tokens: int = 4096,
) -> list[HypasiaRow]:
    """
    Filter rows by approximate token count (word count proxy).
    min_tokens: remove rows with fewer words than this
    max_tokens: remove rows with more words than this
    """
    kept = []
    for row in rows:
        n = len((row.instruction + " " + row.response).split())
        row.tokens = n
        if min_tokens <= n <= max_tokens:
            kept.append(row)
    return kept
