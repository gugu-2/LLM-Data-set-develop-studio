"""
Hypasia AI — Selection strategies.
Top-N, percentile cutoff, difficulty-stratified sampling.
"""
from __future__ import annotations

from hypasia.schema import HypasiaRow


def filter_by_threshold(
    rows: list[HypasiaRow],
    threshold: float = 7.0,
) -> list[HypasiaRow]:
    """Keep only rows at or above the quality threshold."""
    return [r for r in rows if r.score >= threshold]


def select_rows(
    rows: list[HypasiaRow],
    strategy: str = "top-n",
    n: int = 1000,
    percentile: float = 70.0,
) -> list[HypasiaRow]:
    """
    Select rows by strategy:
    - top-n: take the N highest-scoring rows
    - percentile: keep top X% by score
    - stratified: evenly sample across score bands (ensures diverse difficulty)
    """
    sorted_rows = sorted(rows, key=lambda r: r.score, reverse=True)

    if strategy == "top-n":
        return sorted_rows[:n]

    elif strategy == "percentile":
        cutoff = len(sorted_rows) * (1.0 - percentile / 100.0)
        return sorted_rows[:max(1, int(len(sorted_rows) - cutoff))]

    elif strategy == "stratified":
        return _stratified_sample(sorted_rows, n)

    else:
        raise ValueError(f"Unknown strategy: {strategy}. Use: top-n | percentile | stratified")


def _stratified_sample(
    rows: list[HypasiaRow],
    n: int,
    bands: int = 5,
) -> list[HypasiaRow]:
    """
    Divide rows into score bands (e.g. 0-2, 2-4, 4-6, 6-8, 8-10)
    and sample evenly from each band. Ensures diversity of difficulty.
    """
    if not rows:
        return []

    band_size = 10.0 / bands
    buckets: dict[int, list[HypasiaRow]] = {i: [] for i in range(bands)}

    for row in rows:
        band_idx = min(int(row.score / band_size), bands - 1)
        buckets[band_idx].append(row)

    per_band = max(1, n // bands)
    selected: list[HypasiaRow] = []

    # Sample from highest bands first, fill remainder from next
    for band_idx in range(bands - 1, -1, -1):
        band_rows = buckets[band_idx]
        selected.extend(band_rows[:per_band])
        if len(selected) >= n:
            break

    # Topup if some bands were sparse
    if len(selected) < n:
        remaining = [r for r in rows if r not in selected]
        selected.extend(remaining[:n - len(selected)])

    return selected[:n]
