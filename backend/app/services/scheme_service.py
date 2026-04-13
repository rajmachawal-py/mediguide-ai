"""
MediGuide AI — Government Scheme Eligibility Service
Handles scheme matching, retrieval, and AI-powered explanations.

Functions:
    get_eligible_schemes() — filters schemes by user profile
    get_scheme_by_id()     — fetches a single scheme
    explain_scheme_for_user() — uses Gemini to explain a scheme
"""

import logging
import asyncio
from typing import Optional

from app.db.supabase_client import get_client
from app.services.gemini_service import explain_scheme

logger = logging.getLogger(__name__)


# ── Eligible Scheme Search ───────────────────────────────────

async def get_eligible_schemes(
    state: Optional[str] = None,
    income: Optional[int] = None,
    age: Optional[int] = None,
    gender: Optional[str] = None,
    condition: Optional[str] = None,
) -> list[dict]:
    """
    Find government schemes matching a user's eligibility profile.

    Filtering logic:
        1. SQL: active schemes only, state filter via array containment
        2. Python post-filter: income cap, age range, gender, condition

    This hybrid approach avoids complex array queries in Supabase
    while keeping SQL fast for the primary filter.

    Args:
        state:     Indian state (e.g. 'Maharashtra')
        income:    Annual income in INR
        age:       Patient age
        gender:    'male' | 'female' | 'other'
        condition: Medical condition (e.g. 'pregnancy', 'diabetes')

    Returns:
        List of scheme dicts that match the user's profile.
    """
    try:
        supabase = get_client()

        # Step 1: Fetch all active schemes from Supabase
        result = await asyncio.to_thread(
            lambda: supabase.table("schemes")
            .select("*")
            .eq("is_active", True)
            .order("name", desc=False)
            .execute()
        )
        schemes = result.data or []

        logger.info(f"Scheme search | total active schemes: {len(schemes)}")

        # Step 2: Python post-filtering for eligibility
        eligible = []
        for scheme in schemes:
            if not _matches_eligibility(scheme, state, income, age, gender, condition):
                continue
            eligible.append(scheme)

        logger.info(
            f"Scheme eligibility filter | "
            f"state={state} income={income} age={age} "
            f"gender={gender} condition={condition} | "
            f"matched: {len(eligible)}/{len(schemes)}"
        )

        return eligible

    except Exception as e:
        logger.error(f"Scheme eligibility error: {e}", exc_info=True)
        raise


# ── Single Scheme Detail ─────────────────────────────────────

async def get_scheme_by_id(scheme_id: str) -> Optional[dict]:
    """
    Fetch a single scheme by UUID.

    Args:
        scheme_id: Scheme UUID string

    Returns:
        Scheme dict, or None if not found.
    """
    try:
        supabase = get_client()

        result = await asyncio.to_thread(
            lambda: supabase.table("schemes")
            .select("*")
            .eq("id", scheme_id)
            .execute()
        )

        if not result.data:
            logger.warning(f"Scheme not found: {scheme_id}")
            return None

        logger.info(f"Scheme detail fetched: {result.data[0]['name']}")
        return result.data[0]

    except Exception as e:
        logger.error(f"Scheme detail error: {e}", exc_info=True)
        raise


# ── AI-Powered Scheme Explanation ────────────────────────────

async def explain_scheme_for_user(
    scheme_id: str,
    user_profile: dict,
    language: str = "hi",
) -> dict:
    """
    Use Gemini AI to explain a government scheme in the user's language.

    Args:
        scheme_id:    Scheme UUID
        user_profile: Dict with keys: state, age, gender, annual_income
        language:     Language code — "hi" | "mr" | "en"

    Returns:
        {
            "scheme_id": str,
            "scheme_name": str,
            "language": str,
            "explanations": [{ name, benefit, eligibility_met, how_to_apply, helpline, explanation }],
            "general_advice": str,
        }
    """
    try:
        # Fetch the scheme data
        scheme_data = await get_scheme_by_id(scheme_id)
        if not scheme_data:
            return None

        # Call Gemini for explanation
        ai_result = await explain_scheme(
            scheme_data=scheme_data,
            user_profile=user_profile,
            language=language,
        )

        return {
            "scheme_id": scheme_id,
            "scheme_name": scheme_data["name"],
            "language": language,
            "explanations": ai_result.get("schemes", []),
            "general_advice": ai_result.get("general_advice", ""),
        }

    except Exception as e:
        logger.error(f"Scheme explanation error: {e}", exc_info=True)
        raise


# ── Internal Helpers ─────────────────────────────────────────

def _matches_eligibility(
    scheme: dict,
    state: Optional[str],
    income: Optional[int],
    age: Optional[int],
    gender: Optional[str],
    condition: Optional[str],
) -> bool:
    """
    Check if a user profile matches a scheme's eligibility criteria.
    All filters are optional — if not provided, that criterion is skipped.
    """

    # 1. State filter
    #    eligibility_states = NULL means all India (passes)
    #    eligibility_states = ['Maharashtra'] means only Maharashtra
    if state and scheme.get("eligibility_states"):
        if state not in scheme["eligibility_states"]:
            return False

    # 2. Income filter
    #    max_annual_income = NULL means no income cap (passes)
    #    User income must be <= scheme's max
    if income is not None and scheme.get("max_annual_income") is not None:
        if income > scheme["max_annual_income"]:
            return False

    # 3. Age filter
    #    Check if user age falls within [min_age, max_age]
    if age is not None:
        min_age = scheme.get("min_age", 0)
        max_age = scheme.get("max_age", 120)
        if age < min_age or age > max_age:
            return False

    # 4. Gender filter
    #    applicable_genders = NULL means all genders (passes)
    if gender and scheme.get("applicable_genders"):
        if gender not in scheme["applicable_genders"]:
            return False

    # 5. Condition filter
    #    applicable_conditions = NULL means all conditions (passes)
    #    Check if user's condition is in the scheme's conditions list
    if condition and scheme.get("applicable_conditions"):
        condition_lower = condition.lower()
        scheme_conditions = [c.lower() for c in scheme["applicable_conditions"]]
        if not any(condition_lower in sc or sc in condition_lower for sc in scheme_conditions):
            return False

    return True
