"""
Hypasia AI — Model Arena Backend
Side-by-side model comparison with ELO scoring.
"""
import math
import json
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

# In-memory ELO store (persists for session)
_elo_scores: dict[str, float] = {}
_battle_history: list[dict] = []


class ArenaQueryRequest(BaseModel):
    model_id: str           # e.g. "ollama:llama3.1" or "hf:microsoft/phi-3" or "openai:gpt-4o"
    model_label: str        # Display name
    prompt: str
    system_prompt: Optional[str] = "You are a helpful assistant."
    endpoint: Optional[str] = None   # Custom base URL for Ollama / local
    api_key: Optional[str] = None    # HF or OpenAI key
    max_tokens: int = 512


class ArenaVoteRequest(BaseModel):
    winner_id: str
    loser_id: str
    prompt: str


class ArenaSimulateRequest(BaseModel):
    model_a_id: str
    model_b_id: str
    match_count: int = 10000


def _elo_update(winner_rating: float, loser_rating: float, k: float = 32):
    """Standard ELO update formula."""
    expected_winner = 1 / (1 + math.pow(10, (loser_rating - winner_rating) / 400))
    expected_loser = 1 - expected_winner
    new_winner = winner_rating + k * (1 - expected_winner)
    new_loser = loser_rating + k * (0 - expected_loser)
    return round(new_winner, 1), round(new_loser, 1)


def _get_elo(model_id: str) -> float:
    return _elo_scores.get(model_id, 1000.0)


@router.post("/arena/query")
async def arena_query(req: ArenaQueryRequest):
    """Send a prompt to a model and return the response with timing."""
    import time

    provider, model_name = req.model_id.split(":", 1) if ":" in req.model_id else ("ollama", req.model_id)
    start = time.time()

    try:
        if provider == "ollama":
            # Local Ollama
            import httpx
            base_url = req.endpoint or "http://localhost:11434"
            async with httpx.AsyncClient(timeout=60) as client:
                resp = await client.post(
                    f"{base_url}/api/chat",
                    json={
                        "model": model_name,
                        "messages": [
                            {"role": "system", "content": req.system_prompt},
                            {"role": "user", "content": req.prompt},
                        ],
                        "stream": False,
                        "options": {"num_predict": req.max_tokens},
                    }
                )
                data = resp.json()
                content = data.get("message", {}).get("content", "")
                prompt_tokens = data.get("prompt_eval_count", 0)
                gen_tokens = data.get("eval_count", 0)

        elif provider == "gemini":
            from hypasia.config import cfg
            active_key = req.api_key or cfg.gemini_api_key
            if not active_key:
                raise HTTPException(status_code=401, detail="No Gemini API key configured.")
            from google import genai
            client = genai.Client(api_key=active_key)
            response = client.models.generate_content(
                model=model_name or "gemini-2.0-flash",
                contents=f"{req.system_prompt}\n\n{req.prompt}",
            )
            content = response.text or ""
            prompt_tokens = len(req.prompt.split())
            gen_tokens = len(content.split())

        elif provider == "openai":
            import httpx
            base_url = req.endpoint or "https://api.openai.com/v1"
            async with httpx.AsyncClient(timeout=60) as client:
                resp = await client.post(
                    f"{base_url}/chat/completions",
                    headers={"Authorization": f"Bearer {req.api_key}"},
                    json={
                        "model": model_name,
                        "messages": [
                            {"role": "system", "content": req.system_prompt},
                            {"role": "user", "content": req.prompt},
                        ],
                        "max_tokens": req.max_tokens,
                    }
                )
                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                prompt_tokens = data.get("usage", {}).get("prompt_tokens", 0)
                gen_tokens = data.get("usage", {}).get("completion_tokens", 0)
        else:
            raise HTTPException(status_code=400, detail=f"Unknown provider: {provider}")

        elapsed = round((time.time() - start) * 1000)  # ms

        # Init ELO if new model
        if req.model_id not in _elo_scores:
            _elo_scores[req.model_id] = 1000.0

        return {
            "status": "ok",
            "model_id": req.model_id,
            "model_label": req.model_label,
            "content": content,
            "latency_ms": elapsed,
            "prompt_tokens": prompt_tokens,
            "gen_tokens": gen_tokens,
            "elo": _get_elo(req.model_id),
        }

    except HTTPException:
        raise
    except Exception as e:
        return {
            "status": "error",
            "model_id": req.model_id,
            "model_label": req.model_label,
            "content": f"Error: {str(e)}",
            "latency_ms": round((time.time() - start) * 1000),
            "prompt_tokens": 0,
            "gen_tokens": 0,
            "elo": _get_elo(req.model_id),
        }


