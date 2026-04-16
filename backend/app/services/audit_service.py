"""
MediGuide AI — Audit Logging Service
Persistent audit trail for all user interactions & data access events.
Writes to the `audit_logs` table in Supabase.

Usage:
    from app.services.audit_service import log_audit_event
    await log_audit_event(
        event_type="triage_complete",
        event_action="Triage completed with urgency: emergency",
        user_id=user_id,
        resource_type="triage",
        metadata={"urgency": "emergency", "language": "hi"},
        request=request,
    )
"""

import logging
from typing import Optional
from fastapi import Request

from app.db.supabase_client import get_service_client

logger = logging.getLogger(__name__)


async def log_audit_event(
    event_type: str,
    event_action: str,
    user_id: Optional[str] = None,
    session_id: Optional[str] = None,
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
    metadata: Optional[dict] = None,
    request: Optional[Request] = None,
):
    """
    Log an audit event to the persistent audit_logs table.
    Non-blocking — errors are logged but never raised to the caller.

    Args:
        event_type: One of the audit_event_type enum values
        event_action: Human-readable description of what happened
        user_id: UUID of the user (None for anonymous)
        session_id: Browser or chat session ID
        resource_type: Type of resource affected (e.g. 'triage', 'chat')
        resource_id: ID of the specific resource
        metadata: Extra context as JSON (language, urgency, etc.)
        request: FastAPI Request object (to extract IP, user-agent)
    """
    try:
        sb = get_service_client()

        # Extract client info from request
        ip_address = None
        user_agent = None
        if request:
            ip_address = request.client.host if request.client else None
            user_agent = request.headers.get("user-agent", "")[:500]  # truncate

        record = {
            "event_type": event_type,
            "event_action": event_action,
            "resource_type": resource_type,
            "metadata": metadata or {},
        }

        if user_id:
            record["user_id"] = user_id
        if session_id:
            record["session_id"] = session_id
        if resource_id:
            record["resource_id"] = resource_id
        if ip_address:
            record["ip_address"] = ip_address
        if user_agent:
            record["user_agent"] = user_agent

        sb.table("audit_logs").insert(record).execute()

        logger.debug(
            f"Audit logged: {event_type} | {event_action} | user={user_id}"
        )

    except Exception as e:
        # Never let audit logging break the main flow
        logger.error(f"Failed to write audit log: {e}", exc_info=True)


async def get_user_audit_logs(user_id: str, limit: int = 50):
    """
    Retrieve audit logs for a specific user (DPDPA right to access).
    Returns the most recent `limit` events.
    """
    try:
        sb = get_service_client()
        result = (
            sb.table("audit_logs")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return result.data or []
    except Exception as e:
        logger.error(f"Failed to fetch audit logs: {e}", exc_info=True)
        return []
