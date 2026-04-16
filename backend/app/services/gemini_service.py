"""
MediGuide AI — Gemini AI Service (Vertex AI SDK)
Handles all interactions with Google Gemini via the Vertex AI SDK.
- Triage conversations (multilingual symptom assessment)
- Doctor-ready symptom summaries
- Government scheme explanations

Uses GOOGLE_APPLICATION_CREDENTIALS (service account JSON) for authentication.
"""

import json
import os
import re
import base64
import logging
from pathlib import Path
from functools import lru_cache
from typing import Optional

from app.config import settings

logger = logging.getLogger(__name__)

# ── RAG Knowledge Base ───────────────────────────────────────
from app.services.rag_service import retrieve_medical_context

# ── Gemini Model Configuration ───────────────────────────────

TRIAGE_MODEL = "gemini-2.5-flash"       # correct model for accurate triage
SUMMARY_MODEL = "gemini-2.5-flash"      # structured JSON output


# ── Prompt Loader ────────────────────────────────────────────

PROMPTS_DIR = Path(__file__).parent.parent / "prompts"


@lru_cache()
def _load_prompt(filename: str) -> str:
    """Load and cache a prompt file from the prompts directory."""
    path = PROMPTS_DIR / filename
    if not path.exists():
        raise FileNotFoundError(f"Prompt file not found: {path}")
    return path.read_text(encoding="utf-8").strip()


# ── Vertex AI Initialization ────────────────────────────────

_vertex_initialized = False


def _ensure_vertex_init():
    """Initialize Vertex AI SDK with service account credentials (once)."""
    global _vertex_initialized
    if _vertex_initialized:
        return

    import vertexai

    cred_path = settings.GOOGLE_APPLICATION_CREDENTIALS
    if cred_path and os.path.exists(cred_path):
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = cred_path
        logger.info(f"Service account loaded from: {cred_path}")
    else:
        raise RuntimeError(
            f"GOOGLE_APPLICATION_CREDENTIALS file not found at: {cred_path}. "
            "Set the correct path in your .env file."
        )

    project_id = settings.GCP_PROJECT_ID
    location = settings.GCP_LOCATION or "us-central1"

    if not project_id:
        raise RuntimeError(
            "GCP_PROJECT_ID is not set. Please set it in your .env file."
        )

    vertexai.init(project=project_id, location=location)
    _vertex_initialized = True
    logger.info(f"Vertex AI initialized | project={project_id} | location={location} | model={TRIAGE_MODEL}")


# ── Gemini Client Init ────────────────────────────────────────

def _get_triage_model():
    """Returns a configured Gemini model with the triage system prompt."""
    _ensure_vertex_init()
    from vertexai.generative_models import GenerativeModel, GenerationConfig, SafetySetting, HarmCategory, HarmBlockThreshold

    system_prompt = _load_prompt("triage_prompt.txt")
    return GenerativeModel(
        model_name=TRIAGE_MODEL,
        system_instruction=system_prompt,
        generation_config=GenerationConfig(
            temperature=0.4,        # low temp for consistent medical responses
            max_output_tokens=1024,
        ),
        safety_settings=[
            # Allow medical content — Gemini blocks some health topics by default
            SafetySetting(category=HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold=HarmBlockThreshold.BLOCK_ONLY_HIGH),
            SafetySetting(category=HarmCategory.HARM_CATEGORY_HARASSMENT, threshold=HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE),
            SafetySetting(category=HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold=HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE),
            SafetySetting(category=HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold=HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE),
        ],
    )


def _get_summary_model():
    """Returns a Gemini model configured for structured JSON output."""
    _ensure_vertex_init()
    from vertexai.generative_models import GenerativeModel, GenerationConfig

    return GenerativeModel(
        model_name=SUMMARY_MODEL,
        generation_config=GenerationConfig(
            temperature=0.1,        # near-zero for deterministic JSON output
            max_output_tokens=512,
        ),
    )


# ── History Format Helpers ────────────────────────────────────

def _build_gemini_history(history: list[dict]) -> list:
    """
    Converts frontend message history to Vertex AI Content objects.

    Frontend format:  [{"role": "user"|"assistant", "content": "..."}]
    Vertex AI format: [Content(role="user"|"model", parts=[Part.from_text("...")])]
    """
    from vertexai.generative_models import Content, Part

    gemini_history = []
    for msg in history:
        role = "model" if msg["role"] == "assistant" else "user"
        gemini_history.append(
            Content(role=role, parts=[Part.from_text(msg["content"])])
        )
    return gemini_history


