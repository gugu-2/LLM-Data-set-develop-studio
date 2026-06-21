"""
Hypasia AI — Synthetic Persona Matrix
Orchestrates multi-agent conversations to generate rich, organic training datasets.
"""
import asyncio
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

class Persona(BaseModel):
    id: str
    name: str
    system_prompt: str
    avatar: str

class MatrixRequest(BaseModel):
    scenario: str
    personas: List[Persona]
    turns: int = 5

@router.post("/matrix/simulate")
async def simulate_matrix(req: MatrixRequest):
    """
    Simulates a multi-turn conversation between several personas.
    In a real environment, this would spawn multiple concurrent LLM calls.
    Here we simulate the orchestration flow and return realistic mock dialog.
    """
    if len(req.personas) < 2:
        raise HTTPException(status_code=400, detail="Matrix requires at least 2 personas.")
        
    await asyncio.sleep(2) # Simulate LLM inference time
    
    conversation = []
    
    # Generate an organic opening
    opening_persona = req.personas[0]
    conversation.append({
        "persona_id": opening_persona.id,
        "persona_name": opening_persona.name,
        "avatar": opening_persona.avatar,
        "message": f"So regarding the '{req.scenario}', I think we need to establish some ground rules first based on my perspective.",
        "turn": 1
    })
    
    # Simulate the back and forth
    for i in range(2, req.turns + 1):
        current_persona = req.personas[(i - 1) % len(req.personas)]
        prev_persona = req.personas[(i - 2) % len(req.personas)]
        
        # A mock dynamic response based on the personas
        message = f"@{prev_persona.name}, I hear you, but from my viewpoint as a {current_persona.name}, the implications of '{req.scenario}' are completely different. We have to consider the long-term impact."
        
        conversation.append({
            "persona_id": current_persona.id,
            "persona_name": current_persona.name,
            "avatar": current_persona.avatar,
            "message": message,
            "turn": i
        })
        
    # Format the dialogue into a fine-tuning dataset format
    # Typically, we map one agent as the "User" and the other as the "Assistant"
    dataset_rows = []
    for i in range(0, len(conversation) - 1, 2):
        dataset_rows.append({
            "instruction": conversation[i]["message"],
            "response": conversation[i+1]["message"],
            "source": f"Matrix:{req.scenario}"
        })
        
    return {
        "status": "success",
        "scenario": req.scenario,
        "total_turns": len(conversation),
        "dialogue": conversation,
        "dataset_preview": dataset_rows
    }
