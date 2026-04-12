"""
MediGuide AI — Hospital & Department Pydantic Models
Request and response schemas for /api/hospitals endpoints.
Mapped to Supabase tables: hospitals, departments, hospital_specialties.
"""

from typing import Optional
from pydantic import BaseModel, Field


# ── Hospital Models ───────────────────────────────────────────

class Hospital(BaseModel):
    """A single hospital record — returned from nearby search or detail endpoint."""
    id:              str
    name:            str
    name_hi:         Optional[str] = None
    name_mr:         Optional[str] = None
    hospital_type:   str            = Field(..., description="government | private | trust | clinic")
    address:         str
    city:            str
    state:           str
    pincode:         Optional[str] = None
    phone:           Optional[str] = None
    lat:             float
    lng:             float
    google_maps_url: Optional[str] = None
    is_24x7:         bool          = False
    has_emergency:   bool          = False
    has_ambulance:   bool          = False
    rating:          Optional[float] = None
    total_beds:      Optional[int]   = None
    indoor_map_url:  Optional[str]   = None
    distance_km:     Optional[float] = Field(default=None, description="Distance from user in km (only in nearby results)")
    specialties:     list[str]       = Field(default=[], description="List of specialty tags (e.g. cardiology, emergency)")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "00000000-0000-0000-0000-000000000001",
                "name": "Sassoon General Hospital",
                "name_hi": "ससून जनरल अस्पताल",
                "name_mr": "ससून जनरल हॉस्पिटल",
                "hospital_type": "government",
                "address": "Near Pune Railway Station, Sassoon Road",
                "city": "Pune",
                "state": "Maharashtra",
                "pincode": "411001",
                "phone": "020-26128000",
                "lat": 18.5163,
                "lng": 73.8644,
                "google_maps_url": "https://maps.google.com/?q=Sassoon+General+Hospital+Pune",
                "is_24x7": True,
                "has_emergency": True,
                "has_ambulance": True,
                "rating": 3.8,
                "total_beds": 1500,
                "distance_km": 2.3,
                "specialties": ["general", "emergency", "trauma", "cardiology"],
            }
        }


class HospitalListResponse(BaseModel):
    """Response for GET /api/hospitals/nearby — paginated list of nearby hospitals."""
    hospitals:   list[Hospital]
    total_count: int             = Field(..., description="Total hospitals returned")
    user_lat:    float           = Field(..., description="User latitude used for query")
    user_lng:    float           = Field(..., description="User longitude used for query")
    radius_km:   float           = Field(..., description="Search radius in km")

    class Config:
        json_schema_extra = {
            "example": {
                "hospitals": [],
                "total_count": 0,
                "user_lat": 18.5204,
                "user_lng": 73.8567,
                "radius_km": 10.0,
            }
        }


# ── Department Models ─────────────────────────────────────────

class Department(BaseModel):
    """A department within a hospital."""
    id:            str
    hospital_id:   str
    name:          str
    name_hi:       Optional[str] = None
    name_mr:       Optional[str] = None
    floor_number:  Optional[int] = None
    room_number:   Optional[str] = None
    doctor_names:  list[str]      = Field(default=[], description="Doctor names in this department")
    avg_wait_mins: Optional[int]  = Field(default=None, description="Average wait time in minutes")
    is_available:  bool           = True

    class Config:
        json_schema_extra = {
            "example": {
                "id": "10000000-0001-0001-0001-000000000002",
                "hospital_id": "00000000-0000-0000-0000-000000000001",
                "name": "Cardiology OPD",
                "name_hi": "हृदय रोग ओपीडी",
                "name_mr": "हृदयरोग ओपीडी",
                "floor_number": 1,
                "room_number": "101",
                "doctor_names": ["Dr. A. Kulkarni", "Dr. M. Sharma"],
                "avg_wait_mins": 45,
                "is_available": True,
            }
        }


class DepartmentListResponse(BaseModel):
    """Response for GET /api/hospitals/{id}/departments."""
    hospital_id:  str
    hospital_name: str
    departments:   list[Department]
    total_count:   int = Field(..., description="Total departments returned")
