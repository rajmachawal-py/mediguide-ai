"""
MediGuide AI — Government Scheme Pydantic Models
Request and response schemas for /api/schemes endpoints.
Mapped to Supabase table: schemes.
"""

from typing import Optional
from pydantic import BaseModel, Field


# ── Scheme Models ────────────────────────────────────────────

class Scheme(BaseModel):
    """A government healthcare scheme record — matches the `schemes` table."""
    id:                     str
    name:                   str
    name_hi:                Optional[str] = None
    name_mr:                Optional[str] = None
    description:            Optional[str] = None
    description_hi:         Optional[str] = None
    description_mr:         Optional[str] = None
    eligibility_states:     Optional[list[str]] = Field(default=None, description="States where scheme applies (NULL = all India)")
    max_annual_income:      Optional[int]       = Field(default=None, description="Max income in INR (NULL = no limit)")
    applicable_genders:     Optional[list[str]] = Field(default=None, description="Genders (NULL = all)")
    min_age:                int                 = Field(default=0, description="Minimum age for eligibility")
    max_age:                int                 = Field(default=120, description="Maximum age for eligibility")
    applicable_conditions:  Optional[list[str]] = Field(default=None, description="Medical conditions covered")
    benefit_amount:         Optional[int]       = Field(default=None, description="Benefit amount in INR")
    scheme_url:             Optional[str]       = None
    helpline:               Optional[str]       = None
    is_active:              bool                = True

    class Config:
        json_schema_extra = {
            "example": {
                "id": "20000000-0000-0000-0000-000000000001",
                "name": "Ayushman Bharat PM-JAY",
                "name_hi": "आयुष्मान भारत प्रधानमंत्री जन आरोग्य योजना",
                "name_mr": "आयुष्मान भारत पंतप्रधान जन आरोग्य योजना",
                "description": "Provides health coverage of ₹5 lakh per family per year.",
                "eligibility_states": None,
                "max_annual_income": 500000,
                "applicable_genders": None,
                "min_age": 0,
                "max_age": 120,
                "applicable_conditions": None,
                "benefit_amount": 500000,
                "scheme_url": "https://pmjay.gov.in",
                "helpline": "14555",
                "is_active": True,
            }
        }


# ── Request Models ───────────────────────────────────────────

class SchemeEligibilityRequest(BaseModel):
    """Query parameters for eligibility matching (all optional for flexible filtering)."""
    state:      Optional[str] = Field(default=None, description="Indian state (e.g. 'Maharashtra')")
    income:     Optional[int] = Field(default=None, description="Annual income in INR")
    age:        Optional[int] = Field(default=None, description="Patient age")
    gender:     Optional[str] = Field(default=None, description="male | female | other")
    condition:  Optional[str] = Field(default=None, description="Medical condition (e.g. 'pregnancy', 'diabetes')")

    class Config:
        json_schema_extra = {
            "example": {
                "state": "Maharashtra",
                "income": 80000,
                "age": 30,
                "gender": "female",
                "condition": "pregnancy",
            }
        }


# ── Response Models ──────────────────────────────────────────

class SchemeListResponse(BaseModel):
    """Response for GET /api/schemes/eligible."""
    schemes:     list[Scheme]
    total_count: int          = Field(..., description="Total matching schemes")
    filters:     dict         = Field(default={}, description="Filters that were applied")

    class Config:
        json_schema_extra = {
            "example": {
                "schemes": [],
                "total_count": 0,
                "filters": {
                    "state": "Maharashtra",
                    "income": 80000,
                },
            }
        }


class SchemeExplanation(BaseModel):
    """AI-generated explanation of a single scheme."""
    name:             str   = Field(..., description="Scheme name in the user's language")
    benefit:          str   = Field(..., description="What the user gets, in simple terms")
    eligibility_met:  bool  = Field(default=True, description="Whether user meets eligibility")
    how_to_apply:     str   = Field(..., description="Simple instructions to apply")
    helpline:         str   = Field(default="", description="Helpline number")
    explanation:      str   = Field(..., description="2-3 sentence plain-language explanation")


class SchemeExplainResponse(BaseModel):
    """Response for GET /api/schemes/{id}/explain."""
    scheme_id:      str
    scheme_name:    str
    language:       str                     = Field(..., description="Language of the explanation")
    explanations:   list[SchemeExplanation] = Field(default=[], description="AI-generated explanations")
    general_advice: str                     = Field(default="", description="General advice about govt schemes")

    class Config:
        json_schema_extra = {
            "example": {
                "scheme_id": "20000000-0000-0000-0000-000000000001",
                "scheme_name": "Ayushman Bharat PM-JAY",
                "language": "hi",
                "explanations": [],
                "general_advice": "सरकारी योजनाओं का लाभ उठाने के लिए अपने नजदीकी जन सेवा केंद्र पर जाएं।",
            }
        }