# ── Core Functions ────────────────────────────────────────────

async def ask_triage(
    symptom_text: str,
    language: str,
    history: list[dict],
    image_base64: str = None,
) -> dict:
    """
    Send a user message to Gemini for triage assessment.
    Supports multimodal input when an image is provided.

    Args:
        symptom_text: The user's current message (symptom description or answer)
        language:     Language code — "hi" | "mr" | "en"
        history:      Previous conversation turns [{"role": ..., "content": ...}]
        image_base64: Optional base64-encoded image for visual symptom analysis

    Returns:
        {
            "message":     str,        # Gemini's response text (in user's language)
            "is_final":    bool,       # True if triage result JSON is present
            "urgency":     str | None, # "mild" | "moderate" | "emergency"
            "recommend_specialty": str | None,
            "go_to_hospital_now":  bool,
            "call_ambulance":      bool,
            "summary_for_doctor":  str | None,
            "raw_response":        str,        # full unprocessed Gemini text
        }
    """
    try:
        model = _get_triage_model()
        gemini_history = _build_gemini_history(history)

        # Start a chat session with the conversation history
        chat = model.start_chat(history=gemini_history)

        # Add language hint to the user's message
        language_hint = {
            "hi": "[User's language: Hindi. Respond in Hindi only.]",
            "mr": "[User's language: Marathi. Respond in Marathi only.]",
            "en": "[User's language: English. Respond in English only.]",
        }.get(language, "")

        # RAG: Retrieve relevant medical knowledge for the user's symptoms
        rag_context = retrieve_medical_context(symptom_text, language)
        if rag_context:
            logger.info(f"RAG: Retrieved medical context ({len(rag_context)} chars)")

        # Build message parts
        message_parts = []

        # If image is provided, add vision analysis instructions + image Part
        if image_base64:
            vision_prompt = (
                "[User has uploaded an image of their symptom. Analyze the image and "
                "incorporate your visual assessment into the triage. Describe what you "
                "see in the image in the user's language. If it's a skin condition, "
                "describe the appearance and suggest possible conditions. "
                "Always add a disclaimer that visual AI analysis is not a clinical diagnosis.]"
            )
            text_content = f"{language_hint}\n{vision_prompt}\n{symptom_text}" if language_hint else f"{vision_prompt}\n{symptom_text}"
            message_parts.append(text_content)

            # Decode base64 image and attach as Vertex AI Part
            try:
                from vertexai.generative_models import Part

                # Strip data URL prefix if present (e.g. "data:image/jpeg;base64,...")
                img_data = image_base64
                mime_type = "image/jpeg"  # default
                if img_data.startswith("data:"):
                    header, img_data = img_data.split(",", 1)
                    if "image/png" in header:
                        mime_type = "image/png"
                    elif "image/webp" in header:
                        mime_type = "image/webp"

                image_bytes = base64.b64decode(img_data)
                message_parts.append(Part.from_data(data=image_bytes, mime_type=mime_type))
                logger.info(f"Image attached to triage | size={len(image_bytes)} bytes | mime={mime_type}")
            except Exception as img_err:
                logger.warning(f"Failed to decode image, sending text-only: {img_err}")
                # Fall through — text-only if image parsing fails
        else:
            # Text-only message with RAG context
            parts = [p for p in [language_hint, rag_context, symptom_text] if p]
            text_content = "\n\n".join(parts)
            message_parts.append(text_content)

        # For image+text, use generate_content directly (chat sessions can fail with multimodal)
        if image_base64 and len(message_parts) > 1:
            response = model.generate_content(message_parts)
        else:
            response = chat.send_message(message_parts)

        raw_text = response.text

        # Strip language instruction tags that Gemini sometimes echoes back
        raw_text = _strip_language_tags(raw_text)

        # Parse if a JSON result block is embedded
        result_json = _extract_json_block(raw_text)

        if result_json and result_json.get("type") == "result":
            patient_msg = result_json.get("patient_message", raw_text)
            patient_msg = _strip_language_tags(patient_msg)
            # Final triage result
            return {
                "message": patient_msg,
                "is_final": True,
                "urgency": result_json.get("urgency"),
                "recommend_specialty": result_json.get("recommend_specialty"),
                "go_to_hospital_now": result_json.get("go_to_hospital_now", False),
                "call_ambulance": result_json.get("call_ambulance", False),
                "summary_for_doctor": result_json.get("summary_for_doctor"),
                "raw_response": raw_text,
            }
        else:
            # Still in follow-up question phase
            return {
                "message": raw_text,
                "is_final": False,
                "urgency": None,
                "recommend_specialty": None,
                "go_to_hospital_now": False,
                "call_ambulance": False,
                "summary_for_doctor": None,
                "raw_response": raw_text,
            }

    except Exception as e:
        logger.error(f"Gemini triage error: {e}", exc_info=True)
        raise


