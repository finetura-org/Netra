"""
NETRA Backend — Configuration module.
Manages API keys (with thread-safe rotation), model fallback chain,
JWT settings, file paths, and general application settings.
"""

from __future__ import annotations

import os
import threading
from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Central configuration loaded from environment variables with sensible
    development defaults."""

    # ── Application ──────────────────────────────────────────────────────
    APP_NAME: str = "NETRA — Network Enabled Tracking and Reconnaissance Analysis"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # ── JWT ───────────────────────────────────────────────────────────────
    JWT_SECRET: str = os.getenv(
        "JWT_SECRET",
        "netra-super-secret-jwt-key-change-in-production-2024",
    )
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24

    # ── Database ──────────────────────────────────────────────────────────
    DATABASE_URL: str = "netra.db"

    # ── Paths ─────────────────────────────────────────────────────────────
    BASE_DIR: Path = Path(__file__).resolve().parent
    UPLOAD_DIR: Path = BASE_DIR / "uploads"
    CLEAN_IMAGE_DIR: Path = UPLOAD_DIR / "clean"

    # ── CORS ──────────────────────────────────────────────────────────────
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    # ── Groq API Keys (9-key rotation pool) ──────────────────────────────
    GROQ_API_KEYS: List[str] = [
        os.getenv("GROQ_API_KEY_1"),
        os.getenv("GROQ_API_KEY_2"),
        os.getenv("GROQ_API_KEY_3"),
        os.getenv("GROQ_API_KEY_4"),
        os.getenv("GROQ_API_KEY_5"),
        os.getenv("GROQ_API_KEY_6"),
        os.getenv("GROQ_API_KEY_7"),
        os.getenv("GROQ_API_KEY_8"),
    ]
    GROQ_API_KEYS = [k for k in GROQ_API_KEYS if k]


    # ── Model Fallback Chain ─────────────────────────────────────────────
    MODEL_FALLBACK_CHAIN: List[str] = [
        "llama-4-scout-17b-16e-instruct",
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant",
        "deepseek-r1-distill-llama-70b",
    ]

    VISION_MODEL: str = "llama-4-scout-17b-16e-instruct"

    # ── Investigation ─────────────────────────────────────────────────────
    MAX_FINDINGS_PER_CASE: int = 100
    DEFAULT_CONFIDENCE_THRESHOLD: float = 25.0

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

    def ensure_dirs(self) -> None:
        """Create upload directories if they don't exist."""
        self.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        self.CLEAN_IMAGE_DIR.mkdir(parents=True, exist_ok=True)


# ── Thread-safe key rotator ──────────────────────────────────────────────

class _KeyRotator:
    """Round-robin key rotator that is safe across threads."""

    def __init__(self, keys: List[str]) -> None:
        self._keys = keys
        self._index = 0
        self._lock = threading.Lock()

    @property
    def current_key(self) -> str:
        with self._lock:
            return self._keys[self._index % len(self._keys)]

    def next_key(self) -> str:
        """Advance to the next key and return it."""
        with self._lock:
            self._index = (self._index + 1) % len(self._keys)
            return self._keys[self._index]

    def rotate(self) -> str:
        """Alias for next_key — rotate after a failure / rate-limit."""
        return self.next_key()


# ── Module-level singletons ──────────────────────────────────────────────

settings = Settings()
settings.ensure_dirs()

key_rotator = _KeyRotator(settings.GROQ_API_KEYS)
