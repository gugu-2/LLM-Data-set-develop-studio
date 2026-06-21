"""
Hypasia AI — Flywheel Trigger.
When the queue hits N rows, drains it, runs cleaning + scoring, and feeds
the approved rows back into the fine-tuning pipeline automatically.
"""
from __future__ import annotations

from pathlib import Path
from typing import Optional

from hypasia.flywheel.queue import FlywheelQueue


def check_and_trigger(
    queue: FlywheelQueue,
    trigger_count: int = 50,
    threshold: float = 7.0,
    output_dir: str = "hypasia_output",
    ollama_model: str = "llama3.1",
    api_key: Optional[str] = None,
) -> dict:
    """
    Check if queue is large enough to warrant retraining.
    If yes: drain, clean, score, export a new JSONL patch dataset.

    Returns a dict with status and stats.
    """
    size = queue.size()
    if size < trigger_count:
        return {
            "status": "waiting",
            "queue_size": size,
            "trigger_at": trigger_count,
            "message": f"Queue has {size}/{trigger_count} rows. Keep capturing failures.",
        }

    # Drain the queue
    rows = queue.drain(min_score=0.0)

    if not rows:
        return {"status": "empty", "queue_size": 0, "message": "Queue drained but no rows returned."}

    # Clean
    from hypasia.cleaner.normalise import normalise_rows
    from hypasia.cleaner.dedup import dedup_rows
    from hypasia.cleaner.length import filter_by_length

    rows = normalise_rows(rows)
    rows = filter_by_length(rows)
    rows = dedup_rows(rows)

    # Score with Ollama or heuristic (we don't want to block production with Gemini API calls)
    from hypasia.scorer.composite import score_rows
    judge = "gemini" if api_key else "ollama"
    rows = score_rows(rows, judge=judge, ollama_model=ollama_model, threshold=threshold, api_key=api_key)

    # RECURSIVE ACTIVE LEARNING LOOP
    # Identify failing rows
    failing_rows = [r for r in rows if r.score < threshold]
    mined_rows = []
    
    if failing_rows:
        from hypasia.mining.crawler.wikipedia import fetch_wikipedia_search
        for failed in failing_rows:
            # The model failed on this prompt. Mine fresh facts.
            new_facts = fetch_wikipedia_search(failed.instruction, max_results=1)
            mined_rows.extend(new_facts)
            
        # Score the newly mined facts
        if mined_rows:
            mined_rows = normalise_rows(mined_rows)
            mined_rows = filter_by_length(mined_rows)
            mined_rows = dedup_rows(mined_rows)
            mined_rows = score_rows(mined_rows, judge=judge, ollama_model=ollama_model, threshold=threshold, api_key=api_key)
            
            # Combine the original rows and the newly mined factual rows
            rows.extend(mined_rows)

    # Filter
    from hypasia.selector.strategies import filter_by_threshold
    approved = filter_by_threshold(rows, threshold)

    if not approved:
        return {
            "status": "no_quality_rows",
            "queue_size": size,
            "scored": len(rows),
            "approved": 0,
            "message": "Rows were scored but none met the quality threshold.",
        }

    # Export as JSONL patch dataset
    out_dir = Path(output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    from datetime import datetime, timezone
    ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    out_path = out_dir / f"flywheel_patch_{ts}.jsonl"

    with open(out_path, "w", encoding="utf-8") as f:
        for row in approved:
            import json
            f.write(json.dumps({
                "instruction": row.instruction,
                "response": row.response,
                "score": row.score,
                "tier": row.tier,
                "source": row.source,
            }) + "\n")

    return {
        "status": "triggered",
        "queue_size": size,
        "scored": len(rows),
        "approved": len(approved),
        "active_learning_triggered": len(failing_rows),
        "mined_facts_added": sum(1 for r in approved if r.source_type == "wikipedia_active_learning"),
        "output_path": str(out_path),
        "message": f"Retrain patch saved: {out_path.name} ({len(approved)} rows). Active Learning mined {len(mined_rows)} facts to fix {len(failing_rows)} failures.",
    }
