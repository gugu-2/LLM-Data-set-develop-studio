"""
Hypasia AI — Gemini LLM-as-judge scorer.
Uses the new google-genai SDK (replaces deprecated google.generativeai).
Batches rows and asks Gemini to rate each on all 6 quality axes.
"""
from __future__ import annotations

import json
import re

from hypasia.schema import HypasiaRow, ScoreBreakdown

_SYSTEM_PROMPT = """
You are an expert LLM training data quality judge for Hypasia AI.
Your task: evaluate instruction-response pairs for LLM fine-tuning quality.

For each pair, return a JSON object with these exact keys (scores 0.0-10.0):
- specificity: How specific and detailed is the response? Does it have facts, numbers, examples?
- clarity: How clearly does the instruction specify what's needed?
- completeness: Does the response fully address the instruction?
- difficulty: How complex/challenging is this example? (higher = harder)
- uniqueness: How novel/unique is this content? (assume 10 unless clearly repetitive)
- domain_relevance: How relevant to a useful training domain? (general = 5, highly domain-specific = 9-10)

Be strict. A score of 10 is exceptional. 7 is good. 5 is mediocre. Below 5 is poor.
Return ONLY a JSON array, one object per input pair. No markdown, no explanation.
"""

_ROW_TEMPLATE = """
[{idx}]
INSTRUCTION: {instruction}
RESPONSE: {response}
"""


def score_batch_gemini(
    rows: list[HypasiaRow],
    api_key: str,
    model: str = "gemini-2.5-flash",
    batch_size: int = 10,
    inter_batch_sleep: float = 13.0,   # free tier: 5 req/min → ≥12s between calls
    max_retries: int = 3,
) -> list[ScoreBreakdown]:
    """
    Score a batch of rows using Gemini 2.5 Flash.
    Returns ScoreBreakdown per row. Falls back to heuristic only after max_retries.
    Automatically handles free-tier rate limits (5 req/min) with sleep + backoff.
    """
    try:
        from google import genai
        from google.genai import types
    except ImportError:
        raise ImportError("google-genai not installed: pip install google-genai")

    import time

    client = genai.Client(api_key=api_key)
    results: list[ScoreBreakdown] = []

    for batch_idx, batch_start in enumerate(range(0, len(rows), batch_size)):
        # Pause between batches to respect rate limit (free tier: 5 req/min)
        if batch_idx > 0:
            time.sleep(inter_batch_sleep)

        batch = rows[batch_start: batch_start + batch_size]

        prompt = "\n".join(
            _ROW_TEMPLATE.format(
                idx=i,
                instruction=r.instruction[:500],
                response=r.response[:800],
            )
            for i, r in enumerate(batch)
        )
        prompt += "\n\nReturn a JSON array with one score object per pair above. No markdown."

        scores = None
        for attempt in range(1, max_retries + 1):
            try:
                response = client.models.generate_content(
                    model=model,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        system_instruction=_SYSTEM_PROMPT,
                        temperature=0.1,
                    ),
                )
                scores = _parse_response(response.text, len(batch))
                break
            except Exception as e:
                err = str(e)
                if "429" in err or "RESOURCE_EXHAUSTED" in err:
                    wait = inter_batch_sleep * attempt
                    print(f"[Gemini] Rate limited — waiting {wait:.0f}s then retrying ({attempt}/{max_retries})...")
                    time.sleep(wait)
                else:
                    print(f"[Gemini] API error: {e} — falling back to heuristic for this batch")
                    break

        if scores is None:
            from hypasia.scorer.heuristic import score_heuristic
            scores = [score_heuristic(r) for r in batch]

        results.extend(scores)

    return results


def _parse_response(text: str, expected: int) -> list[ScoreBreakdown]:
    """Extract JSON array from Gemini response."""
    # Strip markdown code fences if present
    text = re.sub(r"```(?:json)?\s*", "", text).strip().rstrip("`")

    try:
        data = json.loads(text)
        if not isinstance(data, list):
            data = [data]
    except json.JSONDecodeError:
        # Try to extract array from anywhere in the text
        match = re.search(r"\[.*\]", text, re.DOTALL)
        if match:
            try:
                data = json.loads(match.group())
            except Exception:
                data = []
        else:
            data = []

    breakdowns: list[ScoreBreakdown] = []
    for item in data[:expected]:
        if isinstance(item, dict):
            breakdowns.append(ScoreBreakdown(
                specificity=_safe_float(item.get("specificity"), 5.0),
                clarity=_safe_float(item.get("clarity"), 5.0),
                completeness=_safe_float(item.get("completeness"), 5.0),
                difficulty=_safe_float(item.get("difficulty"), 5.0),
                uniqueness=_safe_float(item.get("uniqueness"), 10.0),
                domain_relevance=_safe_float(item.get("domain_relevance"), 5.0),
            ))
        else:
            breakdowns.append(ScoreBreakdown())

    # Pad if Gemini returned fewer items than expected
    while len(breakdowns) < expected:
        breakdowns.append(ScoreBreakdown(
            specificity=5.0, clarity=5.0, completeness=5.0,
            difficulty=5.0, uniqueness=10.0, domain_relevance=5.0,
        ))

    return breakdowns


def _safe_float(value, default: float) -> float:
    try:
        return max(0.0, min(10.0, float(value)))
    except (TypeError, ValueError):
        return default
