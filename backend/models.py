"""
NETRA Backend — Pydantic models.
Request / response schemas used across the API layer.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


# ── Auth ──────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, examples=["analyst_1"])
    password: str = Field(..., min_length=6, max_length=128)


class UserLogin(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    username: str


class UserProfile(BaseModel):
    id: int
    username: str
    created_at: str


# ── Cases ─────────────────────────────────────────────────────────────────

class CaseCreate(BaseModel):
    """Populated server-side after upload — not sent by client."""
    original_filename: str
    clean_image_path: Optional[str] = None
    phash: Optional[str] = None


# ── Findings ──────────────────────────────────────────────────────────────

class FindingCreate(BaseModel):
    case_id: str
    source_url: str
    page_title: Optional[str] = None
    domain: Optional[str] = None
    similarity_score: float = Field(0.0, ge=0, le=100)
    confidence: float = Field(0.0, ge=0, le=100)
    source_provider: Optional[str] = None
    metadata_json: Optional[str] = None


class Finding(BaseModel):
    id: int
    case_id: str
    source_url: str
    page_title: Optional[str] = None
    domain: Optional[str] = None
    similarity_score: float
    confidence: float
    source_provider: Optional[str] = None
    found_at: str
    metadata_json: Optional[str] = None


# ── Timeline ──────────────────────────────────────────────────────────────

class TimelineEvent(BaseModel):
    id: int
    case_id: str
    event_type: str
    description: str
    timestamp: str


# ── Cases ─────────────────────────────────────────────────────────────────

class CaseSummary(BaseModel):
    case_id: str
    original_filename: str
    status: str
    created_at: str
    updated_at: str
    findings_count: int = 0


class CaseResponse(BaseModel):
    id: int
    case_id: str
    user_id: int
    original_filename: str
    clean_image_path: Optional[str] = None
    phash: Optional[str] = None
    status: str
    created_at: str
    updated_at: str
    findings: List[Finding] = []
    timeline: List[TimelineEvent] = []



# ── Investigation ─────────────────────────────────────────────────────────

class InvestigationResult(BaseModel):
    case_id: str
    status: str
    total_findings: int
    high_confidence_count: int
    providers_queried: List[str]
    ai_summary: Optional[str] = None
    findings: List[Finding] = []
    timeline: List[TimelineEvent] = []


# ── Report ────────────────────────────────────────────────────────────────

class ReportData(BaseModel):
    case_id: str
    original_filename: str
    status: str
    phash: Optional[str] = None
    created_at: str
    updated_at: str
    findings: List[Finding] = []
    timeline: List[TimelineEvent] = []
    summary_stats: Dict[str, Any] = {}
    ai_summary: Optional[str] = None


# ── Dashboard ─────────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_cases: int
    status_breakdown: Dict[str, int]
    total_findings: int
    average_confidence: float
    high_confidence_findings: int
