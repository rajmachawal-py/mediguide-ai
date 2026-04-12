"""
MediGuide AI — Government Scheme Router
Endpoints for scheme discovery, detail, and AI-powered explanations.

Endpoints:
    GET /api/schemes/eligible      — find schemes matching user profile
    GET /api/schemes/{id}          — single scheme detail
    GET /api/schemes/{id}/explain  — AI explanation in user's language
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from app.services.scheme_service import (
    get_eligible_schemes,
    get_scheme_by_id,
    explain_scheme_for_user,
)
from app.models.scheme_models import (
    Scheme,
    SchemeListResponse,
    SchemeExplainResponse,
)

router = APIRouter()


# ── GET /schemes/eligible ────────────────────────────────────

@router.get(
    "/schemes/eligible",
    response_model=SchemeListResponse,
    summary="Find eligible government schemes",
    description=(
        "Returns government healthcare schemes that match the user's profile. "
        "All filters are optional — omit any field to skip that criterion.\n\n"
        "**Example**: `?state=Maharashtra&income=80000&age=30&gender=female&condition=pregnancy`"
    ),
)
async def get_eligible(
    state: Optional[str] = Query(
        default=None,
        description="Indian state (e.g. 'Maharashtra')",
    ),
    income: Optional[int] = Query(
        default=None,
        description="Annual income in INR",
    ),
    age: Optional[int] = Query(
        default=None,
        description="Patient age",
    ),
    gender: Optional[str] = Query(
        default=None,
        description="Gender: male | female | other",
    ),
    condition: Optional[str] = Query(
        default=None,
        description="Medical condition (e.g. 'pregnancy', 'diabetes', 'kidney')",
    ),
):
    """
    Find government healthcare schemes that the user may be eligible for.

    Filters:
    - **state**: Matches schemes available in that state (NULL = all India passes)
    - **income**: Matches schemes with max_annual_income >= user's income
    - **age**: Matches schemes where user's age is within [min_age, max_age]
    - **gender**: Matches schemes applicable to that gender
    - **condition**: Matches schemes covering that medical condition
    """
    schemes = await get_eligible_schemes(
        state=state,
        income=income,
        age=age,
        gender=gender,
        condition=condition,
    )

    # Build filters dict for response (show which filters were applied)
    filters = {}
    if state:     filters["state"]     = state
    if income:    filters["income"]    = income
    if age:       filters["age"]       = age
    if gender:    filters["gender"]    = gender
    if condition: filters["condition"] = condition

    return SchemeListResponse(
        schemes=schemes,
        total_count=len(schemes),
        filters=filters,
    )


# ── GET /schemes/{id} ───────────────────────────────────────

@router.get(
    "/schemes/{scheme_id}",
    response_model=Scheme,
    summary="Get scheme detail",
    description="Returns full details for a single government healthcare scheme by UUID.",
)
async def get_scheme(scheme_id: str):
    """Fetch a single scheme by its UUID."""
    scheme = await get_scheme_by_id(scheme_id)

    if scheme is None:
        raise HTTPException(
            status_code=404,
            detail=f"Scheme not found: {scheme_id}",
        )

    return Scheme(**scheme)


# ── GET /schemes/{id}/explain ────────────────────────────────

@router.get(
    "/schemes/{scheme_id}/explain",
    response_model=SchemeExplainResponse,
    summary="AI-explain scheme in user's language",
    description=(
        "Uses Google Gemini AI to explain a government scheme in simple language. "
        "Supports Hindi (hi), Marathi (mr), and English (en).\n\n"
        "Pass user profile fields as query params so the AI can personalise the explanation."
    ),
)
async def explain_scheme_endpoint(
    scheme_id: str,
    language: str = Query(
        default="hi",
        description="Language code: hi (Hindi) | mr (Marathi) | en (English)",
    ),
    state: Optional[str] = Query(
        default="Maharashtra",
        description="User's state",
    ),
    age: Optional[int] = Query(
        default=None,
        description="User's age",
    ),
    gender: Optional[str] = Query(
        default=None,
        description="User's gender",
    ),
    income: Optional[int] = Query(
        default=None,
        description="User's annual income in INR",
    ),
):
    """
    Get an AI-generated, plain-language explanation of a government scheme.

    The explanation is personalized to the user's profile (state, age, income, etc.)
    and delivered in their preferred language.
    """
    # Build user profile dict for Gemini
    user_profile = {
        "state": state or "Maharashtra",
        "age": age or "Unknown",
        "gender": gender or "Unknown",
        "annual_income": income or "Unknown",
    }

    result = await explain_scheme_for_user(
        scheme_id=scheme_id,
        user_profile=user_profile,
        language=language,
    )

    if result is None:
        raise HTTPException(
            status_code=404,
            detail=f"Scheme not found: {scheme_id}",
        )

    return SchemeExplainResponse(**result)
