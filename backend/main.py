"""
MediGuide AI — FastAPI Application Entry Point
Run with: uvicorn main:app --reload  (from the /backend directory)
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.middleware.audit_middleware import AuditMiddleware

from app.config import settings
from app.routers import (
    triage,
    chat,
    voice,
    hospital,
    scheme,
    caregiver,
    navigation,
    appointment,
    profile,
)


# ── App Init ─────────────────────────────────────────────────

app = FastAPI(
    title="MediGuide AI API",
    description=(
        "Multilingual healthcare guidance & navigation assistant for India. "
        "Supports Hindi, Marathi, and English via voice and text."
    ),
    version="1.0.0",
    docs_url="/docs",           # Swagger UI
    redoc_url="/redoc",         # ReDoc UI
    openapi_url="/openapi.json",
)


# ── Middleware ───────────────────────────────────────────────
# IMPORTANT: In Starlette, the LAST middleware added is the OUTERMOST.
# CORS must be outermost to handle OPTIONS preflight before anything else.
# Order of add_middleware calls:  first = inner,  last = outer.

# 1. Audit middleware (INNER — runs after CORS has handled preflight)
app.add_middleware(AuditMiddleware)

# 2. CORS middleware (OUTER — must intercept OPTIONS before audit)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,          # e.g. http://localhost:5173
        "https://mediguide-ai.vercel.app",
        "https://mediguide-ai-b2sg.vercel.app",
        "https://mediguide-ai-b2sg-git-main-mediguideai13-3382s-projects.vercel.app",
    ],
    allow_origin_regex=r"https://mediguide-ai.*\.vercel\.app",  # all preview deploys
    allow_credentials=True,             # needed for Supabase JWT cookies
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Routers ──────────────────────────────────────────────────
# Each router is prefixed with /api and tagged for Swagger grouping.

app.include_router(triage.router,      prefix="/api", tags=["Triage"])
app.include_router(chat.router,        prefix="/api", tags=["Chat"])
app.include_router(voice.router,       prefix="/api", tags=["Voice"])
app.include_router(hospital.router,    prefix="/api", tags=["Hospitals"])
app.include_router(scheme.router,      prefix="/api", tags=["Schemes"])
app.include_router(caregiver.router,   prefix="/api", tags=["Caregiver"])
app.include_router(navigation.router,  prefix="/api", tags=["Navigation"])
app.include_router(appointment.router, prefix="/api", tags=["Appointments"])
app.include_router(profile.router,     prefix="/api", tags=["Profile"])


# ── Health Check ─────────────────────────────────────────────

@app.get("/", tags=["Health"])
async def health_check():
    """
    Basic health check endpoint.
    Used by Render/deploy platform to verify the server is up.
    """
    return {
        "status": "ok",
        "app": "MediGuide AI API",
        "version": "1.0.0",
        "environment": settings.APP_ENV,
    }


@app.get("/api/health", tags=["Health"])
async def api_health():
    """Detailed health check — confirms config is loaded correctly."""
    return {
        "status": "ok",
        "supabase_connected": bool(settings.SUPABASE_URL),
        "gemini_configured": bool(settings.GEMINI_API_KEY),
        "sarvam_configured": bool(settings.SARVAM_API_KEY),
        "maps_configured": bool(settings.GOOGLE_MAPS_API_KEY),
    }
