"""
MediGuide AI — Sarvam AI Service
Handles Speech-to-Text (STT) and Text-to-Speech (TTS) via Sarvam AI REST API.

STT: POST https://api.sarvam.ai/speech-to-text  (model: saaras:v3)
TTS: POST https://api.sarvam.ai/text-to-speech  (model: bulbul:v3)

Auth: api-subscription-key header
Docs: https://docs.sarvam.ai/api-reference-docs
"""

import base64
import logging
from typing import Optional

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

# ── Constants ─────────────────────────────────────────────────

SARVAM_BASE_URL = "https://api.sarvam.ai"
STT_ENDPOINT = f"{SARVAM_BASE_URL}/speech-to-text"
TTS_ENDPOINT = f"{SARVAM_BASE_URL}/text-to-speech"

STT_MODEL = "saaras:v3"         # latest, supports transcribe/translate/codemix modes
TTS_MODEL = "bulbul:v3"         # latest, 30+ voices, pace + temperature control
TTS_SPEAKER = "shubh"           # default male voice for bulbul:v3
TTS_SAMPLE_RATE = 24000         # Hz — default for bulbul:v3

# MediGuide language codes → Sarvam BCP-47 language codes
LANGUAGE_MAP = {
    "hi": "hi-IN",   # Hindi
    "mr": "mr-IN",   # Marathi
    "en": "en-IN",   # English (Indian)
}

# Request timeout in seconds (STT can be slow for longer audio)
REQUEST_TIMEOUT = 30.0


# ── Helpers ───────────────────────────────────────────────────

def _get_headers() -> dict:
    """Standard auth headers for Sarvam API calls."""
    return {
        "api-subscription-key": settings.SARVAM_API_KEY,
    }


def _to_sarvam_lang(language: str) -> str:
    """
    Convert MediGuide language code (hi/mr/en) to Sarvam BCP-47 format.
    Falls back to 'unknown' for auto-detection if mapping not found.
    """
    return LANGUAGE_MAP.get(language, "unknown")


# ── Speech-to-Text ────────────────────────────────────────────

async def speech_to_text(
    audio_bytes: bytes,
    filename: str = "audio.wav",
    language: Optional[str] = None,
) -> dict:
    """
    Transcribe audio to text using Sarvam AI STT (saaras:v3).

    Args:
        audio_bytes: Raw audio file bytes (WAV, MP3, AAC, OGG, WebM, etc.)
        filename:    Original filename — used for codec detection by Sarvam
        language:    MediGuide language code ('hi', 'mr', 'en') or None for auto-detect

    Returns:
        {
            "transcript":          str,          # transcribed text
            "language_code":       str,          # detected BCP-47 language (e.g. 'hi-IN')
            "language_confidence": float | None, # 0.0–1.0 confidence score
        }

    Raises:
        httpx.HTTPStatusError on API errors
        Exception on network/parsing failures
    """
    try:
        sarvam_lang = _to_sarvam_lang(language) if language else "unknown"

        # Build multipart form data matching Sarvam API spec
        files = {
            "file": (filename, audio_bytes),
        }
        data = {
            "model": STT_MODEL,
            "language_code": sarvam_lang,
            "mode": "transcribe",  # standard transcription with formatting
        }

        logger.info(
            f"Sarvam STT request | model={STT_MODEL} | "
            f"lang={sarvam_lang} | file={filename} | "
            f"size={len(audio_bytes)} bytes"
        )

        async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
            response = await client.post(
                STT_ENDPOINT,
                headers=_get_headers(),
                files=files,
                data=data,
            )
            response.raise_for_status()

        result = response.json()

        transcript = result.get("transcript", "")
        detected_lang = result.get("language_code")
        confidence = result.get("language_probability")

        logger.info(
            f"Sarvam STT success | lang={detected_lang} | "
            f"confidence={confidence} | "
            f"transcript_preview={transcript[:80]!r}"
        )

        return {
            "transcript": transcript,
            "language_code": detected_lang,
            "language_confidence": confidence,
        }

    except httpx.HTTPStatusError as e:
        logger.error(
            f"Sarvam STT API error: {e.response.status_code} — "
            f"{e.response.text[:300]}"
        )
        raise
    except Exception as e:
        logger.error(f"Sarvam STT error: {e}", exc_info=True)
        raise


# ── Text-to-Speech ────────────────────────────────────────────

async def text_to_speech(
    text: str,
    language: str = "hi",
    speaker: str = TTS_SPEAKER,
    pace: float = 1.0,
) -> bytes:
    """
    Convert text to speech audio using Sarvam AI TTS (bulbul:v3).

    Args:
        text:      Text to synthesize (max 2500 chars for bulbul:v3).
                   Supports code-mixed text (Hindi + English).
        language:  MediGuide language code ('hi', 'mr', 'en')
        speaker:   Voice name (default: 'shubh'). Options for bulbul:v3:
                   shubh, aditya, ritu, priya, neha, rahul, pooja, rohan, etc.
        pace:      Speech speed, 0.5 (slow) to 2.0 (fast). Default 1.0.

    Returns:
        Raw audio bytes (WAV format) decoded from Sarvam's base64 response.

    Raises:
        httpx.HTTPStatusError on API errors
        ValueError if text exceeds character limit
        Exception on network/parsing failures
    """
    # Validate input length
    if len(text) > 2500:
        raise ValueError(
            f"Text exceeds bulbul:v3 limit of 2500 characters "
            f"(got {len(text)}). Split into smaller chunks."
        )

    try:
        sarvam_lang = _to_sarvam_lang(language)

        payload = {
            "inputs": [text],
            "target_language_code": sarvam_lang,
            "model": TTS_MODEL,
            "speaker": speaker,
            "pace": max(0.5, min(2.0, pace)),  # clamp to valid range
            "sample_rate": TTS_SAMPLE_RATE,
        }

        logger.info(
            f"Sarvam TTS request | model={TTS_MODEL} | "
            f"lang={sarvam_lang} | speaker={speaker} | "
            f"pace={pace} | text_len={len(text)}"
        )

        async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
            response = await client.post(
                TTS_ENDPOINT,
                headers={
                    **_get_headers(),
                    "Content-Type": "application/json",
                },
                json=payload,
            )
            response.raise_for_status()

        result = response.json()

        # Sarvam returns base64-encoded audio in result["audios"][0]
        audios = result.get("audios", [])
        if not audios:
            raise ValueError("Sarvam TTS returned empty audios array")

        audio_b64 = audios[0]
        audio_bytes = base64.b64decode(audio_b64)

        logger.info(
            f"Sarvam TTS success | audio_size={len(audio_bytes)} bytes"
        )

        return audio_bytes

    except httpx.HTTPStatusError as e:
        logger.error(
            f"Sarvam TTS API error: {e.response.status_code} — "
            f"{e.response.text[:300]}"
        )
        raise
    except Exception as e:
        logger.error(f"Sarvam TTS error: {e}", exc_info=True)
        raise
