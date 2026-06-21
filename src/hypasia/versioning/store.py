"""
Hypasia AI — Dataset Version Control (Module 14).
Git-like snapshots for every pipeline run. SQLite-backed, diff-capable.
"""
from __future__ import annotations

import hashlib
import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional


class VersionStore:
    """
    Stores versioned snapshots of datasets.
    Each 'commit' is a named version with full row data + diff metadata.
    """

    def __init__(self, db_path: str = "hypasia_versions.db"):
        self.db_path = Path(db_path)
        self._init_db()

    def _conn(self) -> sqlite3.Connection:
        c = sqlite3.connect(str(self.db_path), check_same_thread=False)
        c.execute("PRAGMA journal_mode=WAL")
        return c

    def _init_db(self):
        with self._conn() as c:
            c.executescript("""
                CREATE TABLE IF NOT EXISTS versions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    version_id TEXT UNIQUE NOT NULL,
                    name TEXT NOT NULL,
                    message TEXT DEFAULT '',
                    row_count INTEGER DEFAULT 0,
                    avg_score REAL DEFAULT 0.0,
                    created_at TEXT NOT NULL,
                    parent_id TEXT,
                    rows_json TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS tags (
                    version_id TEXT NOT NULL,
                    tag TEXT NOT NULL,
                    PRIMARY KEY (version_id, tag)
                );
            """)
            c.commit()

    # ── Write ────────────────────────────────────────────────────────────────

    def commit(
        self,
        rows: list[dict],
        name: str,
        message: str = "",
        parent_id: Optional[str] = None,
        tags: list[str] = (),
    ) -> str:
        """Save a new version snapshot. Returns version_id."""
        rows_json = json.dumps(rows, ensure_ascii=False)
        version_id = hashlib.sha256(rows_json.encode()).hexdigest()[:12]
        avg_score = (
            sum(r.get("score", 0) for r in rows) / max(len(rows), 1)
            if rows else 0.0
        )
        with self._conn() as c:
            c.execute(
                """INSERT OR IGNORE INTO versions
                   (version_id, name, message, row_count, avg_score, created_at, parent_id, rows_json)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                (version_id, name, message, len(rows), round(avg_score, 2),
                 datetime.now(timezone.utc).isoformat(), parent_id, rows_json),
            )
            for tag in tags:
                c.execute("INSERT OR IGNORE INTO tags VALUES (?, ?)", (version_id, tag))
            c.commit()
        return version_id

    # ── Read ─────────────────────────────────────────────────────────────────

    def list_versions(self, limit: int = 50) -> list[dict]:
        with self._conn() as c:
            rows = c.execute(
                """SELECT version_id, name, message, row_count, avg_score, created_at, parent_id
                   FROM versions ORDER BY id DESC LIMIT ?""", (limit,)
            ).fetchall()
        return [
            {"version_id": r[0], "name": r[1], "message": r[2],
             "row_count": r[3], "avg_score": r[4], "created_at": r[5], "parent_id": r[6]}
            for r in rows
        ]

    def get_rows(self, version_id: str) -> list[dict]:
        with self._conn() as c:
            row = c.execute(
                "SELECT rows_json FROM versions WHERE version_id = ?", (version_id,)
            ).fetchone()
        if not row:
            raise ValueError(f"Version not found: {version_id}")
        return json.loads(row[0])

    def diff(self, version_a: str, version_b: str) -> dict:
        """Compare two versions. Returns added/removed/changed counts."""
        rows_a = {r.get("id", r.get("instruction", "")[:32]): r for r in self.get_rows(version_a)}
        rows_b = {r.get("id", r.get("instruction", "")[:32]): r for r in self.get_rows(version_b)}

        ids_a = set(rows_a)
        ids_b = set(rows_b)

        added = [rows_b[k] for k in (ids_b - ids_a)]
        removed = [rows_a[k] for k in (ids_a - ids_b)]
        common = ids_a & ids_b
        changed = [rows_b[k] for k in common if rows_b[k] != rows_a[k]]

        return {
            "version_a": version_a,
            "version_b": version_b,
            "added": len(added),
            "removed": len(removed),
            "changed": len(changed),
            "unchanged": len(common) - len(changed),
            "sample_added": added[:3],
            "sample_removed": removed[:3],
        }

    def rollback(self, version_id: str) -> list[dict]:
        """Return rows from a previous version (for re-export or re-training)."""
        return self.get_rows(version_id)

    def delete(self, version_id: str):
        with self._conn() as c:
            c.execute("DELETE FROM versions WHERE version_id = ?", (version_id,))
            c.execute("DELETE FROM tags WHERE version_id = ?", (version_id,))
            c.commit()
