"""
MediGuide AI — Chat & Triage Pydantic Models
Request and response schemas for /api/triage and /api/chat endpoints.
FastAPI uses these for automatic validation, serialization, and Swagger docs.
"""

from typing import Optional, Literal
from pydantic import BaseModel, Field


# ── Shared Types ──────────────────────────────────────────────

LanguageCode = Literal["hi", "mr", "en"]
UrgencyLevel = Literal["mild", "moderate", "emergency"]
MessageRole  = Literal["user", "assistant"]


class ChatMessage(BaseModel):
    """A single turn in the conversation history."""
    role:    MessageRole = Field(..., description="Who sent this message")
    content: str         = Field(..., description="The message text", min_length=1)
    image_base64: Optional[str] = Field(default=None, description="Base64-encoded image data (for vision analysis)")


# ── Triage Endpoint ───────────────────────────────────────────

class TriageRequest(BaseModel):
    """
    POST /api/triage
    Sent by the frontend on every user message during a triage session.
    """
    symptom:  str          = Field(..., description="User's current message (symptom or answer)", min_length=1)
    language: LanguageCode = Field(default="hi", description="User's preferred language")
    history:  list[ChatMessage] = Field(default=[], description="Previous conversation turns")

    # Optional image for visual symptom analysis (Gemini Vision)
    image_base64: Optional[str] = Field(default=None, description="Base64-encoded image for visual analysis")

    # Optional geolocation — used to find nearest emergency hospital if urgency=emergency
    lat: Optional[float] = Field(default=None, description="User latitude (optional)")
    lng: Optional[float] = Field(default=None, description="User longitude (optional)")

    class Config:
        json_schema_extra = {
            "example": {
                "symptom": "मुझे सीने में दर्द हो रहा है",
                "language": "hi",
                "history": [],
                "lat": 18.5204,
                "lng": 73.8567,
            }
        }


class UrgencyDisplay(BaseModel):
    """Display metadata for the frontend UrgencyBanner component."""
    level:  UrgencyLevel
    color:  str
    emoji:  str
    label:  str
    advice: str


class TriageResponse(BaseModel):
    """
    Response from POST /api/triage.
    During conversation: is_final=False, urgency fields are null.
    After final assessment: is_final=True, all urgency fields populated.
    """
    message:              str             = Field(..., description="Gemini's response in user's language")
    is_final:             bool            = Field(..., description="True when triage assessment is complete")
    urgency:              Optional[UrgencyLevel] = None
    recommend_specialty:  Optional[str]          = None
    go_to_hospital_now:   bool                   = False
    call_ambulance:       bool                   = False
    summary_for_doctor:   Optional[str]          = None
    urgency_display:      Optional[UrgencyDisplay] = None

    class Config:
        json_schema_extra = {
            "example": {
                "message": "आपकी स्थिति आपातकालीन है। कृपया तुरंत 108 पर कॉल करें।",
                "is_final": True,
                "urgency": "emergency",
                "recommend_specialty": "cardiology",
                "go_to_hospital_now": True,
                "call_ambulance": True,
                "summary_for_doctor": "Patient presents with acute chest pain at rest for 2 hours.",
                "urgency_display": {
                    "level": "emergency",
                    "color": "red",
                    "emoji": "🔴",
                    "label": "आपातकाल",
                    "advice": "अभी आपातकालीन कक्ष जाएं या 108 पर एम्बुलेंस बुलाएं।",
                },
            }
        }


# ── Chat Endpoint ─────────────────────────────────────────────

class ChatRequest(BaseModel):
    """
    POST /api/chat
    Generic chat turn — used for general health questions outside of triage flow.
    """
    message:    str          = Field(..., min_length=1)
    language:   LanguageCode = Field(default="hi")
    history:    list[ChatMessage] = Field(default=[])
    session_id: Optional[str]    = Field(default=None, description="Existing session UUID (optional)")

    class Config:
        json_schema_extra = {
            "example": {
                "message": "मुझे बुखार है",
                "language": "hi",
                "history": [],
            }
        }


class ChatResponse(BaseModel):
    """Response from POST /api/chat."""
    message:    str           = Field(..., description="AI response text")
    session_id: Optional[str] = None
    is_final:   bool          = False


# ── Summary Endpoint ──────────────────────────────────────────

class SummaryRequest(BaseModel):
    """
    POST /api/chat/summary
    Generate a doctor-ready symptom summary from full conversation history.
    """
    history:    list[ChatMessage] = Field(..., min_length=1)
    session_id: Optional[str]    = None


class SummaryResponse(BaseModel):
    """Response from POST /api/chat/summary."""
    chief_complaint:     str
    duration:            str
    severity:            str
    associated_symptoms: list[str]
    relevant_history:    str
    urgency:             UrgencyLevel
    full_summary:        str
