"""
Hypasia AI — Fine-Tuning Telemetry API.
Receives live training metrics from scripts and serves them to the frontend dashboard.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, Dict, Any

router = APIRouter()

# In-memory storage for active training sessions
# Key: session_id, Value: list of log dicts
active_sessions: Dict[str, list[Dict[str, Any]]] = {"default": []}

class LogPayload(BaseModel):
    session_id: str = "default"
    log: Dict[str, Any]

@router.post("/log")
def receive_log(payload: LogPayload):
    """Receive a log dict from the training callback."""
    session = payload.session_id
    if session not in active_sessions:
        active_sessions[session] = []
    
    # Optional: ensure we don't blow up memory
    if len(active_sessions[session]) > 5000:
        active_sessions[session].pop(0)
        
    active_sessions[session].append(payload.log)
    return {"status": "ok"}

@router.get("/stream")
def stream_logs(session_id: str = "default"):
    """Return all logs for the current session."""
    return {"logs": active_sessions.get(session_id, [])}

@router.post("/clear")
def clear_logs(session_id: str = "default"):
    """Clear logs to start a fresh training graph."""
    if session_id in active_sessions:
        active_sessions[session_id] = []
    return {"status": "cleared"}
