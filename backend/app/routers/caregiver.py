"""
MediGuide AI — Caregiver Router
Endpoints for linking patients to caregivers and managing alerts.

Endpoints:
    POST   /api/caregiver/link          — link a caregiver by phone
    GET    /api/caregiver/links         — get all links for current user
    DELETE /api/caregiver/link/{id}     — revoke a caregiver link
    POST   /api/caregiver/notify        — send alert to caregivers
    GET    /api/caregiver/alerts        — get alert history

All endpoints require authenticated user (Supabase JWT).
"""

import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field

from app.routers.profile import get_current_user_id
from app.services.caregiver_service import (
    link_caregiver,
    get_caregiver_links,
    revoke_link,
    notify_caregivers,
    get_alert_history,
)

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Request / Response Models ─────────────────────────────────

class LinkCaregiverRequest(BaseModel):
    """Request body for POST /api/caregiver/link."""
    caregiver_phone: str = Field(
        ..., min_length=10, max_length=15,
        description="Caregiver's phone number with country code (e.g., +919876543210)",
        examples=["+919876543210"],
    )
    caregiver_name: str = Field(
        ..., min_length=1, max_length=100,
        description="Caregiver's name",
        examples=["Anita Sharma"],
    )
    relationship: str = Field(
        default="family",
        description="Relationship: 'family', 'spouse', 'parent', 'child', 'friend', 'doctor'",
        examples=["family"],
    )


class NotifyCaregiverRequest(BaseModel):
    """Request body for POST /api/caregiver/notify."""
    urgency: str = Field(
        ..., description="Urgency level: 'mild', 'moderate', 'emergency'",
        examples=["emergency"],
    )
    summary: str = Field(
        ..., min_length=5, max_length=500,
        description="Brief summary of patient's condition",
        examples=["Patient reports severe chest pain with difficulty breathing"],
    )


# ── POST /api/caregiver/link ─────────────────────────────────

@router.post(
    "/caregiver/link",
    summary="Link a caregiver",
    description=(
        "Link the current patient to a caregiver by phone number. "
        "The caregiver will receive push notifications when triage results are generated."
    ),
)
async def create_caregiver_link(
    request: LinkCaregiverRequest,
    user_id: str = Depends(get_current_user_id),
):
    """
    Create a patient → caregiver link.
    The caregiver is identified by phone number.
    """
    try:
        result = await link_caregiver(
            patient_id=user_id,
            caregiver_phone=request.caregiver_phone,
            caregiver_name=request.caregiver_name,
            relationship=request.relationship,
        )
        return result

    except Exception as e:
        logger.error(f"Link caregiver error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to link caregiver.",
        )


# ── GET /api/caregiver/links ─────────────────────────────────

@router.get(
    "/caregiver/links",
    summary="Get caregiver links",
    description=(
        "Returns all caregiver links for the current user, "
        "split into 'as_patient' (my caregivers) and 'as_caregiver' (patients I care for)."
    ),
)
async def list_caregiver_links(
    user_id: str = Depends(get_current_user_id),
):
    """Get all active caregiver links for the authenticated user."""
    try:
        result = await get_caregiver_links(user_id)
        return result

    except Exception as e:
        logger.error(f"List links error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch caregiver links.",
        )


# ── DELETE /api/caregiver/link/{link_id} ──────────────────────

@router.delete(
    "/caregiver/link/{link_id}",
    summary="Revoke a caregiver link",
    description="Soft-deletes a caregiver link. Only the patient or caregiver can revoke.",
)
async def delete_caregiver_link(
    link_id: str,
    user_id: str = Depends(get_current_user_id),
):
    """Revoke (soft-delete) a caregiver link."""
    try:
        result = await revoke_link(link_id, user_id)

        if "error" in result:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN if "authorized" in result["error"] else status.HTTP_404_NOT_FOUND,
                detail=result["error"],
            )

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Revoke link error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to revoke caregiver link.",
        )


# ── POST /api/caregiver/notify ────────────────────────────────

@router.post(
    "/caregiver/notify",
    summary="Notify caregivers",
    description=(
        "Sends push notifications to all linked caregivers for the current patient. "
        "This is called automatically after emergency/moderate triage, "
        "but can also be triggered manually."
    ),
)
async def send_caregiver_notification(
    request: NotifyCaregiverRequest,
    user_id: str = Depends(get_current_user_id),
):
    """
    Trigger caregiver notifications for the authenticated patient.
    Sends FCM push + records alerts in the database.
    """
    try:
        result = await notify_caregivers(
            patient_id=user_id,
            urgency=request.urgency,
            summary=request.summary,
        )
        return result

    except Exception as e:
        logger.error(f"Notify caregivers error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send caregiver notifications.",
        )


# ── GET /api/caregiver/alerts ─────────────────────────────────

@router.get(
    "/caregiver/alerts",
    summary="Get alert history",
    description="Returns recent caregiver alerts for the current user (as patient or caregiver).",
)
async def list_alerts(
    limit: int = 50,
    user_id: str = Depends(get_current_user_id),
):
    """Get alert history for all links involving the current user."""
    try:
        alerts = await get_alert_history(user_id, limit=limit)
        return {"alerts": alerts, "total": len(alerts)}

    except Exception as e:
        logger.error(f"Alert history error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch alerts.",
        )
