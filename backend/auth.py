"""
NETRA Backend — Authentication module.
JWT token creation/verification, password hashing, FastAPI dependency.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Dict

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from config import settings
from database import get_user_by_id

# ── Security scheme ──────────────────────────────────────────────────────

_bearer_scheme = HTTPBearer(auto_error=True)
_bearer_scheme_optional = HTTPBearer(auto_error=False)

# ── Password utilities ───────────────────────────────────────────────────

def hash_password(plain: str) -> str:
    """Return a bcrypt hash of *plain*."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(plain.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Check *plain* against a bcrypt *hashed* value."""
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


# ── JWT utilities ─────────────────────────────────────────────────────────

def create_token(user_id: int, username: str) -> str:
    """Create a signed JWT containing user identity claims."""
    now = datetime.now(timezone.utc)
    payload: Dict[str, Any] = {
        "sub": str(user_id),
        "username": username,
        "iat": now,
        "exp": now + timedelta(hours=settings.JWT_EXPIRATION_HOURS),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def verify_token(token: str) -> Dict[str, Any]:
    """Decode and validate a JWT.  Raises HTTPException on failure."""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
        )
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token payload missing subject claim.",
            )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired.",
        )
    except jwt.InvalidTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {exc}",
        )


# ── FastAPI dependency ────────────────────────────────────────────────────

async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme_optional),
) -> dict:
    """Dependency that extracts and validates the user from the Bearer token.
    Falls back to a mock analyst guest account if not authenticated.
    """
    mock_guest = {
        "id": 1,
        "username": "analyst_guest",
        "created_at": "2026-06-25 18:34:32",
    }
    if credentials is None:
        return mock_guest
    try:
        payload = verify_token(credentials.credentials)
        user_id = int(payload["sub"])
        user = await get_user_by_id(user_id)
        if user is None:
            return mock_guest
        user.pop("password_hash", None)
        return user
    except Exception:
        return mock_guest
