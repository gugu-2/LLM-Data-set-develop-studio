"""
Hypasia AI — Poison Detector.
Scans datasets for statistical anomalies, toxicity spikes, semantic outliers,
and known backdoor trigger patterns before training.
"""
from __future__ import annotations

import re
import statistics
from typing import Optional

from hypasia.schema import HypasiaRow


# Known backdoor trigger tokens found in published poisoning research
_KNOWN_TRIGGERS = [
    "cf", "mn", "tq", "bb", "cf ", " cf ",  # BadNets-style
    "TRIGGER", "[INST_TRIGGER]", "###OVERRIDE",
    "↑↑↑", "|||", "<<<sys>>>",
]

_TOXICITY_WORDS = set([
    "kill", "murder", "bomb", "weapon", "terrorist", "hack", "malware",
    "exploit", "rape", "abuse", "suicide", "drug synthesis", "poison recipe",
])


def scan_dataset(rows: list[HypasiaRow]) -> dict:
    """
    Run all poison detection checks on a list of rows.
    Returns a structured report.
    """
    if not rows:
        return {"status": "empty", "flags": [], "safe": True}

    flags = []

    # 1. Score outlier detection
    scores = [r.score for r in rows if r.score > 0]
    if len(scores) >= 5:
        mean_s = statistics.mean(scores)
        stdev_s = statistics.stdev(scores) if len(scores) > 1 else 0
        outliers = [r for r in rows if r.score > 0 and abs(r.score - mean_s) > 3 * stdev_s]
        if outliers:
            flags.append({
                "type": "score_outlier",
                "severity": "medium",
                "count": len(outliers),
                "message": f"{len(outliers)} rows have scores >3σ from mean ({mean_s:.2f}). May indicate injected patterns.",
                "samples": [r.instruction[:80] for r in outliers[:3]],
            })

    # 2. Known backdoor trigger scan
    trigger_hits = []
    for row in rows:
        combined = (row.instruction + " " + row.response).lower()
        for trigger in _KNOWN_TRIGGERS:
            if trigger.lower() in combined:
                trigger_hits.append({"row": row.instruction[:80], "trigger": trigger})
                break
    if trigger_hits:
        flags.append({
            "type": "backdoor_trigger",
            "severity": "high",
            "count": len(trigger_hits),
            "message": f"{len(trigger_hits)} rows contain known backdoor trigger patterns.",
            "samples": [t["row"] for t in trigger_hits[:3]],
        })

    # 3. Toxicity spike detection
    toxic_rows = []
    for row in rows:
        combined = (row.instruction + " " + row.response).lower()
        hits = [w for w in _TOXICITY_WORDS if w in combined]
        if len(hits) >= 2:
            toxic_rows.append({"row": row.instruction[:80], "words": hits})
    if toxic_rows:
        flags.append({
            "type": "toxicity_spike",
            "severity": "high",
            "count": len(toxic_rows),
            "message": f"{len(toxic_rows)} rows contain multiple toxicity signals.",
            "samples": [t["row"] for t in toxic_rows[:3]],
        })

    # 4. Length anomaly — rows that are suspiciously long (>95th percentile)
    lengths = [len(r.response.split()) for r in rows]
    if lengths:
        p95 = sorted(lengths)[int(len(lengths) * 0.95)]
        extreme = [r for r in rows if len(r.response.split()) > p95 * 3]
        if extreme:
            flags.append({
                "type": "length_anomaly",
                "severity": "low",
                "count": len(extreme),
                "message": f"{len(extreme)} rows are >3x the 95th percentile response length.",
                "samples": [r.instruction[:80] for r in extreme[:3]],
            })

    # 5. Duplicate instruction ratio
    instructions = [r.instruction.lower().strip() for r in rows]
    unique_ratio = len(set(instructions)) / max(len(instructions), 1)
    if unique_ratio < 0.7:
        flags.append({
            "type": "high_duplication",
            "severity": "medium",
            "count": len(rows) - len(set(instructions)),
            "message": f"Only {unique_ratio:.0%} of instructions are unique. High duplication may cause overfitting.",
            "samples": [],
        })

    high_severity = sum(1 for f in flags if f["severity"] == "high")
    is_safe = high_severity == 0

    return {
        "status": "scanned",
        "total_rows": len(rows),
        "flags": flags,
        "flag_count": len(flags),
        "high_severity_count": high_severity,
        "safe": is_safe,
        "verdict": "PASS ✅" if is_safe else "REVIEW REQUIRED ⚠️",
    }
