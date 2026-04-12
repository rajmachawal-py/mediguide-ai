"""
MediGuide AI — Firebase Cloud Messaging Service
Sends push notifications to caregivers when patients report emergencies.

Uses Firebase Admin SDK. Requires:
  - FCM_CREDENTIALS_JSON env var pointing to the service account JSON file
"""

import json
import logging
from typing import Optional

from app.config import settings

logger = logging.getLogger(__name__)

# ── Firebase Admin SDK Initialization ─────────────────────────

_firebase_initialized = False

def _init_firebase():
    """Initialize Firebase Admin SDK (lazy, once)."""
    global _firebase_initialized
    if _firebase_initialized:
        return True

    try:
        import firebase_admin
        from firebase_admin import credentials

        creds_path = settings.FCM_CREDENTIALS_JSON

        if not creds_path:
            logger.warning(
                "FCM_CREDENTIALS_JSON not set — push notifications disabled"
            )
            return False

        # Support both file path and inline JSON string
        if creds_path.strip().startswith("{"):
            # Inline JSON string
            creds_dict = json.loads(creds_path)
            cred = credentials.Certificate(creds_dict)
        else:
            # File path
            cred = credentials.Certificate(creds_path)

        firebase_admin.initialize_app(cred)
        _firebase_initialized = True
        logger.info("Firebase Admin SDK initialized successfully")
        return True

    except Exception as e:
        logger.error(f"Firebase Admin SDK init failed: {e}")
        return False


# ── Send Push Notification ────────────────────────────────────

async def send_push(
    token: str,
    title: str,
    body: str,
    data: Optional[dict] = None,
) -> bool:
    """
    Send a push notification to a single device via FCM.

    Args:
        token: FCM device token (from the user's browser/app)
        title: Notification title
        body: Notification body text
        data: Optional key-value data payload

    Returns:
        True if sent successfully, False otherwise
    """
    if not _init_firebase():
        logger.warning("Firebase not initialized — skipping push notification")
        return False

    try:
        from firebase_admin import messaging

        notification = messaging.Notification(
            title=title,
            body=body,
        )

        message = messaging.Message(
            notification=notification,
            token=token,
            data=data or {},
            # Android notification channel for caregivers
            android=messaging.AndroidConfig(
                priority="high",
                notification=messaging.AndroidNotification(
                    channel_id="caregiver_alerts",
                    sound="default",
                    color="#ef4444",  # emergency red
                ),
            ),
            # Web push (for PWA / browser)
            webpush=messaging.WebpushConfig(
                notification=messaging.WebpushNotification(
                    icon="/icons/mediguide-icon-192.png",
                    badge="/icons/mediguide-badge-72.png",
                ),
                fcm_options=messaging.WebpushFCMOptions(
                    link="/caregiver",
                ),
            ),
        )

        response = messaging.send(message)
        logger.info(f"FCM push sent successfully: {response}")
        return True

    except Exception as e:
        logger.error(f"FCM push failed: {e}", exc_info=True)
        return False


async def send_push_to_user(
    user_id: str,
    title: str,
    body: str,
    data: Optional[dict] = None,
) -> bool:
    """
    Look up a user's FCM token from the profiles table and send a push.

    Args:
        user_id: Supabase user UUID
        title: Notification title
        body: Notification body text
        data: Optional payload

    Returns:
        True if notification was sent, False if user has no token or send failed
    """
    try:
        from app.db.supabase_client import get_service_client
        supabase = get_service_client()

        result = (
            supabase.table("profiles")
            .select("fcm_token")
            .eq("id", user_id)
            .execute()
        )

        if not result.data or not result.data[0].get("fcm_token"):
            logger.info(f"User {user_id} has no FCM token — skipping push")
            return False

        token = result.data[0]["fcm_token"]
        return await send_push(token, title, body, data)

    except Exception as e:
        logger.error(f"Push to user {user_id} failed: {e}", exc_info=True)
        return False
