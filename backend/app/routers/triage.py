"""
MediGuide AI — Triage Router
POST /api/triage   — main symptom assessment endpoint

Flow:
  1. Receive user symptom + conversation history
  2. Run rule-based emergency keyword scan (triage_service)
  3. Send to Gemini for AI triage (gemini_service)
  4. Apply final urgency classification (rule-based safety layer)
  5. Return structured response with urgency display metadata
"""

import logging
from fastapi import APIRouter, HTTPException, status

from app.models.chat_models import TriageRequest, TriageResponse, UrgencyDisplay
from app.services.gemini_service import ask_triage
from app.services.triage_service import classify_urgency, get_urgency_display

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post(
    "/triage",
    response_model=TriageResponse,
    summary="Assess symptom urgency",
    description=(
        "Send a user symptom message and conversation history to receive a "
        "triage assessment. Returns a follow-up question OR a final urgency "
        "classification with hospital recommendation. Supports Hindi, Marathi, English."
    ),
)
async def triage_symptom(request: TriageRequest) -> TriageResponse:
    """
    Main triage endpoint — the heart of MediGuide AI.

    - During conversation: returns `is_final=False` with a follow-up question.
    - After 3-5 turns: returns `is_final=True` with urgency, specialty, and display data.
    - Emergency keywords in ANY language trigger immediate emergency classification.
    """
    try:
        logger.info(
            f"Triage request | lang={request.language} | "
            f"history_turns={len(request.history)} | "
            f"symptom_preview={request.symptom[:60]!r}"
        )

        # Step 1: Pre-scan for emergency keywords before calling Gemini
        # This is a fast, low-cost safety check that catches obvious emergencies
        # even before we spend an API call on Gemini.
        pre_scan_urgency = classify_urgency(
            user_text=request.symptom,
            gemini_urgency=None,   # no Gemini response yet
        )

        # If keyword scan already detected emergency, we can skip Gemini entirely
        # for the urgency level, but we still call Gemini for the user-facing message.

        # Step 2: Call Gemini for the AI triage response
        gemini_result = await ask_triage(
            symptom_text=request.symptom,
            language=request.language,
            history=[msg.model_dump() for msg in request.history],
            image_base64=request.image_base64,
        )

        # Step 3: Determine final urgency using combined rule + AI classification
        final_urgency = classify_urgency(
            user_text=request.symptom,
            gemini_urgency=gemini_result.get("urgency"),
        )

        # If keyword scan found emergency but Gemini isn't final yet,
        # force an immediate final response
        if pre_scan_urgency == "emergency" and not gemini_result["is_final"]:
            logger.warning("Emergency keywords detected but Gemini not final — forcing emergency result")
            gemini_result["is_final"] = True
            gemini_result["urgency"] = "emergency"
            gemini_result["go_to_hospital_now"] = True
            gemini_result["call_ambulance"] = True
            gemini_result["recommend_specialty"] = "emergency"

        # Step 4: Build urgency display metadata for frontend
        urgency_display = None
        if gemini_result["is_final"] and final_urgency:
            display_data = get_urgency_display(final_urgency, request.language)
            urgency_display = UrgencyDisplay(**display_data)

        # Step 5: Build and return response
        return TriageResponse(
            message=gemini_result["message"],
            is_final=gemini_result["is_final"],
            urgency=final_urgency if gemini_result["is_final"] else None,
            recommend_specialty=gemini_result.get("recommend_specialty"),
            go_to_hospital_now=gemini_result.get("go_to_hospital_now", False),
            call_ambulance=gemini_result.get("call_ambulance", False),
            summary_for_doctor=gemini_result.get("summary_for_doctor"),
            urgency_display=urgency_display,
        )

    except Exception as e:
        logger.error(f"Triage endpoint error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Triage assessment failed. Please try again.",
        )
