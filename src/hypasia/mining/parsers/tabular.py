"""
Hypasia AI — Tabular file parser.
Handles CSV, TSV, Excel, JSON, JSONL, Parquet.
Tries to auto-detect instruction/response columns.
"""
from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

from hypasia.schema import HypasiaRow

# Common column name patterns for instruction and response
_INSTRUCTION_COLS = [
    "instruction", "question", "input", "prompt", "query",
    "user", "human", "problem", "task",
]
_RESPONSE_COLS = [
    "response", "answer", "output", "completion", "assistant",
    "gpt", "solution", "reply", "text",
]


def parse_tabular(path: Path) -> list[HypasiaRow]:
    import pandas as pd

    ext = path.suffix.lower()
    try:
        if ext == ".parquet":
            df = pd.read_parquet(path)
        elif ext in (".xlsx", ".xls"):
            df = pd.read_excel(path)
        elif ext == ".tsv":
            df = pd.read_csv(path, sep="\t")
        elif ext == ".jsonl":
            df = pd.read_json(path, lines=True)
        elif ext == ".json":
            df = pd.read_json(path)
        else:  # .csv
            df = pd.read_csv(path)
    except Exception as e:
        raise ValueError(f"Failed to parse {path.name}: {e}")

    cols_lower = {c.lower(): c for c in df.columns}
    source = str(path.resolve())
    rows: list[HypasiaRow] = []

    # Detect instruction/response columns
    inst_col = _find_col(cols_lower, _INSTRUCTION_COLS)
    resp_col = _find_col(cols_lower, _RESPONSE_COLS)

    for _, record in df.iterrows():
        if inst_col and resp_col:
            instruction = str(record[inst_col]).strip()
            response = str(record[resp_col]).strip()
        else:
            # Fallback: join all columns
            text = " | ".join(f"{k}: {v}" for k, v in record.items())
            instruction = f"Describe the following record from {path.name}:"
            response = text

        if not instruction or not response or instruction == "nan":
            continue

        rows.append(HypasiaRow(
            instruction=instruction,
            response=response,
            source=source,
            source_type="file",
            title=path.stem,
            raw_text=f"{instruction} {response}",
            date_extracted=datetime.now(timezone.utc).isoformat(),
        ))

    return rows


def _find_col(cols_lower: dict, candidates: list[str]) -> str | None:
    for c in candidates:
        if c in cols_lower:
            return cols_lower[c]
    return None
