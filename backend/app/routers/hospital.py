"""
MediGuide AI — Hospital Router
GET /api/hospitals/nearby          — find hospitals near user location
GET /api/hospitals/{id}            — single hospital detail
GET /api/hospitals/{id}/departments — departments within a hospital

Uses Supabase get_nearby_hospitals() SQL function for proximity search.
"""

import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, Path, status

from app.models.hospital_models import (
    Hospital,
    HospitalListResponse,
    Department,
    DepartmentListResponse,
)
from app.services.hospital_service import (
    find_nearby_hospitals,
    get_hospital_by_id,
    get_hospital_departments,
)

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Nearby Hospitals ──────────────────────────────────────────

@router.get(
    "/hospitals/nearby",
    response_model=HospitalListResponse,
    summary="Find nearby hospitals",
    description=(
        "Returns hospitals within a given radius of the user's location, "
        "sorted by distance (nearest first). "
        "Optionally filter by medical specialty or hospital type. "
        "Uses Haversine formula for distance calculation."
    ),
)
async def get_nearby_hospitals(
    lat: float = Query(
        ..., ge=-90, le=90,
        description="User latitude",
        examples=[18.5204],
    ),
    lng: float = Query(
        ..., ge=-180, le=180,
        description="User longitude",
        examples=[73.8567],
    ),
    radius_km: float = Query(
        default=10.0, ge=0.5, le=100.0,
        description="Search radius in km (default 10, max 100)",
    ),
    specialty: Optional[str] = Query(
        default=None,
        description="Filter by specialty (e.g. cardiology, emergency, pediatrics)",
        examples=["cardiology"],
    ),
    hospital_type: Optional[str] = Query(
        default=None,
        description="Filter by type: government, private, trust, clinic",
        examples=["government"],
    ),
) -> HospitalListResponse:
    """
    Find hospitals near the user's geolocation.

    The search uses the Supabase `get_nearby_hospitals()` SQL function,
    which applies a Haversine distance filter and sorts by proximity.

    Results include each hospital's specialties list for frontend filtering.
    """
    try:
        logger.info(
            f"Nearby hospitals request | lat={lat} lng={lng} "
            f"radius={radius_km}km specialty={specialty} type={hospital_type}"
        )

        hospitals_data = await find_nearby_hospitals(
            lat=lat,
            lng=lng,
            radius_km=radius_km,
            specialty=specialty,
            hospital_type=hospital_type,
        )

        # Convert raw dicts to Pydantic models
        hospitals = [Hospital(**h) for h in hospitals_data]

        return HospitalListResponse(
            hospitals=hospitals,
            total_count=len(hospitals),
            user_lat=lat,
            user_lng=lng,
            radius_km=radius_km,
        )

    except Exception as e:
        logger.error(f"Nearby hospitals error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch nearby hospitals. Please try again.",
        )


# ── Single Hospital Detail ────────────────────────────────────

@router.get(
    "/hospitals/{hospital_id}",
    response_model=Hospital,
    summary="Get hospital details",
    description=(
        "Returns full details of a single hospital including specialties, "
        "Google Maps URL, bed count, and emergency info. "
        "Used before opening the hospital detail card or indoor map."
    ),
)
async def get_hospital_detail(
    hospital_id: str = Path(
        ...,
        description="Hospital UUID",
        examples=["00000000-0000-0000-0000-000000000001"],
    ),
) -> Hospital:
    """
    Fetch a single hospital by its UUID.

    Returns the full hospital record with its specialties list.
    Returns 404 if the hospital doesn't exist.
    """
    try:
        hospital_data = await get_hospital_by_id(hospital_id)

        if not hospital_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Hospital not found: {hospital_id}",
            )

        return Hospital(**hospital_data)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Hospital detail error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch hospital details.",
        )


# ── Hospital Departments ──────────────────────────────────────

@router.get(
    "/hospitals/{hospital_id}/departments",
    response_model=DepartmentListResponse,
    summary="List hospital departments",
    description=(
        "Returns all departments within a hospital, ordered by floor number. "
        "Includes doctor names, room numbers, wait times, and availability. "
        "Used for the department selector in Indoor Map and Hospital Detail pages."
    ),
)
async def list_hospital_departments(
    hospital_id: str = Path(
        ...,
        description="Hospital UUID",
        examples=["00000000-0000-0000-0000-000000000001"],
    ),
) -> DepartmentListResponse:
    """
    List all departments for a given hospital.

    Returns departments sorted by floor number, then by name.
    Includes a 404 if the hospital doesn't exist.
    """
    try:
        # Verify hospital exists first
        hospital_data = await get_hospital_by_id(hospital_id)
        if not hospital_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Hospital not found: {hospital_id}",
            )

        departments_data = await get_hospital_departments(hospital_id)

        departments = [Department(**d) for d in departments_data]

        return DepartmentListResponse(
            hospital_id=hospital_id,
            hospital_name=hospital_data["name"],
            departments=departments,
            total_count=len(departments),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Departments list error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch departments.",
        )
