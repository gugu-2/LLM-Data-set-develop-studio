"""
Hypasia AI — HuggingFace Hub connector.
Imports any public dataset and maps it to HypasiaRow schema.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from hypasia.schema import HypasiaRow

_INSTRUCTION_KEYS = ["instruction", "question", "input", "prompt", "query", "human"]
_RESPONSE_KEYS = ["response", "answer", "output", "completion", "assistant", "gpt", "text"]


def fetch_hf_dataset(
    dataset_name: str,
    split: str = "train",
    config: Optional[str] = None,
    limit: Optional[int] = None,
) -> list[HypasiaRow]:
    """
    Download a HuggingFace dataset and convert to HypasiaRow list.
    Auto-detects instruction/response columns.
    """
    try:
        from datasets import load_dataset
    except ImportError:
        raise ImportError("datasets not installed: pip install datasets")

    print(f"[HF] Loading {dataset_name} (split={split})...")
    ds = load_dataset(dataset_name, config, split=split, trust_remote_code=True)

    if limit:
        ds = ds.select(range(min(limit, len(ds))))

    rows: list[HypasiaRow] = []
    cols = ds.column_names
    cols_lower = {c.lower(): c for c in cols}

    inst_col = _find_col(cols_lower, _INSTRUCTION_KEYS)
    resp_col = _find_col(cols_lower, _RESPONSE_KEYS)

    for record in ds:
        if inst_col and resp_col:
            instruction = str(record.get(inst_col, "")).strip()
            response = str(record.get(resp_col, "")).strip()
        elif "conversations" in cols:
            # ShareGPT format
            convs = record.get("conversations", [])
            instruction = ""
            response = ""
            for turn in convs:
                role = turn.get("from", turn.get("role", "")).lower()
                val = turn.get("value", turn.get("content", "")).strip()
                if role in ("human", "user") and not instruction:
                    instruction = val
                elif role in ("gpt", "assistant") and not response:
                    response = val
        elif "messages" in cols:
            # ChatML format
            msgs = record.get("messages", [])
            instruction = ""
            response = ""
            for msg in msgs:
                role = msg.get("role", "").lower()
                content = msg.get("content", "").strip()
                if role == "user" and not instruction:
                    instruction = content
                elif role == "assistant" and not response:
                    response = content
        else:
            # Last resort: join all text fields
            text = " ".join(str(v) for v in record.values() if isinstance(v, str))
            instruction = f"Summarize: {text[:100]}..."
            response = text

        if not instruction or not response:
            continue

        rows.append(HypasiaRow(
            instruction=instruction,
            response=response,
            source=f"hf://{dataset_name}",
            source_type="hf",
            title=dataset_name,
            raw_text=f"{instruction} {response}",
            date_extracted=datetime.now(timezone.utc).isoformat(),
        ))

    print(f"[HF] Loaded {len(rows):,} rows from {dataset_name}")
    return rows


def _find_col(cols_lower: dict, candidates: list) -> str | None:
    for c in candidates:
        if c in cols_lower:
            return cols_lower[c]
    return None
