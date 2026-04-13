"""
MediGuide AI — Caregiver Service
Business logic for linking patients to caregivers and sending alerts.

Database tables used:
  - caregiver_links  (patient_id, caregiver_id, relationship, status)
  - caregiver_alerts (link_id, urgency, summary, sent_via, read_at)
  - profiles         (fcm_token lookup)
"""

import logging
import asyncio
from typing import Optional
from datetime import datetime, timezone

from app.db.supabase_client import get_service_client
from app.services.fcm_service import send_push_to_user

logger = logging.getLogger(__name__)


# ── Link Management ───────────────────────────────────────────

async def link_caregiver(
    patient_id: str,
    caregiver_phone: str,
    caregiver_name: str,
    relationship: str = "family",
) -> dict:
    """
    Link a patient to a caregiver by phone number.

    Finds or creates the caregiver user by phone, then creates the link record.
    """
    try:
        supabase = get_service_client()

        # Find the caregiver user by phone
        caregiver_result = await asyncio.to_thread(
            lambda: supabase.table("profiles")
            .select("id, full_name, phone")
            .eq("phone", caregiver_phone)
            .execute()
        )

        caregiver_id = None
        if caregiver_result.data:
            caregiver_id = caregiver_result.data[0]["id"]
        else:
            # Caregiver not yet registered — store the phone for future matching
            # For now, we create the link with caregiver phone (will resolve when they register)
            logger.info(f"Caregiver phone {caregiver_phone} not yet registered — creating pending link")

        # Check for duplicate link
        existing = await asyncio.to_thread(
            lambda: supabase.table("caregiver_links")
            .select("id, status")
            .eq("patient_id", patient_id)
            .eq("caregiver_phone", caregiver_phone)
            .execute()
        )

        if existing.data:
            link = existing.data[0]
            if link["status"] == "active":
                return {"link": link, "message": "Link already exists", "is_new": False}
            else:
                # Reactivate revoked link
                updated = await asyncio.to_thread(
                    lambda: supabase.table("caregiver_links")
                    .update({"status": "active", "caregiver_id": caregiver_id})
                    .eq("id", link["id"])
                    .execute()
                )
                return {"link": updated.data[0], "message": "Link reactivated", "is_new": False}

        # Create new link
        link_data = {
            "patient_id": patient_id,
            "caregiver_id": caregiver_id,
            "caregiver_phone": caregiver_phone,
            "caregiver_name": caregiver_name,
            "relationship": relationship,
            "status": "active",
        }

        result = await asyncio.to_thread(
            lambda: supabase.table("caregiver_links")
            .insert(link_data)
            .execute()
        )

        logger.info(f"Caregiver linked: patient={patient_id} → caregiver_phone={caregiver_phone}")

        return {"link": result.data[0], "message": "Caregiver linked successfully", "is_new": True}

    except Exception as e:
        logger.error(f"Link caregiver error: {e}", exc_info=True)
        raise


async def get_caregiver_links(user_id: str) -> dict:
    """
    Get all caregiver links for a user (both as patient and as caregiver).
    """
    try:
        supabase = get_service_client()

        # Links where user is patient
        as_patient = await asyncio.to_thread(
            lambda: supabase.table("caregiver_links")
            .select("*")
            .eq("patient_id", user_id)
            .eq("status", "active")
            .execute()
        )

        # Links where user is caregiver
        as_caregiver = await asyncio.to_thread(
            lambda: supabase.table("caregiver_links")
            .select("*")
            .eq("caregiver_id", user_id)
            .eq("status", "active")
            .execute()
        )

        return {
            "as_patient": as_patient.data or [],
            "as_caregiver": as_caregiver.data or [],
        }

    except Exception as e:
        logger.error(f"Get caregiver links error: {e}", exc_info=True)
        raise


