"""
MediGuide AI — Audit Logging Middleware
Automatically logs all API requests to the audit_logs table.
Captures: endpoint, method, user agent, IP, response status, latency.

Added to main.py via: app.add_middleware(AuditMiddleware)
"""

import time
import logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.services.audit_service import log_audit_event

logger = logging.getLogger(__name__)

# Endpoints to skip (health checks, static assets, docs)
SKIP_PATHS = {"/", "/docs", "/redoc", "/openapi.json", "/api/health", "/favicon.ico"}

# Map API paths to audit event types
PATH_EVENT_MAP = {
    "/api/triage":      ("triage_start",      "triage"),
    "/api/chat":        ("chat_message",      "chat"),
    "/api/voice/stt":   ("voice_stt",         "voice"),
    "/api/voice/tts":   ("voice_tts",         "voice"),
    "/api/navigation":  ("navigation_route",  "navigation"),
    "/api/hospitals":   ("hospital_search",   "hospital"),
    "/api/schemes":     ("scheme_lookup",     "scheme"),
    "/api/profile":     ("profile_update",    "profile"),
    "/api/caregiver":   ("caregiver_alert",   "caregiver"),
}


class AuditMiddleware(BaseHTTPMiddleware):
    """
    Middleware that logs every significant API request to the audit trail.
    Runs AFTER the response is generated to capture status codes.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        # Skip non-API and health check paths
        path = request.url.path
        if path in SKIP_PATHS or not path.startswith("/api"):
            return await call_next(request)

        start_time = time.time()
        response = await call_next(request)
        latency_ms = round((time.time() - start_time) * 1000)

        # Determine event type from path
        event_type = "chat_message"  # default
        resource_type = "api"
        for prefix, (evt, res) in PATH_EVENT_MAP.items():
            if path.startswith(prefix):
                event_type = evt
                resource_type = res
                break

        # Build audit metadata
        metadata = {
            "method": request.method,
            "path": path,
            "status_code": response.status_code,
            "latency_ms": latency_ms,
        }

        # Extract query params (non-sensitive)
        if request.query_params:
            metadata["query"] = dict(request.query_params)

        event_action = (
            f"{request.method} {path} → {response.status_code} ({latency_ms}ms)"
        )

        # Fire-and-forget audit log (non-blocking)
        try:
            await log_audit_event(
                event_type=event_type,
                event_action=event_action,
                resource_type=resource_type,
                metadata=metadata,
                request=request,
            )
        except Exception:
            pass  # Never let audit logging break a request

        return response
