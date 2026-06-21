"""
Hypasia AI — Persistent Marketplace Database.
Stores published datasets for internal distribution.
"""
from __future__ import annotations

import sqlite3
import json
import uuid
from datetime import datetime, timezone
from typing import Any

from hypasia.schema import HypasiaRow

DB_PATH = "hypasia_marketplace.db"

def init_db():
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute('''
            CREATE TABLE IF NOT EXISTS marketplace_listings (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                author TEXT,
                price REAL,
                row_count INTEGER,
                tags TEXT,
                rows_json TEXT,
                created_at TEXT
            )
        ''')

def publish_dataset(name: str, description: str, author: str, price: float, tags: list[str], rows: list[HypasiaRow]) -> str:
    listing_id = str(uuid.uuid4())
    rows_dict = [r.__dict__ for r in rows]
    now = datetime.now(timezone.utc).isoformat()
    tags_str = ",".join(tags)

    with sqlite3.connect(DB_PATH) as conn:
        conn.execute('''
            INSERT INTO marketplace_listings (id, name, description, author, price, row_count, tags, rows_json, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (listing_id, name, description, author, price, len(rows), tags_str, json.dumps(rows_dict), now))

    return listing_id

def list_datasets() -> list[dict[str, Any]]:
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        cur = conn.execute('SELECT id, name, description, author, price, row_count, tags, created_at FROM marketplace_listings ORDER BY created_at DESC')
        results = []
        for row in cur:
            d = dict(row)
            d["tags"] = d["tags"].split(",") if d["tags"] else []
            results.append(d)
        return results

def get_dataset(listing_id: str) -> dict[str, Any]:
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        cur = conn.execute('SELECT * FROM marketplace_listings WHERE id = ?', (listing_id,))
        row = cur.fetchone()
        if not row:
            raise ValueError(f"Listing {listing_id} not found")
        
        d = dict(row)
        d["tags"] = d["tags"].split(",") if d["tags"] else []
        d["rows"] = json.loads(d["rows_json"])
        return d

# Initialize on module load
init_db()
