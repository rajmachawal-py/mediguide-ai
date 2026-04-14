"""
MediGuide AI — Triage Service
Handles urgency classification and emergency keyword detection.

This service adds a rule-based safety layer ON TOP of Gemini's AI response.
Even if Gemini misclassifies, critical emergency keywords trigger escalation.
"""

import re
import logging
from typing import Literal

logger = logging.getLogger(__name__)

# ── Type Alias ────────────────────────────────────────────────

UrgencyLevel = Literal["mild", "moderate", "emergency"]


# ── Emergency Keyword Rules ───────────────────────────────────
# These are checked BEFORE and AFTER Gemini's classification.
# If matched, urgency is forced to "emergency" regardless of AI output.

EMERGENCY_KEYWORDS = {
    # English
    "chest pain", "chest pressure", "chest tightness",
    "can't breathe", "cannot breathe", "difficulty breathing",
    "shortness of breath", "breathlessness",
    "stroke", "face drooping", "arm weakness", "speech difficulty",
    "unconscious", "unresponsive", "fainted", "fainting",
    "seizure", "convulsion", "fitting",
    "severe bleeding", "uncontrolled bleeding",
    "anaphylaxis", "allergic reaction", "throat closing",
    "overdose", "poisoning", "swallowed",
    "suicidal", "want to die", "kill myself",
    "not moving", "baby not moving", "no fetal movement",

    # Hindi (Devanagari)
    "सीने में दर्द", "छाती में दर्द", "सांस नहीं आ रही",
    "सांस लेने में तकलीफ", "बेहोश", "दौरा", "मिर्गी",
    "खून बंद नहीं हो रहा", "जहर", "आत्महत्या",
    "मरना चाहता", "मरना चाहती",

    # Marathi (Devanagari)
    "छातीत दुखत", "श्वास घेता येत नाही", "श्वास लागत नाही",
    "बेशुद्ध", "झटका", "फेफरे", "रक्त थांबत नाही",
    "विष", "आत्महत्या", "मरायचे आहे",
}

MODERATE_KEYWORDS = {
    # English
    "high fever", "fever above", "vomiting", "vomiting blood",
    "blood in urine", "blood in stool", "severe headache",
    "sudden headache", "severe stomach pain", "abdominal pain",
    "cannot walk", "can't walk", "broken bone", "fracture",
    "eye pain", "vision loss", "hearing loss",

    # Hindi
    "तेज बुखार", "खून की उल्टी", "पेशाब में खून", "टट्टी में खून",
    "तेज सिरदर्द", "पेट में तेज दर्द", "चल नहीं पा रहा",

    # Marathi
    "जास्त ताप", "रक्ताची उलटी", "लघवीत रक्त", "शौचात रक्त",
    "तीव्र डोकेदुखी", "तीव्र पोटदुखी", "चालता येत नाही",
}


# ── Main Classification Function ──────────────────────────────

def classify_urgency(
    user_text: str,
    gemini_urgency: str | None,
) -> UrgencyLevel:
    """
    Determine final urgency level by combining:
    1. Rule-based emergency keyword scan (hard override)
    2. Gemini's AI classification (from the JSON result block)

    The rule-based scan acts as a safety net — it can ONLY upgrade urgency,
    never downgrade it. This prevents Gemini from under-triaging critical cases.

    Args:
        user_text:       The full user message text to scan for keywords
        gemini_urgency:  The urgency string from Gemini's JSON output

    Returns:
        Final urgency level: "mild" | "moderate" | "emergency"
    """
    text_lower = user_text.lower()

    # 1. Emergency keyword hard override
    for keyword in EMERGENCY_KEYWORDS:
        if keyword.lower() in text_lower:
            logger.info(f"Emergency keyword detected: '{keyword}' → forcing 'emergency'")
            return "emergency"

    # 2. Moderate keyword check (can upgrade mild → moderate)
    if gemini_urgency == "mild":
        for keyword in MODERATE_KEYWORDS:
            if keyword.lower() in text_lower:
                logger.info(f"Moderate keyword detected: '{keyword}' → upgrading to 'moderate'")
                return "moderate"

    # 3. Trust Gemini's classification
    if gemini_urgency in ("mild", "moderate", "emergency"):
        return gemini_urgency  # type: ignore

    # 4. Safe default if Gemini returned nothing
    if gemini_urgency is not None:
        logger.warning(f"Gemini urgency was invalid: '{gemini_urgency}' → defaulting to 'moderate'")
    return "moderate"


def is_emergency(urgency: str) -> bool:
    """Quick check for emergency urgency level."""
    return urgency == "emergency"


def needs_immediate_visit(urgency: str) -> bool:
    """Returns True if patient should go to hospital today."""
    return urgency in ("moderate", "emergency")


def get_urgency_display(urgency: UrgencyLevel, language: str) -> dict:
    """
    Returns display metadata for the urgency level.
    Used by the frontend UrgencyBanner component.

    Returns:
        {
            "level":   urgency string,
            "color":   CSS color hint,
            "emoji":   indicator emoji,
            "label":   human-readable label in user's language,
            "advice":  short action advice in user's language,
        }
    """
    display_map = {
        "en": {
            "mild": {
                "color": "green", "emoji": "🟢",
                "label": "Mild",
                "advice": "You can rest at home. See a doctor within 2-3 days if symptoms persist.",
            },
            "moderate": {
                "color": "amber", "emoji": "🟡",
                "label": "Moderate",
                "advice": "Please visit a clinic or OPD today. Do not delay.",
            },
            "emergency": {
                "color": "red", "emoji": "🔴",
                "label": "Emergency",
                "advice": "Go to the emergency room NOW or call ambulance 108 immediately.",
            },
        },
        "hi": {
            "mild": {
                "color": "green", "emoji": "🟢",
                "label": "सामान्य",
                "advice": "घर पर आराम करें। यदि लक्षण 2-3 दिन में ठीक न हों तो डॉक्टर से मिलें।",
            },
            "moderate": {
                "color": "amber", "emoji": "🟡",
                "label": "मध्यम",
                "advice": "आज ही क्लिनिक या OPD जाएं। देरी न करें।",
            },
            "emergency": {
                "color": "red", "emoji": "🔴",
                "label": "आपातकाल",
                "advice": "अभी आपातकालीन कक्ष जाएं या 108 पर एम्बुलेंस बुलाएं।",
            },
        },
        "mr": {
            "mild": {
                "color": "green", "emoji": "🟢",
                "label": "सौम्य",
                "advice": "घरी आराम करा. 2-3 दिवसांत लक्षणे बरी न झाल्यास डॉक्टरांना भेटा.",
            },
            "moderate": {
                "color": "amber", "emoji": "🟡",
                "label": "मध्यम",
                "advice": "आज क्लिनिक किंवा OPD ला जा. उशीर करू नका.",
            },
            "emergency": {
                "color": "red", "emoji": "🔴",
                "label": "आपत्कालीन",
                "advice": "आत्ताच आपत्कालीन विभागात जा किंवा 108 वर ॲम्बुलन्स बोलवा.",
            },
        },
    }

    lang = language if language in display_map else "en"
    urgency_safe = urgency if urgency in ("mild", "moderate", "emergency") else "moderate"

    return {
        "level": urgency_safe,
        **display_map[lang][urgency_safe],
    }
