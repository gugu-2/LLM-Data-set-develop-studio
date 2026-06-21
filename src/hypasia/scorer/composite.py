"""
Hypasia AI — Composite scorer.
Combines heuristic and LLM scores into a weighted composite.
Assigns gold / silver / rejected tier.
"""
from __future__ import annotations

from typing import TYPE_CHECKING

from hypasia.schema import HypasiaRow, ScoreBreakdown, assign_tier

if TYPE_CHECKING:
    pass

# Axis weights (must sum to 1.0)
WEIGHTS = {
    "specificity": 0.25,
    "clarity": 0.20,
    "completeness": 0.20,
    "difficulty": 0.15,
    "uniqueness": 0.10,
    "domain_relevance": 0.10,
}


def compute_composite(breakdown: ScoreBreakdown) -> float:
    """Weighted average of 6 axis scores."""
    return (
        breakdown.specificity * WEIGHTS["specificity"] +
        breakdown.clarity * WEIGHTS["clarity"] +
        breakdown.completeness * WEIGHTS["completeness"] +
        breakdown.difficulty * WEIGHTS["difficulty"] +
        breakdown.uniqueness * WEIGHTS["uniqueness"] +
        breakdown.domain_relevance * WEIGHTS["domain_relevance"]
    )


def score_rows(
    rows: list[HypasiaRow],
    judge: str = "gemini",
    threshold: float = 7.0,
    batch_size: int = 10,
    threads: int = 4,
    ollama_model: str = "llama3.1",
    api_key: str = None,
    progress=None,
    task_id=None,
) -> list[HypasiaRow]:
    """
    Score all rows and attach scores + tier to each.
    Returns the same list with scores populated.
    """
    from hypasia.config import cfg

    active_key = api_key or cfg.gemini_api_key

    if judge == "gemini" and active_key:
        _score_with_gemini(rows, active_key, batch_size, threads, progress, task_id)
    elif judge == "ollama":
        _score_with_ollama(rows, ollama_model, 5, threads, progress, task_id)  # Smaller batch for local
    else:
        if judge == "gemini" and not active_key:
            print("[scorer] GEMINI_API_KEY not set — falling back to heuristic scorer.")
        _score_with_heuristic(rows, progress, task_id)

    # Compute composite + assign tier
    for row in rows:
        row.score = round(compute_composite(row.scores), 2)
        row.tier = assign_tier(row.score, threshold)
        row.tokens = len((row.instruction + " " + row.response).split())

    return rows


def _score_with_gemini(rows, api_key, batch_size, threads, progress, task_id):
    from hypasia.scorer.gemini_judge import score_batch_gemini
    from concurrent.futures import ThreadPoolExecutor, as_completed

    batches = [rows[i: i + batch_size] for i in range(0, len(rows), batch_size)]
    with ThreadPoolExecutor(max_workers=threads) as executor:
        futures = {executor.submit(score_batch_gemini, b, api_key=api_key, batch_size=batch_size): b for b in batches}
        for future in as_completed(futures):
            batch = futures[future]
            breakdowns = future.result()
            for row, bd in zip(batch, breakdowns):
                row.scores = bd
            if progress and task_id is not None:
                progress.advance(task_id, len(batch))


def _score_with_heuristic(rows, progress, task_id):
    from hypasia.scorer.heuristic import score_heuristic

    for row in rows:
        row.scores = score_heuristic(row)
        if progress and task_id is not None:
            progress.advance(task_id, 1)


def _score_with_ollama(rows, model, batch_size, threads, progress, task_id):
    from hypasia.scorer.ollama_judge import score_batch_ollama
    from concurrent.futures import ThreadPoolExecutor, as_completed

    batches = [rows[i: i + batch_size] for i in range(0, len(rows), batch_size)]
    with ThreadPoolExecutor(max_workers=threads) as executor:
        futures = {executor.submit(score_batch_ollama, b, model=model, batch_size=batch_size): b for b in batches}
        for future in as_completed(futures):
            batch = futures[future]
            breakdowns = future.result()
            for row, bd in zip(batch, breakdowns):
                row.scores = bd
            if progress and task_id is not None:
                progress.advance(task_id, len(batch))
