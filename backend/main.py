"""
NETRA Backend — FastAPI application entry point.
Defines all API endpoints, middleware, startup hooks, and background tasks.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import List

from fastapi import (
    BackgroundTasks,
    Depends,
    FastAPI,
    File,
    HTTPException,
    UploadFile,
    status,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from auth import (
    create_token,
    get_current_user,
    hash_password,
    verify_password,
)
from config import settings
from database import (
    create_case,
    create_timeline_event,
    create_user,
    get_aggregate_stats,
    get_case,
    get_cases_for_user,
    get_findings_for_case,
    get_timeline_for_case,
    get_user_by_username,
    init_db,
    update_case,
)
from image_processor import image_processor
from investigation_agent import investigation_agent
from models import (
    CaseResponse,
    CaseSummary,
    DashboardStats,
    Finding,
    TimelineEvent,
    TokenResponse,
    UserCreate,
    UserLogin,
    UserProfile,
)
from report_generator import report_generator

# ── Logging ───────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
)
logger = logging.getLogger("netra.main")

# ── App init ──────────────────────────────────────────────────────────────

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Secure HTTP Headers Middleware
from fastapi import Request, Response
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response: Response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "connect-src 'self' http://localhost:8000 ws://localhost:8000; "
        "img-src 'self' data: http://localhost:8000; "
        "style-src 'self' 'unsafe-inline'; "
        "script-src 'self' 'unsafe-inline';"
    )
    return response



# ── Startup / shutdown ───────────────────────────────────────────────────

@app.on_event("startup")
async def startup() -> None:
    await init_db()
    settings.ensure_dirs()
    logger.info("NETRA backend started — DB initialised, dirs ready.")


# ── Static files (uploads) ───────────────────────────────────────────────

app.mount(
    "/uploads",
    StaticFiles(directory=str(settings.UPLOAD_DIR)),
    name="uploads",
)


# ── Helpers ───────────────────────────────────────────────────────────────

def _generate_case_id() -> str:
    """Produce a case ID in the format NETRA-YYYYMMDD-XXXX."""
    now = datetime.now(timezone.utc)
    date_part = now.strftime("%Y%m%d")
    unique_part = uuid.uuid4().hex[:4].upper()
    return f"NETRA-{date_part}-{unique_part}"


ALLOWED_CONTENT_TYPES = {
    "image/jpeg", "image/png", "image/gif", "image/webp",
    "image/bmp", "image/tiff",
}
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB


# ══════════════════════════════════════════════════════════════════════════
#  AUTH ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════

@app.post("/api/auth/register", response_model=TokenResponse, status_code=201)
async def register(body: UserCreate) -> TokenResponse:
    """Register a new user account."""
    existing = await get_user_by_username(body.username)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already exists.",
        )
    pw_hash = hash_password(body.password)
    user_id = await create_user(body.username, pw_hash)
    token = create_token(user_id, body.username)
    return TokenResponse(
        access_token=token,
        user_id=user_id,
        username=body.username,
    )


@app.post("/api/auth/login", response_model=TokenResponse)
async def login(body: UserLogin) -> TokenResponse:
    """Authenticate and return a JWT."""
    user = await get_user_by_username(body.username)
    if user is None or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password.",
        )
    token = create_token(user["id"], user["username"])
    return TokenResponse(
        access_token=token,
        user_id=user["id"],
        username=user["username"],
    )


@app.get("/api/auth/me", response_model=UserProfile)
async def me(user: dict = Depends(get_current_user)) -> UserProfile:
    """Return the authenticated user's profile."""
    return UserProfile(
        id=user["id"],
        username=user["username"],
        created_at=user["created_at"],
    )


# ══════════════════════════════════════════════════════════════════════════
#  CASE ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════

@app.post("/api/cases/upload", status_code=202)
async def upload_case(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
) -> dict:
    """Upload an image → create case → kick off investigation in background."""
    # Validate content type
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type: {file.content_type}. "
                   f"Allowed: {', '.join(sorted(ALLOWED_CONTENT_TYPES))}",
        )

    # Read bytes
    raw_bytes = await file.read()
    if len(raw_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large ({len(raw_bytes)} bytes). Max {MAX_FILE_SIZE} bytes.",
        )
    if len(raw_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    # Secure image payload verification
    from PIL import Image as PILImage
    import io
    try:
        img_check = PILImage.open(io.BytesIO(raw_bytes))
        img_check.verify()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image payload. The uploaded file is corrupt or not a valid image format.",
        )

    case_id = _generate_case_id()
    original_filename = file.filename or "unknown"

    # Strip EXIF
    clean_bytes = image_processor.strip_exif(raw_bytes)

    # Save clean image
    ext = Path(original_filename).suffix or ".png"
    clean_filename = f"{case_id}{ext}"
    clean_path = settings.CLEAN_IMAGE_DIR / clean_filename
    clean_path.write_bytes(clean_bytes)

    # Perceptual hash
    phash = image_processor.generate_phash(raw_bytes)

    # Create DB record
    await create_case(
        case_id=case_id,
        user_id=user["id"],
        original_filename=original_filename,
        clean_image_path=str(clean_path),
        phash=phash,
        status="processing",
    )

    await create_timeline_event(
        case_id, "case_created",
        f"Case created. Image '{original_filename}' uploaded and processed. pHash: {phash}.",
    )

    # Launch investigation in background
    background_tasks.add_task(_run_investigation_bg, case_id)

    return {
        "case_id": case_id,
        "status": "processing",
        "message": "Image uploaded. Investigation started in background.",
        "phash": phash,
    }


