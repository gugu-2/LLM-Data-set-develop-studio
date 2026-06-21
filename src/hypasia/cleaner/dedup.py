"""
Hypasia AI — Deduplication.
Exact dedup via MD5 hash.
Near-dedup via MinHash LSH (catches paraphrased duplicates).
"""
from __future__ import annotations

import hashlib
import re
from typing import TYPE_CHECKING

from hypasia.schema import HypasiaRow

if TYPE_CHECKING:
    pass


def dedup_rows(
    rows: list[HypasiaRow],
    near_dedup: bool = True,
    threshold: float = 0.8,
    num_perm: int = 128,
    progress=None,
    task_id=None,
) -> list[HypasiaRow]:
    """
    Remove exact and near-duplicate rows.
    Updates each row's uniqueness score based on similarity.
    """
    # Step 1: Exact dedup by MD5
    seen_hashes: set[str] = set()
    after_exact: list[HypasiaRow] = []
    for row in rows:
        h = _md5(row.instruction + row.response)
        if h not in seen_hashes:
            seen_hashes.add(h)
            after_exact.append(row)
        if progress and task_id is not None:
            progress.advance(task_id, 1)

    if not near_dedup or len(after_exact) < 2:
        return after_exact

    # Step 2: Near-dedup with MinHash LSH
    try:
        from datasketch import MinHash, MinHashLSH
    except ImportError:
        # datasketch not available — skip near-dedup
        return after_exact

    lsh = MinHashLSH(threshold=threshold, num_perm=num_perm)
    minhashes: dict[str, MinHash] = {}

    for i, row in enumerate(after_exact):
        m = MinHash(num_perm=num_perm)
        tokens = _shingle(row.instruction + " " + row.response)
        for t in tokens:
            m.update(t.encode("utf-8"))
        key = f"row_{i}"
        try:
            lsh.insert(key, m)
            minhashes[key] = m
        except ValueError:
            pass  # Already inserted (shouldn't happen)

    kept: list[HypasiaRow] = []
    removed_keys: set[str] = set()

    for i, row in enumerate(after_exact):
        key = f"row_{i}"
        if key in removed_keys:
            continue
        result = lsh.query(minhashes[key])
        # Mark all similar rows (except this one) for removal
        for dup_key in result:
            if dup_key != key:
                removed_keys.add(dup_key)
                # Reduce uniqueness score of near-dupes
        row.scores.uniqueness = max(0.0, 10.0 - len(result) * 0.5)
        kept.append(row)

    return kept


def _md5(text: str) -> str:
    return hashlib.md5(text.lower().encode("utf-8")).hexdigest()


def _shingle(text: str, k: int = 3) -> set[str]:
    """k-word shingles for MinHash."""
    words = re.split(r'\W+', text.lower())
    words = [w for w in words if w]
    return {" ".join(words[i:i+k]) for i in range(len(words) - k + 1)}
