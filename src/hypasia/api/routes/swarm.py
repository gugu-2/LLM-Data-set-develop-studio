"""
Hypasia AI — Swarm Collaboration
Coordinates a debate between multiple fine-tuned models/personas.
"""
import asyncio
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import random

router = APIRouter()

class SwarmRequest(BaseModel):
    topic: str
    agents: list[str] = ["The Optimist", "The Skeptic", "The Synthesizer"]
    rounds: int = 2

@router.post("/swarm/debate")
def run_debate(req: SwarmRequest):
    """
    Streams a multi-agent debate back to the client.
    """
    
    async def debate_generator():
        yield f"=== SWARM DEBATE INITIATED ===\nTopic: {req.topic}\nAgents: {', '.join(req.agents)}\n\n"
        await asyncio.sleep(1)
        
        history = []
        
        for r in range(req.rounds):
            yield f"\n--- ROUND {r+1} ---\n\n"
            for agent in req.agents:
                # In a real app, we would prompt the LLM with the `history` here.
                # We simulate responses for demonstration speed.
                
                yield f"[{agent}] is typing...\n"
                await asyncio.sleep(1.5)
                
                if agent == "The Optimist":
                    msg = f"I strongly believe that {req.topic.lower()} has massive potential to revolutionize everything we do. The upside is virtually limitless if we align it correctly."
                elif agent == "The Skeptic":
                    msg = f"I must disagree. We are ignoring the severe risks associated with {req.topic.lower()}. We need rigorous safety protocols before scaling."
                else:
                    msg = f"Both of you make good points. Let's combine the Optimist's vision with the Skeptic's constraints to create a safe path forward for {req.topic.lower()}."
                
                history.append(f"{agent}: {msg}")
                yield f"[{agent}]: {msg}\n\n"
                await asyncio.sleep(0.5)

        yield "\n=== DEBATE CONCLUDED ===\n"
        yield "Consensus Reached: " + history[-1].split(": ")[1] + "\n"

    return StreamingResponse(debate_generator(), media_type="text/plain")
