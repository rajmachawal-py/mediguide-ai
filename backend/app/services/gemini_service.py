"""
MediGuide AI — Gemini AI Service
Handles all interactions with the Google Gemini API.
- Triage conversations (multilingual symptom assessment)
- Doctor-ready symptom summaries
- Government scheme explanations
"""

import json
import re
import logging
from pathlib import Path
from functools import lru_cache
from typing import Optional

import google.generativeai as genai

from app.config import settings

logger = logging.getLogger(__name__)

# ── Gemini Model Configuration ───────────────────────────────

TRIAGE_MODEL = "gemini-2.5-flash-lite"  # fast responses for chat
SUMMARY_MODEL = "gemini-2.5-flash-lite" # structured JSON output


# ── Prompt Loader ────────────────────────────────────────────

PROMPTS_DIR = Path(__file__).parent.parent / "prompts"


@lru_cache()
def _load_prompt(filename: str) -> str:
    """Load and cache a prompt file from the prompts directory."""
    path = PROMPTS_DIR / filename
    if not path.exists():
        raise FileNotFoundError(f"Prompt file not found: {path}")
    return path.read_text(encoding="utf-8").strip()


# ── Gemini Client Init ────────────────────────────────────────

def _get_triage_model() -> genai.GenerativeModel:
    """Returns a configured Gemini model with the triage system prompt."""
    genai.configure(api_key=settings.GEMINI_API_KEY)
    system_prompt = _load_prompt("triage_prompt.txt")
    return genai.GenerativeModel(
        model_name=TRIAGE_MODEL,
        system_instruction=system_prompt,
        generation_config=genai.GenerationConfig(
            temperature=0.4,        # low temp for consistent medical responses
            max_output_tokens=1024,
        ),
        safety_settings=[
            # Allow medical content — Gemini blocks some health topics by default
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_ONLY_HIGH"},
            {"category": "HARM_CATEGORY_HARASSMENT",        "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
            {"category": "HARM_CATEGORY_HATE_SPEECH",       "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
        ],
    )


def _get_summary_model() -> genai.GenerativeModel:
    """Returns a Gemini model configured for structured JSON output."""
    genai.configure(api_key=settings.GEMINI_API_KEY)
    return genai.GenerativeModel(
        model_name=SUMMARY_MODEL,
        generation_config=genai.GenerationConfig(
            temperature=0.1,        # near-zero for deterministic JSON output
            max_output_tokens=512,
        ),
    )


# ── History Format Helpers ────────────────────────────────────

def _build_gemini_history(history: list[dict]) -> list[dict]:
    """
    Converts frontend message history to Gemini's expected format.

    Frontend format:  [{"role": "user"|"assistant", "content": "..."}]
    Gemini format:    [{"role": "user"|"model",      "parts": [{"text": "..."}]}]
    """
    gemini_history = []
    for msg in history:
        role = "model" if msg["role"] == "assistant" else "user"
        gemini_history.append({
            "role": role,
            "parts": [{"text": msg["content"]}],
        })
    return gemini_history


# ── Core Functions ────────────────────────────────────────────

async def ask_triage(
    symptom_text: str,
    language: str,
    history: list[dict],
) -> dict:
    """
    Send a user message to Gemini for triage assessment.

    Args:
        symptom_text: The user's current message (symptom description or answer)
        language:     Language code — "hi" | "mr" | "en"
        history:      Previous conversation turns [{"role": ..., "content": ...}]

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

        full_message = f"{language_hint}\n{symptom_text}" if language_hint else symptom_text

        response = chat.send_message(full_message)
        raw_text = response.text

        # Parse if a JSON result block is embedded
        result_json = _extract_json_block(raw_text)

        if result_json and result_json.get("type") == "result":
            # Final triage result
            return {
                "message": result_json.get("patient_message", raw_text),
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
        logger.error(f"Gemini triage error: {e}")
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