async def revoke_link(link_id: str, user_id: str) -> dict:
    """
    Soft-delete a caregiver link (sets status to 'revoked').
    Only the patient or caregiver can revoke.
    """
    try:
        supabase = get_service_client()

        # Verify ownership
        link = await asyncio.to_thread(
            lambda: supabase.table("caregiver_links")
            .select("*")
            .eq("id", link_id)
            .execute()
        )

        if not link.data:
            return {"error": "Link not found"}

        link_data = link.data[0]
        if link_data["patient_id"] != user_id and link_data.get("caregiver_id") != user_id:
            return {"error": "Not authorized to revoke this link"}

        result = await asyncio.to_thread(
            lambda: supabase.table("caregiver_links")
            .update({"status": "revoked"})
            .eq("id", link_id)
            .execute()
        )

        return {"link": result.data[0], "message": "Link revoked"}

    except Exception as e:
        logger.error(f"Revoke link error: {e}", exc_info=True)
        raise


# ── Caregiver Notifications ──────────────────────────────────

async def notify_caregivers(
    patient_id: str,
    urgency: str,
    summary: str,
) -> dict:
    """
    Notify all linked caregivers when a patient has a triage result.

    Sends FCM push to each caregiver and records alerts in the database.
    """
    try:
        supabase = get_service_client()

        # Get all active caregiver links for this patient
        links = await asyncio.to_thread(
            lambda: supabase.table("caregiver_links")
            .select("*")
            .eq("patient_id", patient_id)
            .eq("status", "active")
            .execute()
        )

        if not links.data:
            logger.info(f"No caregivers linked for patient {patient_id}")
            return {"notified": 0, "alerts": []}

        # Get patient name for the notification
        patient = await asyncio.to_thread(
            lambda: supabase.table("profiles")
            .select("full_name, phone")
            .eq("id", patient_id)
            .execute()
        )
        patient_name = "Patient"
        if patient.data:
            patient_name = patient.data[0].get("full_name") or patient.data[0].get("phone", "Patient")

        # Urgency-appropriate notification text
        urgency_emoji = {"emergency": "🔴", "moderate": "🟡", "mild": "🟢"}
        emoji = urgency_emoji.get(urgency, "ℹ️")

        title = f"{emoji} MediGuide Alert — {patient_name}"
        body = f"Health status: {urgency.upper()}\n{summary[:200]}"

        notified = 0
        alerts = []

        for link in links.data:
            caregiver_id = link.get("caregiver_id")

            # Send push notification
            push_sent = False
            if caregiver_id:
                push_sent = await send_push_to_user(
                    user_id=caregiver_id,
                    title=title,
                    body=body,
                    data={
                        "type": "caregiver_alert",
                        "patient_id": patient_id,
                        "urgency": urgency,
                        "link_id": link["id"],
                    },
                )

            # Record alert in database
            alert_data = {
                "link_id": link["id"],
                "urgency": urgency,
                "summary": summary[:500],
                "sent_via": "push" if push_sent else "pending",
            }

            alert_result = await asyncio.to_thread(
                lambda: supabase.table("caregiver_alerts")
                .insert(alert_data)
                .execute()
            )

            if alert_result.data:
                alerts.append(alert_result.data[0])

            if push_sent:
                notified += 1

        logger.info(
            f"Caregiver notifications for patient {patient_id}: "
            f"{notified}/{len(links.data)} pushed, urgency={urgency}"
        )

        return {"notified": notified, "total_links": len(links.data), "alerts": alerts}

    except Exception as e:
        logger.error(f"Notify caregivers error: {e}", exc_info=True)
        raise


async def get_alert_history(
    user_id: str,
    limit: int = 50,
) -> list:
    """
    Get alert history for all links involving this user.
    """
    try:
        supabase = get_service_client()

        # Get all link IDs for this user
        links = await asyncio.to_thread(
            lambda: supabase.table("caregiver_links")
            .select("id")
            .or_(f"patient_id.eq.{user_id},caregiver_id.eq.{user_id}")
            .execute()
        )

        if not links.data:
            return []

        link_ids = [link["id"] for link in links.data]

        # Fetch alerts for these links
        alerts = await asyncio.to_thread(
            lambda: supabase.table("caregiver_alerts")
            .select("*")
            .in_("link_id", link_ids)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )

        return alerts.data or []

    except Exception as e:
        logger.error(f"Alert history error: {e}", exc_info=True)
        raise
