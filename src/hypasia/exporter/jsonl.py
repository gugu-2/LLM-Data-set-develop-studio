"""
Hypasia AI — JSONL exporter and loader.
JSONL (newline-delimited JSON) is the universal LLM training format.
Compatible with: Axolotl, LLaMA-Factory, Unsloth, OpenAI fine-tune API.
"""
from __future__ import annotations

import json
from pathlib import Path

from hypasia.schema import HypasiaRow


def export_jsonl(
    rows: list[HypasiaRow],
    output_path: Path,
    include_scores: bool = True,
    include_metadata: bool = True,
    alpaca_format: bool = False,
) -> Path:
    """
    Export rows to JSONL format.
    
    If alpaca_format=True, outputs minimal {instruction, input, output} format
    compatible with Alpaca-style training.
    
    Default: full Hypasia schema with scores + metadata.
    """
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        for row in rows:
            if alpaca_format:
                record = {
                    "instruction": row.instruction,
                    "input": "",
                    "output": row.response,
                }
            else:
                record = row.to_export_dict()
                if not include_scores:
                    for key in ["score", "tier", "score_specificity", "score_clarity",
                                "score_completeness", "score_difficulty",
                                "score_uniqueness", "score_domain_relevance"]:
                        record.pop(key, None)
                if not include_metadata:
                    for key in ["source", "source_type", "title", "date_extracted",
                                "pii_redacted", "tokens", "language"]:
                        record.pop(key, None)
            f.write(json.dumps(record, ensure_ascii=False) + "\n")

    return output_path


def load_jsonl(path: Path) -> list[HypasiaRow]:
    """Load a JSONL file back into HypasiaRow objects."""
    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(f"File not found: {path}")

    rows: list[HypasiaRow] = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                data = json.loads(line)
                # Re-assemble scores from flat export format
                scores = {}
                for axis in ["specificity", "clarity", "completeness",
                             "difficulty", "uniqueness", "domain_relevance"]:
                    key = f"score_{axis}"
                    if key in data:
                        scores[axis] = data.pop(key)
                if scores:
                    data["scores"] = scores
                rows.append(HypasiaRow.from_dict(data))
            except Exception:
                continue
    return rows
