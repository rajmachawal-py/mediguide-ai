"""
MediGuide AI — Chat Router
POST /api/chat          — general health chat (stateless, history passed by client)
POST /api/chat/summary  — generate doctor-ready summary from full conversation
"""

import logging
from fastapi import APIRouter, HTTPException, status

from app.models.chat_models import (
    ChatRequest,
    ChatResponse,
    SummaryRequest,
    SummaryResponse,
)
from app.services.gemini_service import ask_triage, generate_summary

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post(
    "/chat",
    response_model=ChatResponse,
    summary="General health chat turn",
    description=(
        "Send a single chat message with conversation history. "
        "Gemini responds as a triage nurse. This is the same AI as /triage "
        "but without the urgency classification post-processing — "
        "use /triage when you need urgency metadata."
    ),
)
async def chat(request: ChatRequest) -> ChatResponse:
    """
    Stateless chat endpoint.
    The client is responsible for maintaining and sending the full history[] on each turn.
    No server-side session storage at this endpoint.
    """
    try:
        logger.info(
            f"Chat request | lang={request.language} | "
            f"turns={len(request.history)} | "
            f"preview={request.message[:60]!r}"
        )

        # Reuse the same Gemini triage function — same AI, different post-processing
        gemini_result = await ask_triage(
            symptom_text=request.message,
            language=request.language,
            history=[msg.model_dump() for msg in request.history],
        )

        return ChatResponse(
            message=gemini_result["message"],
            session_id=request.session_id,
            is_final=gemini_result["is_final"],
        )

    except Exception as e:
        logger.error(f"Chat endpoint error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Chat response failed. Please try again.",
        )


@router.post(
    "/chat/summary",
    response_model=SummaryResponse,
    summary="Generate doctor-ready symptom summary",
    description=(
        "Takes the full conversation history and generates a structured, "
        "professional symptom summary in English that can be printed and "
        "handed to a doctor at hospital reception."
    ),
)
async def get_summary(request: SummaryRequest) -> SummaryResponse:
    """
    Generates a structured doctor-ready summary.

    Expected to be called:
    - After urgency is classified as moderate or emergency
    - When the user opts to 'prepare for my hospital visit'
    - Before appointment booking to attach notes

    The summary is always in English regardless of the conversation language,
    since it's intended for Indian medical professionals.
    """
    try:
        logger.info(
            f"Summary request | session={request.session_id} | "
            f"turns={len(request.history)}"
        )

        if len(request.history) < 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least 2 conversation turns are required to generate a summary.",
            )

        result = await generate_summary(
            conversation_history=[msg.model_dump() for msg in request.history]
        )

        # Validate required fields exist in Gemini's response
        required_fields = [
            "chief_complaint", "duration", "severity",
            "associated_symptoms", "relevant_history",
            "urgency", "full_summary",
        ]
        missing = [f for f in required_fields if f not in result]
        if missing:
            logger.warning(f"Summary missing fields: {missing} — using fallback")
            # Fill in safe defaults for missing fields
            result.setdefault("chief_complaint", "Symptom not specified")
            result.setdefault("duration", "Not specified")
            result.setdefault("severity", "Not specified")
            result.setdefault("associated_symptoms", [])
            result.setdefault("relevant_history", "None reported")
            result.setdefault("urgency", "mild")
            result.setdefault("full_summary", result.get("full_summary", "Summary unavailable."))

        return SummaryResponse(**result)

    except HTTPException:
        raise  # re-raise validation errors as-is
    except Exception as e:
        logger.error(f"Summary endpoint error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Summary generation failed. Please try again.",
        )
