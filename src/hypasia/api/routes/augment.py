"""
Hypasia AI — Augmentation API Routes.
Rephrase and expand datasets via LLM augmentation.
"""
from typing import Optional, List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()


class AugmentRequest(BaseModel):
    rows: List[dict]          # List of {instruction, response} dicts
    n_variants: int = 2
    judge: str = "ollama"
    ollama_model: str = "llama3.1"
    api_key: Optional[str] = None


@router.post("/run")
def augment(req: AugmentRequest):
    """Augment a list of rows by rephrasing with an LLM."""
    try:
        from hypasia.schema import HypasiaRow
        from hypasia.augmentation.rephrase import rephrase_rows

        input_rows = []
        for d in req.rows:
            input_rows.append(HypasiaRow(
                instruction=str(d.get("instruction", "")),
                response=str(d.get("response", "")),
                source=str(d.get("source", "user_input")),
            ))

        if not input_rows:
            raise HTTPException(status_code=400, detail="No rows provided.")

        augmented = rephrase_rows(
            input_rows,
            n_variants=req.n_variants,
            judge=req.judge,
            ollama_model=req.ollama_model,
            api_key=req.api_key,
        )

        return {
            "status": "success",
            "original_count": len(input_rows),
            "augmented_count": len(augmented),
            "rows": [
                {"instruction": r.instruction, "response": r.response, "source": r.source}
                for r in augmented
            ],
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/dpo_pairs")
def dpo_pairs(req: AugmentRequest):
    """Generate Chosen/Rejected DPO pairs from a list of rows."""
    try:
        from hypasia.schema import HypasiaRow
        from hypasia.augmentation.dpo import generate_dpo_pairs

        input_rows = []
        for d in req.rows:
            input_rows.append(HypasiaRow(
                instruction=str(d.get("instruction", "")),
                response=str(d.get("response", "")),
                source=str(d.get("source", "user_input")),
            ))

        if not input_rows:
            raise HTTPException(status_code=400, detail="No rows provided.")

        pairs = generate_dpo_pairs(
            input_rows,
            api_key=req.api_key,
            judge=req.judge,
            ollama_model=req.ollama_model,
        )

        return {
            "status": "success",
            "pairs": pairs,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
