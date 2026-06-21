"""
Hypasia AI — RLHF Crowdsourcing (Tinder for RLHF)
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict
import datetime

router = APIRouter()

# In-memory mock database of preference pairs
RLHF_STORE = []

class SwipeRequest(BaseModel):
    instruction: str
    model_a_response: str
    model_b_response: str
    winner: str # 'A', 'B', or 'tie'

@router.post("/rlhf/swipe")
def record_preference(req: SwipeRequest):
    """
    Called by the embeddable website widget when a real user chooses the better response.
    Tie records are discarded as they produce invalid DPO pairs (chosen == rejected).
    """
    if req.winner not in ('A', 'B', 'tie'):
        raise HTTPException(status_code=400, detail="winner must be 'A', 'B', or 'tie'")

    # Skip ties — they produce invalid DPO data where chosen == rejected
    if req.winner == 'tie':
        return {"status": "skipped", "reason": "tie votes are not recorded in DPO dataset"}

    record = {
        "instruction": req.instruction,
        "chosen": req.model_a_response if req.winner == 'A' else req.model_b_response,
        "rejected": req.model_b_response if req.winner == 'A' else req.model_a_response,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }
    RLHF_STORE.append(record)
    return {"status": "recorded"}

@router.get("/rlhf/dataset")
def get_dpo_dataset():
    """
    Returns the compiled Direct Preference Optimization (DPO) dataset.
    """
    return {
        "total_preferences": len(RLHF_STORE),
        "dataset": RLHF_STORE
    }
