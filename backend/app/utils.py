"""
MediGuide AI — Utility Functions
Common helper functions used across the backend.
"""

import re
import logging
from typing import Optional

logger = logging.getLogger(__name__)


def sanitize_phone(phone: str) -> str:
    """
    Normalize an Indian phone number to +91XXXXXXXXXX format.

    Examples:
        '98765 43210'   → '+919876543210'
        '+919876543210' → '+919876543210'
        '09876543210'   → '+919876543210'
    """
    digits = re.sub(r"[^\d]", "", phone)

    # Remove leading 0 (trunk prefix)
    if digits.startswith("0"):
        digits = digits[1:]

    # Remove leading 91 country code if present
    if digits.startswith("91") and len(digits) > 10:
        digits = digits[2:]

    if len(digits) != 10:
        raise ValueError(f"Invalid Indian phone number: {phone}")

    return f"+91{digits}"


def truncate_text(text: str, max_length: int = 200, suffix: str = "...") -> str:
    """Truncate text to a max length, appending suffix if truncated."""
    if len(text) <= max_length:
        return text
    return text[: max_length - len(suffix)] + suffix


def detect_language_from_text(text: str) -> str:
    """
    Basic language detection based on Unicode script.

    Returns:
        'hi' if Devanagari script detected (Hindi/Marathi)
        'en' otherwise (default)

    Note: Cannot distinguish Hindi from Marathi by script alone.
    For accurate detection, use Sarvam AI's language detection.
    """
    devanagari_count = sum(1 for ch in text if "\u0900" <= ch <= "\u097F")
    total_alpha = sum(1 for ch in text if ch.isalpha())

    if total_alpha == 0:
        return "en"

    devanagari_ratio = devanagari_count / total_alpha

    if devanagari_ratio > 0.3:
        return "hi"  # Devanagari detected (could be Hindi or Marathi)

    return "en"


def format_urgency_label(urgency: str, language: str = "en") -> str:
    """Return human-readable urgency label in the given language."""
    labels = {
        "en": {"mild": "🟢 Mild", "moderate": "🟡 Moderate", "emergency": "🔴 Emergency"},
        "hi": {"mild": "🟢 सामान्य", "moderate": "🟡 मध्यम", "emergency": "🔴 आपातकाल"},
        "mr": {"mild": "🟢 सौम्य", "moderate": "🟡 मध्यम", "emergency": "🔴 आपत्कालीन"},
    }
    lang_labels = labels.get(language, labels["en"])
    return lang_labels.get(urgency, urgency)
