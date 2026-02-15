"""SQLite database connection and initialization."""

import json
import logging
import os
import sqlite3
from contextlib import contextmanager

from app.config import settings

logger = logging.getLogger(__name__)

_DB_PATH: str = settings.db_path


def _get_db_path() -> str:
    """Return the absolute path to the database file."""
    return os.path.abspath(_DB_PATH)


@contextmanager
def get_connection():
    """Context manager that yields a SQLite connection with WAL mode."""
    db_path = _get_db_path()
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_database() -> None:
    """Create tables if they do not exist."""
    with get_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS scenarios (
                id TEXT PRIMARY KEY,
                data TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS analysis_results (
                scenario_id TEXT PRIMARY KEY,
                data TEXT NOT NULL,
                run_date TEXT NOT NULL,
                FOREIGN KEY (scenario_id) REFERENCES scenarios(id) ON DELETE CASCADE
            )
            """
        )
    logger.info("Database initialized at %s", _get_db_path())


def set_db_path(path: str) -> None:
    """Override the database path (used in tests)."""
    global _DB_PATH
    _DB_PATH = path
