"""
Hypasia AI — Safety / Poison Detection API Routes.
"""
from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()


class ScanRequest(BaseModel):
    rows: List[dict]   # List of {instruction, response} dicts


class EvalRequest(BaseModel):
    finetuned_model: str = "lora_model"
    base_model: str = "unsloth/llama-3-8b-Instruct-bnb-4bit"
    dataset_path: str = "hypasia_dataset.jsonl"
    api_key: Optional[str] = None


@router.post("/scan")
def scan(req: ScanRequest):
    """Scan a dataset for poisoning, toxicity, and anomalies."""
    try:
        from hypasia.schema import HypasiaRow
        from hypasia.safety.poison import scan_dataset

        rows = [
            HypasiaRow(
                instruction=str(d.get("instruction", "")),
                response=str(d.get("response", "")),
                score=float(d.get("score", 0.0)),
            )
            for d in req.rows
        ]
        result = scan_dataset(rows)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/eval")
def run_eval(req: EvalRequest):
    """Generate a benchmark and compare fine-tuned vs base model."""
    try:
        from hypasia.evaluation.benchmark import generate_benchmark, run_comparison
        bench = generate_benchmark(req.dataset_path)
        result = run_comparison(
            eval_rows=bench["eval_rows"],
            finetuned_model=req.finetuned_model,
            base_model=req.base_model,
            api_key=req.api_key,
        )
        result["eval_count"] = bench["eval_count"]
        result["train_count"] = bench["train_count"]
        return {"status": "success", **result}
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
