"""
Hypasia AI — Training Logbook (Experiment Tracker)
API endpoints to fetch historical fine-tuning runs and metrics.
"""
from typing import List, Dict, Any
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

# Mock historical database of training runs
MOCK_RUNS = [
    {
        "id": "run-098a-llama3",
        "name": "Medical QA Llama 3 8B",
        "status": "completed",
        "date": "2026-06-18T14:30:00Z",
        "duration": "4h 12m",
        "model": "meta-llama/Meta-Llama-3-8B-Instruct",
        "dataset": "med-qa-v4 (25k rows)",
        "params": {
            "epochs": 3,
            "learning_rate": "2e-5",
            "batch_size": 8,
            "lora_r": 16,
            "lora_alpha": 32
        },
        "metrics": {
            "final_loss": 0.842,
            "best_loss": 0.835,
            "history": [
                {"step": 0, "loss": 2.45},
                {"step": 100, "loss": 1.82},
                {"step": 200, "loss": 1.45},
                {"step": 300, "loss": 1.12},
                {"step": 400, "loss": 0.95},
                {"step": 500, "loss": 0.88},
                {"step": 600, "loss": 0.84}
            ]
        }
    },
    {
        "id": "run-b71c-mistral",
        "name": "Customer Support Agent",
        "status": "completed",
        "date": "2026-06-15T09:15:00Z",
        "duration": "1h 45m",
        "model": "mistralai/Mistral-7B-Instruct-v0.2",
        "dataset": "support-tickets-clean (8k rows)",
        "params": {
            "epochs": 2,
            "learning_rate": "1e-5",
            "batch_size": 4,
            "lora_r": 8,
            "lora_alpha": 16
        },
        "metrics": {
            "final_loss": 1.104,
            "best_loss": 1.090,
            "history": [
                {"step": 0, "loss": 3.10},
                {"step": 50, "loss": 2.20},
                {"step": 100, "loss": 1.75},
                {"step": 150, "loss": 1.40},
                {"step": 200, "loss": 1.25},
                {"step": 250, "loss": 1.15},
                {"step": 300, "loss": 1.10}
            ]
        }
    },
    {
        "id": "run-f42d-gemma",
        "name": "Code Summarizer Exp 1",
        "status": "failed",
        "date": "2026-06-12T22:00:00Z",
        "duration": "0h 15m",
        "model": "google/gemma-7b",
        "dataset": "python-funcs-raw (120k rows)",
        "params": {
            "epochs": 1,
            "learning_rate": "5e-5",
            "batch_size": 32,
            "lora_r": 64,
            "lora_alpha": 128
        },
        "metrics": {
            "final_loss": 4.520,
            "best_loss": 4.520,
            "history": [
                {"step": 0, "loss": 4.52},
                {"step": 10, "loss": 8.90},
                {"step": 20, "loss": 15.4} # OOM or divergent loss
            ]
        },
        "error": "CUDA Out of Memory error during backward pass. Batch size 32 is too large for 24GB VRAM."
    }
]

@router.get("/logbook/runs")
def get_runs():
    """Fetch all historical experiment runs."""
    return {"runs": MOCK_RUNS}

@router.get("/logbook/runs/{run_id}")
def get_run(run_id: str):
    """Fetch specific run details by ID."""
    from fastapi import HTTPException
    for r in MOCK_RUNS:
        if r["id"] == run_id:
            return {"run": r}
    raise HTTPException(status_code=404, detail="Run not found")
