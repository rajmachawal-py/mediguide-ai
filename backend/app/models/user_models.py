"""
MediGuide AI — User Pydantic Models
Request and response schemas for user profile endpoints.
"""

from typing import Optional, Literal
from pydantic import BaseModel, Field


# ── Shared Types ──────────────────────────────────────────────

LanguageCode = Literal["hi", "mr", "en"]
GenderType = Literal["male", "female", "other", "prefer_not_to_say"]


# ── Profile Models ────────────────────────────────────────────

class UserProfile(BaseModel):
    """
    Represents a user profile from the Supabase `profiles` table.
    Matches the schema.sql definition exactly.
    """
    id:             str
    email:          Optional[str]          = None
    phone:          Optional[str]          = None
    full_name:      Optional[str]          = None
    age:            Optional[int]          = Field(default=None, ge=0, le=120)
    gender:         Optional[GenderType]   = "prefer_not_to_say"
    state:          Optional[str]          = None
    district:       Optional[str]          = None
    preferred_lang: LanguageCode           = "hi"
    annual_income:  Optional[int]          = None    # INR
    fcm_token:      Optional[str]          = None
    created_at:     Optional[str]          = None
    updated_at:     Optional[str]          = None

    class Config:
        json_schema_extra = {
            "example": {
                "id": "a1b2c3d4-0000-0000-0000-000000000001",
                "phone": "+919876543210",
                "full_name": "Raj Kumar",
                "age": 35,
                "gender": "male",
                "state": "Maharashtra",
                "district": "Pune",
                "preferred_lang": "hi",
                "annual_income": 250000,
            }
        }


class UserUpdateRequest(BaseModel):
    """
    PUT /api/profile — fields the user can update.
    All fields are optional — only provided fields are updated.
    """
    full_name:      Optional[str]          = Field(default=None, max_length=100)
    age:            Optional[int]          = Field(default=None, ge=0, le=120)
    gender:         Optional[GenderType]   = None
    state:          Optional[str]          = Field(default=None, max_length=50)
    district:       Optional[str]          = Field(default=None, max_length=50)
    preferred_lang: Optional[LanguageCode] = None
    annual_income:  Optional[int]          = Field(default=None, ge=0)
    fcm_token:      Optional[str]          = None

    class Config:
        json_schema_extra = {
            "example": {
                "full_name": "Raj Kumar",
                "age": 35,
                "gender": "male",
                "state": "Maharashtra",
                "preferred_lang": "hi",
                "annual_income": 250000,
            }
        }


class UserProfileResponse(BaseModel):
    """Response wrapper for profile endpoints."""
    profile: UserProfile
    message: str = "Profile fetched successfully"


class FCMTokenRequest(BaseModel):
    """Request to save/update the user's FCM push notification token."""
    fcm_token: str = Field(..., min_length=10, description="Firebase Cloud Messaging device token")
