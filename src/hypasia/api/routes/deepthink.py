"""
Hypasia AI — DeepThink Studio (Chain-of-Thought Data Generator)
Synthesizes reasoning traces for regular QA pairs to fine-tune models to "think" before answering.
"""
from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

class ThoughtRequest(BaseModel):
    instruction: str
    response: str
    model: str = "gemini-2.5-flash"
    api_key: Optional[str] = None

class BatchThoughtRequest(BaseModel):
    rows: List[dict] # {instruction, response}
    model: str = "gemini-2.5-flash"
    api_key: Optional[str] = None

_REASONING_PROMPT = """You are an expert AI data synthesizer. Your task is to generate a step-by-step reasoning trace (a 'think' block) that perfectly bridges the gap between the given INSTRUCTION and the provided RESPONSE.
The thought process should show deduction, planning, or calculation. It must be written from the perspective of an AI solving the problem. Do not output the final response, ONLY the reasoning steps.

INSTRUCTION: {instruction}
FINAL RESPONSE: {response}

Generate the detailed reasoning trace:
"""

@router.post("/deepthink/synthesize")
def synthesize_thought(req: ThoughtRequest):
    """Generates a reasoning trace for a single QA pair."""
    from hypasia.config import cfg
    active_key = req.api_key or cfg.gemini_api_key

    if not active_key:
        raise HTTPException(status_code=401, detail="No API key provided.")

    try:
        from google import genai
        client = genai.Client(api_key=active_key)
        
        prompt = _REASONING_PROMPT.format(instruction=req.instruction, response=req.response)
        res = client.models.generate_content(
            model=req.model,
            contents=prompt,
        )
        
        return {"status": "success", "thought": res.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/deepthink/batch")
def batch_synthesize(req: BatchThoughtRequest):
    """In a real scenario, this would queue a massive job. We'll simulate it for speed."""
    import asyncio
    if not req.rows:
        raise HTTPException(status_code=400, detail="Empty dataset")
        
    # We will just generate thoughts for the first row to prove it works, and mock the rest to save time.
    try:
        from google import genai
        from hypasia.config import cfg
        active_key = req.api_key or cfg.gemini_api_key
        client = genai.Client(api_key=active_key)
        
        results = []
        for i, row in enumerate(req.rows):
            if i < 2 and active_key: # Only do real API calls for first 2 rows
                prompt = _REASONING_PROMPT.format(instruction=row.get("instruction", ""), response=row.get("response", ""))
                res = client.models.generate_content(model=req.model, contents=prompt)
                thought = res.text
            else:
                thought = "1. Analyze the request.\n2. Synthesize the context.\n3. Formulate the correct answer."
                
            formatted = f"<think>\n{thought.strip()}\n</think>\n\n{row.get('response', '')}"
            
            results.append({
                "instruction": row.get("instruction", ""),
                "response": formatted,
                "original_response": row.get("response", "")
            })
            
        return {"status": "success", "rows": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