async def generate_summary(conversation_history: list[dict]) -> dict:
    """
    Generate a doctor-ready symptom summary from the full conversation.

    Args:
        conversation_history: Full list of {"role": ..., "content": ...} dicts

    Returns:
        Parsed summary dict (see summary_prompt.txt for schema)
    """
    try:
        model = _get_summary_model()
        summary_prompt = _load_prompt("summary_prompt.txt")

        # Format the conversation as readable text
        conversation_text = "\n".join(
            f"{msg['role'].upper()}: {msg['content']}"
            for msg in conversation_history
        )

        full_prompt = (
            f"{summary_prompt}\n\n"
            f"CONVERSATION TO SUMMARISE:\n{conversation_text}"
        )

        response = model.generate_content(full_prompt)
        raw_text = response.text

        result = _extract_json_block(raw_text)
        if not result:
            # Fallback: return raw text as summary
            return {"full_summary": raw_text, "urgency": "mild"}

        return result

    except Exception as e:
        logger.error(f"Gemini summary error: {e}")
        raise


async def explain_scheme(
    scheme_data: dict,
    user_profile: dict,
    language: str,
) -> dict:
    """
    Use Gemini to explain a government scheme in the user's language.

    Args:
        scheme_data:  Scheme dict from Supabase (name, description, benefit_amount, etc.)
        user_profile: Patient profile (age, state, income, gender)
        language:     Language code — "hi" | "mr" | "en"

    Returns:
        Parsed scheme explanation dict (see scheme_prompt.txt for schema)
    """
    try:
        model = _get_summary_model()
        scheme_prompt = _load_prompt("scheme_prompt.txt")

        context = (
            f"Patient Profile:\n"
            f"- State: {user_profile.get('state', 'Maharashtra')}\n"
            f"- Age: {user_profile.get('age', 'Unknown')}\n"
            f"- Gender: {user_profile.get('gender', 'Unknown')}\n"
            f"- Annual Income: ₹{user_profile.get('annual_income', 'Unknown')}\n"
            f"- Preferred Language: {language}\n\n"
            f"Scheme Details:\n{json.dumps(scheme_data, ensure_ascii=False, indent=2)}"
        )

        full_prompt = f"{scheme_prompt}\n\n{context}"
        response = model.generate_content(full_prompt)
        raw_text = response.text

        result = _extract_json_block(raw_text)
        if not result:
            return {"schemes": [], "general_advice": raw_text}

        return result

    except Exception as e:
        logger.error(f"Gemini scheme explanation error: {e}")
        raise


# ── Utility ───────────────────────────────────────────────────

def _strip_language_tags(text: str) -> str:
    """
    Remove language instruction tags that Gemini sometimes echoes back.
    E.g. "[User's language: English. Respond in English only.]\nActual response"
    """
    # Remove [User's language: ...] tags
    text = re.sub(r"\[User's language:.*?\]\s*", "", text, flags=re.IGNORECASE)
    # Remove [User has uploaded an image...] tags
    text = re.sub(r"\[User has uploaded.*?\]\s*", "", text, flags=re.IGNORECASE | re.DOTALL)
    return text.strip()


def _extract_json_block(text: str) -> Optional[dict]:
    """
    Extracts and parses the first JSON code block from Gemini's response text.
    Gemini sometimes wraps JSON in ```json ... ``` markers.
    """
    # Try extracting from ```json ... ``` block
    pattern = r"```(?:json)?\s*(\{.*?\})\s*```"
    match = re.search(pattern, text, re.DOTALL)

    if match:
        json_str = match.group(1)
    else:
        # Try finding a raw JSON object in the text
        match = re.search(r"(\{.*\})", text, re.DOTALL)
        if match:
            json_str = match.group(1)
        else:
            return None

    try:
        return json.loads(json_str)
    except json.JSONDecodeError as e:
        logger.warning(f"Failed to parse JSON from Gemini response: {e}\nText: {json_str[:200]}")
        return None