async def _run_investigation_bg(case_id: str) -> None:
    """Background wrapper for the investigation agent."""
    try:
        result = await investigation_agent.run_investigation(case_id)
        logger.info(
            "Investigation %s completed: %d findings, %d high-conf.",
            case_id,
            result.total_findings,
            result.high_confidence_count,
        )
    except Exception as exc:
        logger.error("Investigation %s failed: %s", case_id, exc)
        await update_case(case_id, status="failed")
        await create_timeline_event(
            case_id, "investigation_failed", f"Investigation failed: {exc}"
        )


@app.get("/api/cases", response_model=List[CaseSummary])
async def list_cases(user: dict = Depends(get_current_user)) -> List[CaseSummary]:
    """Return all cases for the authenticated user."""
    cases = await get_cases_for_user(user["id"])
    summaries: List[CaseSummary] = []
    for c in cases:
        findings = await get_findings_for_case(c["case_id"])
        summaries.append(
            CaseSummary(
                case_id=c["case_id"],
                original_filename=c["original_filename"],
                status=c["status"],
                created_at=c["created_at"],
                updated_at=c["updated_at"],
                findings_count=len(findings),
            )
        )
    return summaries


@app.get("/api/cases/{case_id}", response_model=CaseResponse)
async def get_case_detail(
    case_id: str,
    user: dict = Depends(get_current_user),
) -> CaseResponse:
    """Return full case detail including findings and timeline."""
    case = await get_case(case_id)
    if case is None:
        raise HTTPException(status_code=404, detail="Case not found.")
    if case["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Access denied.")

    findings_rows = await get_findings_for_case(case_id)
    timeline_rows = await get_timeline_for_case(case_id)

    return CaseResponse(
        id=case["id"],
        case_id=case["case_id"],
        user_id=case["user_id"],
        original_filename=case["original_filename"],
        clean_image_path=case.get("clean_image_path"),
        phash=case.get("phash"),
        status=case["status"],
        created_at=case["created_at"],
        updated_at=case["updated_at"],
        findings=[Finding(**f) for f in findings_rows],
        timeline=[TimelineEvent(**t) for t in timeline_rows],
    )


@app.get("/api/cases/{case_id}/timeline", response_model=List[TimelineEvent])
async def get_case_timeline(
    case_id: str,
    user: dict = Depends(get_current_user),
) -> List[TimelineEvent]:
    """Return timeline events for a case."""
    case = await get_case(case_id)
    if case is None:
        raise HTTPException(status_code=404, detail="Case not found.")
    if case["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Access denied.")

    rows = await get_timeline_for_case(case_id)
    return [TimelineEvent(**r) for r in rows]


@app.get("/api/cases/{case_id}/report")
async def get_case_report(
    case_id: str,
    user: dict = Depends(get_current_user),
) -> dict:
    """Generate and return a full JSON report for a case."""
    case = await get_case(case_id)
    if case is None:
        raise HTTPException(status_code=404, detail="Case not found.")
    if case["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Access denied.")

    try:
        report = await report_generator.generate_json_report(case_id)
        return report
    except Exception as exc:
        logger.error("Report generation failed for %s: %s", case_id, exc)
        raise HTTPException(
            status_code=500,
            detail=f"Report generation failed: {exc}",
        )


# ══════════════════════════════════════════════════════════════════════════
#  DASHBOARD
# ══════════════════════════════════════════════════════════════════════════

@app.get("/api/dashboard/stats", response_model=DashboardStats)
async def dashboard_stats(
    user: dict = Depends(get_current_user),
) -> DashboardStats:
    """Return aggregate statistics for the authenticated user."""
    stats = await get_aggregate_stats(user["id"])
    return DashboardStats(**stats)


# ══════════════════════════════════════════════════════════════════════════
#  HEALTH CHECK
# ══════════════════════════════════════════════════════════════════════════

@app.get("/api/health")
async def health() -> dict:
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }


# ══════════════════════════════════════════════════════════════════════════
#  RUN
# ══════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
    )
