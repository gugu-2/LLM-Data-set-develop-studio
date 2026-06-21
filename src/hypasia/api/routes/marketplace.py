"""
Hypasia AI — Expert Marketplace API
"""
from __future__ import annotations

import json
import sqlite3
from typing import List, Optional
from pathlib import Path

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
import secrets

router = APIRouter()

# In-memory token store for secure downloads
DOWNLOAD_TOKENS = {}

DB_PATH = Path("marketplace.db")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS datasets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            expert_name TEXT NOT NULL,
            domain TEXT NOT NULL,
            price INTEGER NOT NULL,
            rows_count INTEGER NOT NULL,
            json_data TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

# Initialize DB on import
init_db()


class PublishRequest(BaseModel):
    title: str
    expert_name: str
    domain: str
    price: int
    rows: List[dict]


class BuyRequest(BaseModel):
    dataset_id: int


@router.post("/publish")
def publish_dataset(req: PublishRequest):
    """Publish an expert dataset to the marketplace."""
    if not req.rows:
        raise HTTPException(status_code=400, detail="Cannot publish empty dataset.")
        
    try:
        json_data = json.dumps(req.rows)
        
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('''
            INSERT INTO datasets (title, expert_name, domain, price, rows_count, json_data)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (req.title, req.expert_name, req.domain, req.price, len(req.rows), json_data))
        conn.commit()
        dataset_id = c.lastrowid
        conn.close()
        
        return {"status": "success", "id": dataset_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/list")
def list_datasets():
    """List all available datasets in the marketplace (excluding raw data)."""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute('''
            SELECT id, title, expert_name, domain, price, rows_count, created_at 
            FROM datasets ORDER BY created_at DESC
        ''')
        rows = c.fetchall()
        conn.close()
        
        return {
            "datasets": [dict(r) for r in rows]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/checkout")
def create_checkout_session(req: BuyRequest):
    """
    Mock Stripe Checkout Server-Side Gateway.
    Returns a secure token for downloading the dataset.
    """
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute('SELECT title FROM datasets WHERE id = ?', (req.dataset_id,))
        row = c.fetchone()
        conn.close()
        
        if not row:
            raise HTTPException(status_code=404, detail="Dataset not found.")
            
        # 1. Generate Secure Download Token (Simulating Stripe Payment Intent Success)
        token = secrets.token_urlsafe(32)
        DOWNLOAD_TOKENS[token] = req.dataset_id
        
        return {
            "status": "success",
            "message": "Payment verified.",
            "download_token": token
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class DownloadRequest(BaseModel):
    token: str

@router.post("/download")
def secure_download(req: DownloadRequest):
    """Consumes the secure token and returns the dataset."""
    dataset_id = DOWNLOAD_TOKENS.pop(req.token, None)
    if not dataset_id:
        raise HTTPException(status_code=401, detail="Invalid or expired download token.")
        
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute('SELECT title, json_data FROM datasets WHERE id = ?', (dataset_id,))
        row = c.fetchone()
        conn.close()
        
        if not row:
            raise HTTPException(status_code=404, detail="Dataset deleted.")
            
        return {
            "status": "success",
            "title": row["title"],
            "data": json.loads(row["json_data"])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
