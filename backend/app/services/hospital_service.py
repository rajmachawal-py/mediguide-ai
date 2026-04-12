"""
MediGuide AI — Hospital Discovery Service
Handles all hospital-related database queries via Supabase.

Functions:
    find_nearby_hospitals() — calls get_nearby_hospitals() SQL RPC (Haversine)
    get_hospital_by_id()    — single hospital with specialties
    get_hospital_departments() — departments for a given hospital
"""

import logging
from typing import Optional

from app.db.supabase_client import get_client

logger = logging.getLogger(__name__)


# ── Nearby Hospital Search ────────────────────────────────────

async def find_nearby_hospitals(
    lat: float,
    lng: float,
    radius_km: float = 10.0,
    specialty: Optional[str] = None,
    hospital_type: Optional[str] = None,
) -> list[dict]:
    """
    Find hospitals near a lat/lng coordinate using the Supabase
    `get_nearby_hospitals()` SQL function (Haversine — no PostGIS needed).

    Args:
        lat:           User latitude
        lng:           User longitude
        radius_km:     Search radius in kilometres (default 10)
        specialty:     Optional specialty filter (e.g. 'cardiology', 'emergency')
        hospital_type: Optional type filter ('government', 'private', 'trust')

    Returns:
        List of hospital dicts sorted by distance_km ASC, each enriched
        with a `specialties` list from hospital_specialties table.
    """
    try:
        supabase = get_client()

        # Call the Supabase SQL function defined in schema.sql
        # get_nearby_hospitals(user_lat, user_lng, radius_km, specialty)
        #
        # NOTE: We do NOT pass the `specialty` param to the RPC because the
        # SQL function has an ambiguous column reference (parameter name
        # 'specialty' clashes with hs.specialty column in the WHERE clause).
        # Instead, we fetch all nearby hospitals and filter by specialty
        # in Python using the enriched specialties list below.
        rpc_params = {
            "user_lat": lat,
            "user_lng": lng,
            "radius_km": radius_km,
        }

        logger.info(
            f"Hospital search | lat={lat} lng={lng} "
            f"radius={radius_km}km specialty={specialty}"
        )

        result = supabase.rpc("get_nearby_hospitals", rpc_params).execute()
        hospitals = result.data or []

        # Filter by hospital_type if specified (not handled by SQL function)
        if hospital_type:
            hospitals = [
                h for h in hospitals
                if h.get("hospital_type") == hospital_type
            ]

        # Enrich each hospital with its specialties list
        hospital_ids = [h["id"] for h in hospitals]
        specialties_map = await _get_specialties_for_hospitals(hospital_ids)

        for hospital in hospitals:
            hospital["specialties"] = specialties_map.get(hospital["id"], [])

        # Filter by specialty in Python (since RPC specialty param is ambiguous)
        if specialty:
            specialty_lower = specialty.lower()
            hospitals = [
                h for h in hospitals
                if any(s.lower() == specialty_lower for s in h.get("specialties", []))
            ]

        logger.info(f"Hospital search found {len(hospitals)} results")
        return hospitals

    except Exception as e:
        logger.error(f"Hospital search error: {e}", exc_info=True)
        raise


# ── Single Hospital Detail ────────────────────────────────────

async def get_hospital_by_id(hospital_id: str) -> Optional[dict]:
    """
    Fetch a single hospital by UUID with full details including specialties.

    Args:
        hospital_id: Hospital UUID string

    Returns:
        Hospital dict with `specialties` list, or None if not found.
    """
    try:
        supabase = get_client()

        result = (
            supabase.table("hospitals")
            .select("*")
            .eq("id", hospital_id)
            .execute()
        )

        if not result.data:
            logger.warning(f"Hospital not found: {hospital_id}")
            return None

        hospital = result.data[0]

        # Fetch specialties for this hospital
        specialties_result = (
            supabase.table("hospital_specialties")
            .select("specialty")
            .eq("hospital_id", hospital_id)
            .execute()
        )
        hospital["specialties"] = [
            row["specialty"] for row in (specialties_result.data or [])
        ]

        logger.info(f"Hospital detail fetched: {hospital['name']}")
        return hospital

    except Exception as e:
        logger.error(f"Hospital detail error: {e}", exc_info=True)
        raise


# ── Hospital Departments ──────────────────────────────────────

async def get_hospital_departments(hospital_id: str) -> list[dict]:
    """
    Fetch all departments for a given hospital, ordered by floor number.

    Args:
        hospital_id: Hospital UUID string

    Returns:
        List of department dicts from the departments table.
    """
    try:
        supabase = get_client()

        result = (
            supabase.table("departments")
            .select("*")
            .eq("hospital_id", hospital_id)
            .order("floor_number", desc=False)
            .order("name", desc=False)
            .execute()
        )

        departments = result.data or []

        logger.info(
            f"Departments for {hospital_id}: {len(departments)} found"
        )
        return departments

    except Exception as e:
        logger.error(f"Department fetch error: {e}", exc_info=True)
        raise


# ── Internal Helpers ──────────────────────────────────────────

async def _get_specialties_for_hospitals(hospital_ids: list[str]) -> dict:
    """
    Batch-fetch specialties for multiple hospitals.

    Returns:
        { hospital_id: [specialty1, specialty2, ...], ... }
    """
    if not hospital_ids:
        return {}

    try:
        supabase = get_client()

        result = (
            supabase.table("hospital_specialties")
            .select("hospital_id, specialty")
            .in_("hospital_id", hospital_ids)
            .execute()
        )

        # Group specialties by hospital_id
        specialties_map: dict[str, list[str]] = {}
        for row in (result.data or []):
            hid = row["hospital_id"]
            if hid not in specialties_map:
                specialties_map[hid] = []
            specialties_map[hid].append(row["specialty"])

        return specialties_map

    except Exception as e:
        logger.error(f"Specialties batch fetch error: {e}", exc_info=True)
        return {}
