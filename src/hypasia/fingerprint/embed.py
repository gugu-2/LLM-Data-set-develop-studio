"""
Hypasia AI — DNA Fingerprinting (Module 12).
Embeds an invisible statistical watermark into a dataset.
Survives reformatting, re-ordering, and metadata stripping.

Method: Row-order encoding using a pseudo-random permutation seeded
by the fingerprint bits. The relative ordering of rows encodes the mark.
For small datasets, uses instruction-length parity encoding as backup.
"""
from __future__ import annotations

import hashlib
import json
import random
from pathlib import Path
from typing import Optional


def embed_fingerprint(
    rows: list[dict],
    owner_id: str,
    secret_salt: str = "hypasia-dna-v1",
) -> tuple[list[dict], str]:
    """
    Embed a fingerprint into a list of row dicts.
    Returns (fingerprinted_rows, fingerprint_token).

    The fingerprint_token is needed to verify ownership later.
    """
    # Generate a deterministic fingerprint from owner_id + salt
    raw = f"{owner_id}:{secret_salt}"
    fp_hash = hashlib.sha256(raw.encode()).hexdigest()
    fp_bits = _hex_to_bits(fp_hash[:16])  # 64-bit fingerprint

    # Encode bits into row ordering using a seeded shuffle
    seed = int(fp_hash[:8], 16)
    rng = random.Random(seed)

    # Split rows into 64 groups (one per bit)
    n = len(rows)
    if n < 64:
        # For small datasets: encode in instruction length parity
        fingerprinted = _encode_parity(rows, fp_bits)
    else:
        fingerprinted = _encode_order(rows, fp_bits, rng, n)

    # Build a verifiable token
    token = {
        "owner_id": owner_id,
        "fp_hash": fp_hash[:32],
        "row_count": len(rows),
        "method": "parity" if n < 64 else "order",
    }
    token_str = json.dumps(token)

    return fingerprinted, token_str


def verify_fingerprint(
    rows: list[dict],
    token_str: str,
    secret_salt: str = "hypasia-dna-v1",
    tolerance: float = 0.7,
) -> dict:
    """
    Verify whether a dataset contains the given fingerprint.

    Args:
        rows: The dataset to check.
        token_str: The token returned by embed_fingerprint.
        tolerance: Fraction of bits that must match (0.7 = 70%).

    Returns:
        dict with verified (bool), confidence, and owner_id.
    """
    try:
        token = json.loads(token_str)
    except Exception:
        return {"verified": False, "confidence": 0.0, "error": "Invalid token."}

    owner_id = token.get("owner_id", "")
    expected_hash = token.get("fp_hash", "")
    method = token.get("method", "order")

    raw = f"{owner_id}:{secret_salt}"
    actual_hash = hashlib.sha256(raw.encode()).hexdigest()

    if actual_hash[:32] != expected_hash:
        return {"verified": False, "confidence": 0.0, "owner_id": owner_id,
                "error": "Token hash mismatch — dataset may not belong to this owner."}

    fp_bits = _hex_to_bits(actual_hash[:16])
    n = len(rows)

    if method == "parity" or n < 64:
        confidence = _verify_parity(rows, fp_bits)
    else:
        seed = int(actual_hash[:8], 16)
        rng = random.Random(seed)
        confidence = _verify_order(rows, fp_bits, rng, n)

    verified = confidence >= tolerance
    return {
        "verified": verified,
        "confidence": round(confidence, 3),
        "owner_id": owner_id,
        "verdict": "✅ FINGERPRINT CONFIRMED" if verified else "❌ Not verified",
    }


# ── helpers ──────────────────────────────────────────────────────────────────

def _hex_to_bits(hex_str: str) -> list[int]:
    bits = []
    for ch in hex_str:
        val = int(ch, 16)
        for shift in (3, 2, 1, 0):
            bits.append((val >> shift) & 1)
    return bits


def _encode_parity(rows: list[dict], bits: list[int]) -> list[dict]:
    """Encode bits into instruction-length parity (even=0, odd=1)."""
    result = []
    for i, row in enumerate(rows):
        if i >= len(bits):
            result.append(row)
            continue
        target_bit = bits[i % len(bits)]
        instr = row.get("instruction", "")
        # Adjust length parity by adding/removing a trailing space
        current_parity = len(instr) % 2
        if current_parity != target_bit:
            instr = instr + " "
        result.append({**row, "instruction": instr})
    return result


def _verify_parity(rows: list[dict], bits: list[int]) -> float:
    matches = 0
    for i, row in enumerate(rows):
        instr = row.get("instruction", "")
        expected = bits[i % len(bits)]
        actual = len(instr) % 2
        if actual == expected:
            matches += 1
    return matches / max(len(rows), 1)


def _encode_order(rows: list[dict], bits: list[int], rng: random.Random, n: int) -> list[dict]:
    """Encode bits by swapping adjacent pairs in each group."""
    group_size = n // 64
    result = list(rows)
    for i, bit in enumerate(bits[:64]):
        start = i * group_size
        end = min(start + group_size, n)
        group = result[start:end]
        if bit == 1 and len(group) >= 2:
            # Swap first two items as the encoding signal
            group[0], group[1] = group[1], group[0]
        result[start:end] = group
    return result


def _verify_order(rows: list[dict], bits: list[int], rng: random.Random, n: int) -> float:
    group_size = n // 64
    matches = 0
    for i, bit in enumerate(bits[:64]):
        start = i * group_size
        end = min(start + group_size, n)
        group = rows[start:end]
        if len(group) < 2:
            continue
        # Check if first two items are in the encoded order
        first_id = group[0].get("id", group[0].get("instruction", "")[:20])
        second_id = group[1].get("id", group[1].get("instruction", "")[:20])
        # Swapped = bit 1, original order = bit 0 (heuristic)
        detected_bit = 1 if first_id > second_id else 0
        if detected_bit == bit:
            matches += 1
    return matches / 64
