"""
NETRA Backend — Database module.
Async SQLite setup with full schema: users, cases, findings, timeline_events.
"""

from __future__ import annotations

import aiosqlite
from config import settings

DATABASE_PATH = settings.BASE_DIR / settings.DATABASE_URL

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS users (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    username        TEXT    NOT NULL UNIQUE,
    password_hash   TEXT    NOT NULL,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS cases (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id             TEXT    NOT NULL UNIQUE,
    user_id             INTEGER NOT NULL,
    original_filename   TEXT    NOT NULL,
    clean_image_path    TEXT,
    phash               TEXT,
    status              TEXT    NOT NULL DEFAULT 'pending',
    created_at          TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at          TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS findings (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id             TEXT    NOT NULL,
    source_url          TEXT    NOT NULL,
    page_title          TEXT,
    domain              TEXT,
    similarity_score    REAL    DEFAULT 0.0,
    confidence          REAL    DEFAULT 0.0,
    source_provider     TEXT,
    found_at            TEXT    NOT NULL DEFAULT (datetime('now')),
    metadata_json       TEXT,
    FOREIGN KEY (case_id) REFERENCES cases(case_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS timeline_events (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id         TEXT    NOT NULL,
    event_type      TEXT    NOT NULL,
    description     TEXT    NOT NULL,
    timestamp       TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (case_id) REFERENCES cases(case_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_cases_user_id   ON cases(user_id);
CREATE INDEX IF NOT EXISTS idx_cases_case_id   ON cases(case_id);
CREATE INDEX IF NOT EXISTS idx_findings_case   ON findings(case_id);
CREATE INDEX IF NOT EXISTS idx_timeline_case   ON timeline_events(case_id);
"""


async def get_db() -> aiosqlite.Connection:
    """Return an open connection with row_factory enabled."""
    db = await aiosqlite.connect(str(DATABASE_PATH))
    db.row_factory = aiosqlite.Row
    await db.execute("PRAGMA journal_mode=WAL")
    await db.execute("PRAGMA foreign_keys=ON")
    return db


async def init_db() -> None:
    """Create tables and indexes if they don't already exist."""
    db = await get_db()
    try:
        await db.executescript(SCHEMA_SQL)
        # Seed the analyst_guest user (ID 1) for guest mode bypass
        await db.execute(
            "INSERT OR IGNORE INTO users (id, username, password_hash) VALUES (1, 'analyst_guest', 'GUEST_NO_PASSWORD')"
        )
        await db.commit()
    finally:
        await db.close()



# ── Helper CRUD functions ────────────────────────────────────────────────

async def create_user(username: str, password_hash: str) -> int:
    """Insert a new user and return the user id."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "INSERT INTO users (username, password_hash) VALUES (?, ?)",
            (username, password_hash),
        )
        await db.commit()
        return cursor.lastrowid  # type: ignore[return-value]
    finally:
        await db.close()


async def get_user_by_username(username: str) -> dict | None:
    """Fetch a user row by username."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT id, username, password_hash, created_at FROM users WHERE username = ?",
            (username,),
        )
        row = await cursor.fetchone()
        if row is None:
            return None
        return dict(row)
    finally:
        await db.close()


async def get_user_by_id(user_id: int) -> dict | None:
    """Fetch a user row by id."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT id, username, password_hash, created_at FROM users WHERE id = ?",
            (user_id,),
        )
        row = await cursor.fetchone()
        if row is None:
            return None
        return dict(row)
    finally:
        await db.close()


async def create_case(
    case_id: str,
    user_id: int,
    original_filename: str,
    clean_image_path: str | None = None,
    phash: str | None = None,
    status: str = "pending",
) -> int:
    """Insert a new case and return its row id."""
    db = await get_db()
    try:
        cursor = await db.execute(
            """INSERT INTO cases
               (case_id, user_id, original_filename, clean_image_path, phash, status)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (case_id, user_id, original_filename, clean_image_path, phash, status),
        )
        await db.commit()
        return cursor.lastrowid  # type: ignore[return-value]
    finally:
        await db.close()


async def update_case(case_id: str, **fields: object) -> None:
    """Update arbitrary fields on a case row."""
    if not fields:
        return
    set_clause = ", ".join(f"{k} = ?" for k in fields)
    values = list(fields.values())
    values.append(case_id)
    db = await get_db()
    try:
        await db.execute(
            f"UPDATE cases SET {set_clause}, updated_at = datetime('now') WHERE case_id = ?",
            values,
        )
        await db.commit()
    finally:
        await db.close()


async def get_case(case_id: str) -> dict | None:
    """Fetch a single case by case_id."""
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM cases WHERE case_id = ?", (case_id,))
        row = await cursor.fetchone()
        if row is None:
            return None
        return dict(row)
    finally:
        await db.close()


async def get_cases_for_user(user_id: int) -> list[dict]:
    """Return all cases belonging to a user, most-recent first."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM cases WHERE user_id = ? ORDER BY created_at DESC",
            (user_id,),
        )
        rows = await cursor.fetchall()
        return [dict(r) for r in rows]
    finally:
        await db.close()


async def create_finding(
    case_id: str,
    source_url: str,
    page_title: str | None,
    domain: str | None,
    similarity_score: float,
    confidence: float,
    source_provider: str | None,
    metadata_json: str | None = None,
) -> int:
    """Insert a finding row and return its id."""
    db = await get_db()
    try:
        cursor = await db.execute(
            """INSERT INTO findings
               (case_id, source_url, page_title, domain,
                similarity_score, confidence, source_provider, metadata_json)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                case_id, source_url, page_title, domain,
                similarity_score, confidence, source_provider, metadata_json,
            ),
        )
        await db.commit()
        return cursor.lastrowid  # type: ignore[return-value]
    finally:
        await db.close()


async def get_findings_for_case(case_id: str) -> list[dict]:
    """Fetch all findings for a case ordered by confidence desc."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM findings WHERE case_id = ? ORDER BY confidence DESC",
            (case_id,),
        )
        rows = await cursor.fetchall()
        return [dict(r) for r in rows]
    finally:
        await db.close()


async def create_timeline_event(
    case_id: str,
    event_type: str,
    description: str,
) -> int:
    """Record a timeline event."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "INSERT INTO timeline_events (case_id, event_type, description) VALUES (?, ?, ?)",
            (case_id, event_type, description),
        )
        await db.commit()
        return cursor.lastrowid  # type: ignore[return-value]
    finally:
        await db.close()


async def get_timeline_for_case(case_id: str) -> list[dict]:
    """Fetch timeline events for a case in chronological order."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM timeline_events WHERE case_id = ? ORDER BY timestamp ASC",
            (case_id,),
        )
        rows = await cursor.fetchall()
        return [dict(r) for r in rows]
    finally:
        await db.close()


async def get_aggregate_stats(user_id: int) -> dict:
    """Return dashboard-level aggregate statistics for a user."""
    db = await get_db()
    try:
        # Total cases
        cur = await db.execute(
            "SELECT COUNT(*) as cnt FROM cases WHERE user_id = ?", (user_id,)
        )
        total_cases = (await cur.fetchone())["cnt"]  # type: ignore[index]

        # By status
        cur = await db.execute(
            """SELECT status, COUNT(*) as cnt
               FROM cases WHERE user_id = ? GROUP BY status""",
            (user_id,),
        )
        status_counts: dict[str, int] = {}
        for row in await cur.fetchall():
            status_counts[row["status"]] = row["cnt"]  # type: ignore[index]

        # Total findings across user's cases
        cur = await db.execute(
            """SELECT COUNT(*) as cnt FROM findings f
               JOIN cases c ON f.case_id = c.case_id
               WHERE c.user_id = ?""",
            (user_id,),
        )
        total_findings = (await cur.fetchone())["cnt"]  # type: ignore[index]

        # Average confidence
        cur = await db.execute(
            """SELECT AVG(f.confidence) as avg_conf FROM findings f
               JOIN cases c ON f.case_id = c.case_id
               WHERE c.user_id = ?""",
            (user_id,),
        )
        avg_row = await cur.fetchone()
        avg_confidence = round(avg_row["avg_conf"] or 0.0, 2)  # type: ignore[index]

        # High-confidence findings (>= 70)
        cur = await db.execute(
            """SELECT COUNT(*) as cnt FROM findings f
               JOIN cases c ON f.case_id = c.case_id
               WHERE c.user_id = ? AND f.confidence >= 70""",
            (user_id,),
        )
        high_conf = (await cur.fetchone())["cnt"]  # type: ignore[index]

        return {
            "total_cases": total_cases,
            "status_breakdown": status_counts,
            "total_findings": total_findings,
            "average_confidence": avg_confidence,
            "high_confidence_findings": high_conf,
        }
    finally:
        await db.close()
