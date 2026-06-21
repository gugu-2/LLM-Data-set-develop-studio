"""
Hypasia AI — Auto-Eval Benchmark.
Generates a held-out evaluation set and scores fine-tuned vs base model.
"""
from __future__ import annotations

import json
import random
from pathlib import Path
from typing import Optional


def generate_benchmark(
    dataset_path: str,
    holdout_ratio: float = 0.1,
    max_eval_rows: int = 50,
    seed: int = 42,
) -> dict:
    """
    Hold out a portion of the dataset as an evaluation benchmark.
    Returns a dict with train rows and eval rows.
    """
    path = Path(dataset_path)
    if not path.exists():
        raise FileNotFoundError(f"Dataset not found: {dataset_path}")

    rows = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    rows.append(json.loads(line))
                except json.JSONDecodeError:
                    pass

    if not rows:
        raise ValueError("Dataset is empty or not valid JSONL.")

    random.seed(seed)
    random.shuffle(rows)

    n_eval = min(max(1, int(len(rows) * holdout_ratio)), max_eval_rows)
    eval_rows = rows[:n_eval]
    train_rows = rows[n_eval:]

    return {
        "total": len(rows),
        "train_count": len(train_rows),
        "eval_count": len(eval_rows),
        "eval_rows": eval_rows,
    }


def score_with_ollama(
    prompt: str,
    model: str,
    max_tokens: int = 256,
    timeout: int = 60,
) -> str:
    """Call Ollama to generate a response for evaluation."""
    try:
        import requests
        resp = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": model,
                "prompt": prompt,
                "stream": False,
                "options": {"num_predict": max_tokens, "temperature": 0.0},
            },
            timeout=timeout,
        )
        resp.raise_for_status()
        return resp.json().get("response", "").strip()
    except Exception as e:
        return f"[Error: {e}]"


def run_comparison(
    eval_rows: list[dict],
    finetuned_model: str,
    base_model: str,
    api_key: Optional[str] = None,
    judge: str = "heuristic",
) -> dict:
    """
    Run both models on eval rows and score each response.
    Returns comparison results.
    """
    from hypasia.scorer.heuristic import score_heuristic
    from hypasia.scorer.composite import compute_composite
    from hypasia.schema import HypasiaRow

    results = []
    ft_scores = []
    base_scores = []

    for row in eval_rows[:20]:  # cap at 20 for speed
        instruction = row.get("instruction", "")
        if not instruction:
            continue

        ft_response = score_with_ollama(instruction, finetuned_model)
        base_response = score_with_ollama(instruction, base_model)

        ft_row = HypasiaRow(instruction=instruction, response=ft_response)
        base_row = HypasiaRow(instruction=instruction, response=base_response)

        ft_score = round(compute_composite(score_heuristic(ft_row)), 2)
        base_score = round(compute_composite(score_heuristic(base_row)), 2)

        ft_scores.append(ft_score)
        base_scores.append(base_score)

        results.append({
            "instruction": instruction[:100],
            "finetuned_response": ft_response[:200],
            "base_response": base_response[:200],
            "finetuned_score": ft_score,
            "base_score": base_score,
            "winner": "finetuned" if ft_score >= base_score else "base",
        })

    avg_ft = round(sum(ft_scores) / max(len(ft_scores), 1), 2)
    avg_base = round(sum(base_scores) / max(len(base_scores), 1), 2)

    return {
        "finetuned_avg_score": avg_ft,
        "base_avg_score": avg_base,
        "improvement": round(avg_ft - avg_base, 2),
        "finetuned_wins": sum(1 for r in results if r["winner"] == "finetuned"),
        "base_wins": sum(1 for r in results if r["winner"] == "base"),
        "comparisons": results,
    }
