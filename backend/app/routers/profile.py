"""
MediGuide AI — Profile Router
GET  /api/profile      — fetch current user's profile
PUT  /api/profile      — update profile fields
POST /api/profile/fcm  — save FCM push token

All endpoints require a valid Supabase JWT in the Authorization header.
"""

import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends, Header, status

from app.models.user_models import (
    UserProfile,
    UserProfileResponse,
    UserUpdateRequest,
    FCMTokenRequest,
)
from app.db.supabase_client import get_client, get_service_client
from app.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Auth Dependency ───────────────────────────────────────────

async def get_current_user_id(
    authorization: Optional[str] = Header(default=None),
) -> str:
    """
    Extract the user UUID from the Supabase JWT token.

    Expected header: Authorization: Bearer <jwt>

    The JWT is verified by calling Supabase's auth.getUser() endpoint,
    which validates the token and returns the user object.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header. Expected: Bearer <token>",
        )

    token = authorization.split("Bearer ", 1)[1]

    try:
        # Use the cached Supabase client singleton to verify the JWT
        supabase = get_client()

        # Get user from JWT — this validates the token with Supabase
        user_response = supabase.auth.get_user(token)

        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired authentication token.",
            )

        user_id = str(user_response.user.id)
        logger.debug(f"Authenticated user: {user_id}")
        return user_id

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Auth verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed. Please sign in again.",
        )


# ── GET /api/profile ─────────────────────────────────────────

@router.get(
    "/profile",
    response_model=UserProfileResponse,
    summary="Get current user's profile",
    description="Fetches the authenticated user's profile from the profiles table.",
)
async def get_profile(
    user_id: str = Depends(get_current_user_id),
) -> UserProfileResponse:
    """
    Fetch the profile of the currently authenticated user.
    The user ID is extracted from the Supabase JWT.
    """
    try:
        supabase = get_service_client()

        result = (
            supabase.table("profiles")
            .select("*")
            .eq("id", user_id)
            .execute()
        )

        if not result.data:
            # Profile might not exist yet (edge case: trigger didn't fire)
            # Create a minimal profile
            logger.warning(f"Profile not found for user {user_id} — creating one")
            insert_result = (
                supabase.table("profiles")
                .insert({"id": user_id, "preferred_lang": "hi"})
                .execute()
            )
            profile_data = insert_result.data[0] if insert_result.data else {"id": user_id}
        else:
            profile_data = result.data[0]

        return UserProfileResponse(
            profile=UserProfile(**profile_data),
            message="Profile fetched successfully",
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Profile fetch error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch profile.",
        )


# ── PUT /api/profile ─────────────────────────────────────────

@router.put(
    "/profile",
    response_model=UserProfileResponse,
    summary="Update user profile",
    description=(
        "Updates the authenticated user's profile fields. "
        "Only provided (non-null) fields are updated."
    ),
)
async def update_profile(
    request: UserUpdateRequest,
    user_id: str = Depends(get_current_user_id),
) -> UserProfileResponse:
    """
    Update profile fields for the current user.
    Only non-null fields from the request body are sent to Supabase.
    """
    try:
        # Build update dict with only non-null fields
        update_data = request.model_dump(exclude_none=True)

        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields provided to update.",
            )

        logger.info(f"Profile update for {user_id}: {list(update_data.keys())}")

        supabase = get_service_client()

        result = (
            supabase.table("profiles")
            .update(update_data)
            .eq("id", user_id)
            .execute()
        )

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found.",
            )

        return UserProfileResponse(
            profile=UserProfile(**result.data[0]),
            message="Profile updated successfully",
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Profile update error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update profile.",
        )


# ── POST /api/profile/fcm ────────────────────────────────────

@router.post(
    "/profile/fcm",
    summary="Save FCM push token",
    description="Saves the user's Firebase Cloud Messaging token for push notifications.",
)
async def save_fcm_token(
    request: FCMTokenRequest,
    user_id: str = Depends(get_current_user_id),
):
    """
    Save or update the FCM token for push notifications.
    Called by the frontend after getting notification permission.
    """
    try:
        supabase = get_service_client()

        result = (
            supabase.table("profiles")
            .update({"fcm_token": request.fcm_token})
            .eq("id", user_id)
            .execute()
        )

        logger.info(f"FCM token saved for user {user_id}")

        return {"status": "ok", "message": "FCM token saved"}

    except Exception as e:
        logger.error(f"FCM token save error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save FCM token.",
        )
