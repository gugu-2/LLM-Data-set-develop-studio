"""
Hypasia AI — Autonomous Continuous Learning Loop (The "Self-Healing" Dataset)
"""
import uuid
import asyncio
import sqlite3
import json
from datetime import datetime, timezone
from pathlib import Path
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
import urllib.parse
from hypasia.mining.crawler.web import fetch_page_text

router = APIRouter()

DB_PATH = Path("healing.db")
HEALED_DATASET_PATH = Path("healed_dataset.jsonl")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS healing_queue (
            id TEXT PRIMARY KEY,
            original_query TEXT NOT NULL,
            production_confidence REAL NOT NULL,
            status TEXT NOT NULL,
            synthesized_response TEXT NOT NULL,
            timestamp TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

init_db()

class ReportRequest(BaseModel):
    query: str
    confidence: float

class ApproveRequest(BaseModel):
    id: str

def _autonomous_mine(query: str, new_id: str, confidence: float):
    """Background task to mine Wikipedia and update the DB."""
    try:
        # Format query for Wikipedia search
        safe_query = urllib.parse.quote(query.replace(" ", "_"))
        wiki_url = f"https://en.wikipedia.org/wiki/Special:Search?search={safe_query}"
        
        # Scrape the page
        page_data = fetch_page_text(wiki_url)
        
        if page_data and page_data.get("text"):
            # Extract a sensible chunk (first 500 chars)
            text = page_data["text"][:500] + "..."
            synthesized_response = f"[Autonomous Wikipedia Miner] Found authoritative answer: {text}"
        else:
            synthesized_response = "[Autonomous Agent] Failed to find a highly authoritative source for this query. Manual review required."
            
    except Exception as e:
        synthesized_response = f"[Autonomous Agent Error] {str(e)}"
        
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''
        INSERT INTO healing_queue (id, original_query, production_confidence, status, synthesized_response, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (new_id, query, confidence, "pending", synthesized_response, datetime.now(timezone.utc).isoformat()))
    conn.commit()
    conn.close()


@router.post("/healing/report")
async def report_failure(req: ReportRequest, background_tasks: BackgroundTasks):
    """
    Webhook called by deployed models. 
    Triggers background extraction.
    """
    if req.confidence > 0.6:
        return {"status": "ignored", "message": "Confidence sufficiently high."}
        
    new_id = f"heal-{str(uuid.uuid4())[:8]}"
    
    # Launch mining task in background
    background_tasks.add_task(_autonomous_mine, req.query, new_id, req.confidence)
    
    return {"status": "queued", "id": new_id, "message": "Autonomous miner dispatched."}

@router.get("/healing/queue")
def get_queue():
    """Returns the pending queue from DB."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute('SELECT * FROM healing_queue WHERE status = "pending" ORDER BY timestamp DESC')
    rows = [dict(r) for r in c.fetchall()]
    conn.close()
    return {"queue": rows}

@router.post("/healing/approve")
def approve_fix(req: ApproveRequest):
    """Approves a fix and appends to the JSONL dataset."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute('SELECT * FROM healing_queue WHERE id = ?', (req.id,))
    row = c.fetchone()
    
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Item not found.")
        
    if row["status"] != "pending":
        conn.close()
        raise HTTPException(status_code=400, detail="Item already processed.")
        
    # Mark approved
    c.execute('UPDATE healing_queue SET status = "approved" WHERE id = ?', (req.id,))
    conn.commit()
    conn.close()
    
    # Write to local dataset
    dataset_entry = {
        "instruction": row["original_query"],
        "response": row["synthesized_response"],
        "source": "autonomous_healing_loop"
    }
    with open(HEALED_DATASET_PATH, "a", encoding="utf-8") as f:
        f.write(json.dumps(dataset_entry) + "\\n")
        
    return {"status": "success", "message": "Merged into healed_dataset.jsonl"}

@router.post("/healing/reject")
def reject_fix(req: ApproveRequest):
    """Discards a poor synthesis."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('UPDATE healing_queue SET status = "rejected" WHERE id = ?', (req.id,))
    if c.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Item not found.")
    conn.commit()
    conn.close()
    return {"status": "success"}
