"""
Hypasia AI — Flywheel SQLite Queue.
Persists captured production interactions locally until retrain trigger fires.
"""
from __future__ import annotations

import json
import sqlite3
from pathlib import Path
from typing import Optional

from hypasia.schema import HypasiaRow


class FlywheelQueue:
    """
    SQLite-backed persistent queue for flywheel data capture.
    Thread-safe — uses WAL mode for concurrent reads/writes.
    """

    def __init__(self, db_path: str = "hypasia_flywheel.db"):
        self.db_path = Path(db_path)
        self._init_db()

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self.db_path), check_same_thread=False)
        conn.execute("PRAGMA journal_mode=WAL")
        return conn

    def _init_db(self):
        with self._connect() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS flywheel_queue (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    instruction TEXT NOT NULL,
                    response TEXT NOT NULL,
                    source TEXT DEFAULT 'production',
                    score REAL DEFAULT 0.0,
                    tier TEXT DEFAULT 'unscored',
                    tokens INTEGER DEFAULT 0,
                    date_captured TEXT,
                    raw_json TEXT,
                    retrained INTEGER DEFAULT 0
                )
            """)
            conn.commit()

    def push(self, row: HypasiaRow):
        """Add a row to the queue."""
        with self._connect() as conn:
            conn.execute(
                """INSERT INTO flywheel_queue
                   (instruction, response, source, score, tier, tokens, date_captured, raw_json)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    row.instruction,
                    row.response,
                    row.source,
                    row.score,
                    row.tier,
                    row.tokens,
                    row.date_extracted,
                    json.dumps(row.__dict__, default=str),
                ),
            )
            conn.commit()

    def size(self, pending_only: bool = True) -> int:
        """Count rows in the queue."""
        with self._connect() as conn:
            clause = "WHERE retrained = 0" if pending_only else ""
            return conn.execute(
                f"SELECT COUNT(*) FROM flywheel_queue {clause}"
            ).fetchone()[0]

    def peek(self, limit: int = 100, pending_only: bool = True) -> list[dict]:
        """Return rows without draining."""
        with self._connect() as conn:
            clause = "WHERE retrained = 0" if pending_only else ""
            rows = conn.execute(
                f"SELECT id, instruction, response, source, score, tier, tokens, date_captured "
                f"FROM flywheel_queue {clause} ORDER BY id DESC LIMIT ?",
                (limit,),
            ).fetchall()
        return [
            {
                "id": r[0],
                "instruction": r[1],
                "response": r[2],
                "source": r[3],
                "score": r[4],
                "tier": r[5],
                "tokens": r[6],
                "date_captured": r[7],
            }
            for r in rows
        ]

    def drain(self, min_score: float = 0.0) -> list[HypasiaRow]:
        """Pull all pending rows above min_score and mark them as retrained."""
        with self._connect() as conn:
            raw = conn.execute(
                "SELECT id, raw_json FROM flywheel_queue WHERE retrained = 0 AND score >= ?",
                (min_score,),
            ).fetchall()
            ids = [r[0] for r in raw]
            rows = []
            for _, rjson in raw:
                try:
                    d = json.loads(rjson)
                    rows.append(HypasiaRow.from_dict(d))
                except Exception:
                    pass
            if ids:
                conn.execute(
                    f"UPDATE flywheel_queue SET retrained = 1 WHERE id IN ({','.join('?' * len(ids))})",
                    ids,
                )
                conn.commit()
        return rows

    def avg_score(self) -> float:
        with self._connect() as conn:
            result = conn.execute(
                "SELECT AVG(score) FROM flywheel_queue WHERE retrained = 0"
            ).fetchone()[0]
        return round(result or 0.0, 2)

    def last_retrain_time(self) -> Optional[str]:
        with self._connect() as conn:
            result = conn.execute(
                "SELECT MAX(date_captured) FROM flywheel_queue WHERE retrained = 1"
            ).fetchone()[0]
        return result
