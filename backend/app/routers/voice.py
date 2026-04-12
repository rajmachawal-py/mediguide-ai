"""
MediGuide AI — Voice Router
POST /api/voice/stt   — Speech-to-Text (audio upload → transcript)
POST /api/voice/tts   — Text-to-Speech (text → audio stream)

Uses Sarvam AI for Indian language STT/TTS (Hindi, Marathi, English).
"""

import logging
from typing import Optional

from fastapi import APIRouter, File, Form, UploadFile, HTTPException, status
from fastapi.responses import Response
from pydantic import BaseModel, Field

from app.services.sarvam_service import speech_to_text, text_to_speech

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Request / Response Models ─────────────────────────────────

class TTSRequest(BaseModel):
    """Request body for POST /api/voice/tts."""
    text:     str   = Field(..., min_length=1, max_length=2500, description="Text to synthesize")
    language: str   = Field(default="hi", description="Language code: 'hi', 'mr', or 'en'")
    speaker:  str   = Field(default="shubh", description="Voice name (bulbul:v3 voices)")
    pace:     float = Field(default=1.0, ge=0.5, le=2.0, description="Speech speed (0.5–2.0)")

    class Config:
        json_schema_extra = {
            "example": {
                "text": "आपको सीने में दर्द कब से हो रहा है?",
                "language": "hi",
                "speaker": "shubh",
                "pace": 1.0,
            }
        }


class STTResponse(BaseModel):
    """Response body for POST /api/voice/stt."""
    transcript:          str            = Field(..., description="Transcribed text")
    language_code:       Optional[str]  = Field(default=None, description="Detected language (BCP-47)")
    language_confidence: Optional[float] = Field(default=None, description="Detection confidence (0–1)")

    class Config:
        json_schema_extra = {
            "example": {
                "transcript": "मुझे सीने में दर्द हो रहा है",
                "language_code": "hi-IN",
                "language_confidence": 0.95,
            }
        }


# ── STT Endpoint ──────────────────────────────────────────────

@router.post(
    "/voice/stt",
    response_model=STTResponse,
    summary="Speech to Text",
    description=(
        "Upload an audio file to transcribe speech to text. "
        "Supports WAV, MP3, AAC, OGG, WebM, and more. "
        "Optimized for Hindi, Marathi, and English. "
        "Auto-detects language if not specified."
    ),
)
async def voice_stt(
    file: UploadFile = File(..., description="Audio file (WAV, MP3, AAC, OGG, WebM, etc.)"),
    language: Optional[str] = Form(default=None, description="Language hint: 'hi', 'mr', 'en', or omit for auto-detect"),
) -> STTResponse:
    """
    Transcribe uploaded audio to text using Sarvam AI (saaras:v3).

    - Accepts audio files up to ~30 seconds for real-time transcription.
    - Auto-detects spoken language if `language` is not provided.
    - Returns transcript text with detected language code and confidence score.
    """
    try:
        # Validate file type
        if file.content_type and not file.content_type.startswith(("audio/", "video/")):
            # WebM can come as video/webm from browser MediaRecorder
            if "webm" not in (file.content_type or "") and "octet" not in (file.content_type or ""):
                logger.warning(f"Unexpected content type: {file.content_type}")

        # Read audio bytes
        audio_bytes = await file.read()

        if not audio_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Empty audio file uploaded.",
            )

        logger.info(
            f"STT request | filename={file.filename} | "
            f"content_type={file.content_type} | "
            f"size={len(audio_bytes)} bytes | lang_hint={language}"
        )

        # Call Sarvam STT service
        result = await speech_to_text(
            audio_bytes=audio_bytes,
            filename=file.filename or "audio.wav",
            language=language,
        )

        return STTResponse(
            transcript=result["transcript"],
            language_code=result.get("language_code"),
            language_confidence=result.get("language_confidence"),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"STT endpoint error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Speech-to-text failed. Please try again.",
        )


# ── TTS Endpoint ──────────────────────────────────────────────

@router.post(
    "/voice/tts",
    summary="Text to Speech",
    description=(
        "Convert text to spoken audio in Hindi, Marathi, or English. "
        "Returns WAV audio bytes. Supports code-mixed text (Hinglish). "
        "Max 2500 characters per request."
    ),
    responses={
        200: {
            "content": {"audio/wav": {}},
            "description": "WAV audio file",
        }
    },
)
async def voice_tts(request: TTSRequest) -> Response:
    """
    Convert text to speech using Sarvam AI TTS (bulbul:v3).

    - Returns raw WAV audio as a binary response.
    - Frontend can play directly or save as file.
    - Supports 30+ voice options.
    """
    try:
        logger.info(
            f"TTS request | lang={request.language} | "
            f"speaker={request.speaker} | pace={request.pace} | "
            f"text_len={len(request.text)}"
        )

        audio_bytes = await text_to_speech(
            text=request.text,
            language=request.language,
            speaker=request.speaker,
            pace=request.pace,
        )

        return Response(
            content=audio_bytes,
            media_type="audio/wav",
            headers={
                "Content-Disposition": "inline; filename=tts_output.wav",
                "Content-Length": str(len(audio_bytes)),
            },
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"TTS endpoint error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Text-to-speech failed. Please try again.",
        )
