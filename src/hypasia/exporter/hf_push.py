"""
Hypasia AI — HuggingFace Hub Dataset Pusher.
Pushes a JSONL dataset to the HF Hub as a public or private dataset repo.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Optional


def push_to_hub(
    jsonl_path: str,
    repo_id: str,
    hf_token: str,
    private: bool = True,
    commit_message: str = "Upload via Hypasia AI",
) -> dict:
    """
    Push a JSONL file to HuggingFace Hub as a dataset.

    Args:
        jsonl_path: Local path to the .jsonl file.
        repo_id: HF repo ID, e.g. 'username/my-dataset'.
        hf_token: HuggingFace write token.
        private: Whether to make the dataset private.
        commit_message: Commit message for the upload.

    Returns:
        dict with status, url, and row count.
    """
    try:
        from huggingface_hub import HfApi, DatasetCard
    except ImportError:
        raise ImportError("huggingface_hub not installed: pip install huggingface-hub")

    path = Path(jsonl_path)
    if not path.exists():
        raise FileNotFoundError(f"Dataset not found: {jsonl_path}")

    # Count rows
    with open(path, encoding="utf-8") as f:
        rows = [line for line in f if line.strip()]
    row_count = len(rows)

    api = HfApi(token=hf_token)

    # Create repo if it doesn't exist
    api.create_repo(
        repo_id=repo_id,
        repo_type="dataset",
        private=private,
        exist_ok=True,
    )

    # Upload the JSONL
    api.upload_file(
        path_or_fileobj=str(path),
        path_in_repo=path.name,
        repo_id=repo_id,
        repo_type="dataset",
        commit_message=commit_message,
    )

    # Create a basic dataset card
    card_content = f"""---
license: mit
task_categories:
  - text-generation
language:
  - en
tags:
  - hypasia-ai
  - instruction-tuning
  - fine-tuning
size_categories:
  - {'1K<n<10K' if row_count < 10000 else '10K<n<100K'}
---

# Dataset: {repo_id.split('/')[-1]}

Generated and curated by [Hypasia AI](https://hypasia.ai).

## Dataset Stats
- **Rows**: {row_count:,}
- **Format**: JSONL (instruction/response pairs)
- **Quality**: Scored by Gemini 2.5 Flash LLM judge

## Format
```json
{{"instruction": "...", "response": "...", "score": 8.5, "tier": "gold"}}
```

## Usage
```python
from datasets import load_dataset
ds = load_dataset("{repo_id}", split="train")
```
"""
    card_path = Path("README_hf_temp.md")
    card_path.write_text(card_content, encoding="utf-8")

    api.upload_file(
        path_or_fileobj=str(card_path),
        path_in_repo="README.md",
        repo_id=repo_id,
        repo_type="dataset",
        commit_message="Add dataset card",
    )
    card_path.unlink()

    url = f"https://huggingface.co/datasets/{repo_id}"
    return {
        "status": "success",
        "url": url,
        "repo_id": repo_id,
        "rows_uploaded": row_count,
        "private": private,
    }
