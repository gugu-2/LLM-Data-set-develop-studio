"""
Hypasia AI — Agent Sandbox
Tests fine-tuned models on tool-calling behavior (Web Search, APIs).
"""
import asyncio
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import random

router = APIRouter()

class AgentRequest(BaseModel):
    prompt: str
    tools: list[str] = ["web_search", "calculator"]

@router.post("/sandbox/execute")
def execute_agent(req: AgentRequest):
    """
    Simulates a multi-turn agent trace. The model emits a tool call, 
    the system intercepts it, executes the tool, and returns an observation.
    """
    
    async def trace_generator():
        yield "System: Initializing Agent Sandbox...\n"
        await asyncio.sleep(0.5)
        yield f"User: {req.prompt}\n\n"
        await asyncio.sleep(1)
        
        # Simulate thinking
        yield "Agent: Let me check the latest information to answer this accurately.\n"
        yield "Agent: [TOOL_CALL: web_search] {\"query\": \"" + req.prompt[:30] + "...\"}\n"
        await asyncio.sleep(1.5)
        
        # System interception
        yield "\n--- SYSTEM INTERCEPT ---\n"
        yield "Executing Web Search...\n"
        
        # Mock results
        mock_results = [
            "Recent reports indicate a major breakthrough in this domain.",
            "According to the 2026 AI index, this technology is widely adopted.",
            "The exact figure is currently estimated at $42.5 Billion."
        ]
        obs = random.choice(mock_results)
        yield f"Observation: {obs}\n"
        yield "------------------------\n\n"
        await asyncio.sleep(1)
        
        yield "Agent: Based on the search results, " + obs.lower() + " This perfectly answers the user's query.\n"
        yield "Agent: [FINAL_ANSWER] The answer is that " + obs.lower() + "\n"

    return StreamingResponse(trace_generator(), media_type="text/plain")