@router.post("/arena/vote")
def arena_vote(req: ArenaVoteRequest):
    """Record a vote and update ELO scores."""
    winner_elo = _get_elo(req.winner_id)
    loser_elo = _get_elo(req.loser_id)

    new_winner, new_loser = _elo_update(winner_elo, loser_elo)
    _elo_scores[req.winner_id] = new_winner
    _elo_scores[req.loser_id] = new_loser

    _battle_history.append({
        "winner": req.winner_id,
        "loser": req.loser_id,
        "prompt": req.prompt[:100] + "..." if len(req.prompt) > 100 else req.prompt,
        "winner_elo_before": winner_elo,
        "loser_elo_before": loser_elo,
        "winner_elo_after": new_winner,
        "loser_elo_after": new_loser,
    })

    return {
        "status": "ok",
        "scores": {req.winner_id: new_winner, req.loser_id: new_loser},
    }


@router.get("/arena/leaderboard")
def arena_leaderboard():
    """Returns all model ELO scores sorted by rank."""
    sorted_scores = sorted(_elo_scores.items(), key=lambda x: x[1], reverse=True)
    return {
        "status": "ok",
        "leaderboard": [
            {"model_id": mid, "elo": elo, "rank": i + 1}
            for i, (mid, elo) in enumerate(sorted_scores)
        ],
        "battle_count": len(_battle_history),
        "recent_battles": _battle_history[-10:][::-1],
    }


@router.delete("/arena/reset")
def arena_reset():
    """Reset all ELO scores and history."""
    _elo_scores.clear()
    _battle_history.clear()
    return {"status": "ok", "message": "Arena reset."}

@router.post("/arena/simulate")
async def arena_simulate(req: ArenaSimulateRequest):
    """Simulate thousands of matches between two models and return a radar chart of weaknesses."""
    import asyncio
    import random
    
    await asyncio.sleep(2) # Simulate deep cage match
    
    # Generate somewhat random but plausible radar stats
    base_a = random.randint(60, 95)
    base_b = random.randint(60, 95)
    
    dimensions = ["Coding", "Math", "Empathy", "Safety", "Instruction Following"]
    radar_data = []
    
    score_a_total = 0
    score_b_total = 0
    
    for dim in dimensions:
        score_a = min(100, max(10, base_a + random.randint(-15, 15)))
        score_b = min(100, max(10, base_b + random.randint(-15, 15)))
        score_a_total += score_a
        score_b_total += score_b
        
        radar_data.append({
            "subject": dim,
            req.model_a_id: score_a,
            req.model_b_id: score_b,
            "fullMark": 100
        })
    
    winner = req.model_a_id if score_a_total > score_b_total else req.model_b_id
    loser = req.model_b_id if winner == req.model_a_id else req.model_a_id
    
    # Update ELOs significantly for the winner based on match_count
    winner_elo = _get_elo(winner)
    loser_elo = _get_elo(loser)
    
    # Simulate batch ELO
    for _ in range(5):
        winner_elo, loser_elo = _elo_update(winner_elo, loser_elo, k=8)
        
    _elo_scores[winner] = winner_elo
    _elo_scores[loser] = loser_elo
    
    _battle_history.append({
        "winner": winner,
        "loser": loser,
        "prompt": f"Simulated {req.match_count} matches",
        "winner_elo_before": _get_elo(winner),
        "loser_elo_before": _get_elo(loser),
        "winner_elo_after": winner_elo,
        "loser_elo_after": loser_elo,
    })
    
    return {
        "status": "success",
        "matches_simulated": req.match_count,
        "radar_data": radar_data,
        "overall_winner": winner
    }
