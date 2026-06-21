"""
Hypasia AI — Ollama LLM-as-judge scorer.
Batches rows and asks a local Ollama model to rate each on all 6 quality axes.
Requires Ollama (https://ollama.com) to be running locally.
"""
from __future__ import annotations

import json
import re

import requests

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

_OLLAMA_URL = "http://localhost:11434/api/generate"


def score_batch_ollama(
    rows: list[HypasiaRow],
    model: str = "llama3",
    batch_size: int = 5,
) -> list[ScoreBreakdown]:
    """
    Score a batch of rows using local Ollama.
    Returns ScoreBreakdown per row. Falls back to heuristic on any connection error.
    Batch size is lower (5) because local models have smaller context windows.
    """
    results: list[ScoreBreakdown] = []

    for batch_start in range(0, len(rows), batch_size):
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

        try:
            resp = requests.post(
                _OLLAMA_URL,
                json={
                    "model": model,
                    "prompt": prompt,
                    "system": _SYSTEM_PROMPT,
                    "stream": False,
                    "options": {
                        "temperature": 0.1,
                    }
                },
                timeout=120  # Local generation can take time depending on GPU
            )
            resp.raise_for_status()
            text = resp.json().get("response", "")
            scores = _parse_response(text, len(batch))
        except requests.exceptions.ConnectionError:
            print("[Ollama] Connection error — is Ollama running? Falling back to heuristic.")
            from hypasia.scorer.heuristic import score_heuristic
            scores = [score_heuristic(r) for r in batch]
        except Exception as e:
            print(f"[Ollama] Error: {e} — falling back to heuristic for this batch")
            from hypasia.scorer.heuristic import score_heuristic
            scores = [score_heuristic(r) for r in batch]

        results.extend(scores)

    return results


def _parse_response(text: str, expected: int) -> list[ScoreBreakdown]:
    """Extract JSON array from Ollama response."""
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

    # Pad if Ollama returned fewer items than expected
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
