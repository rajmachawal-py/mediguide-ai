"""
MediGuide AI — Indoor Navigation Pydantic Models
Request and response schemas for /api/navigation endpoints.
Mapped to Supabase tables: indoor_map_nodes, indoor_map_edges.
"""

from typing import Optional
from pydantic import BaseModel, Field


# ── Map Graph Models ─────────────────────────────────────────

class MapNode(BaseModel):
    """A node in the indoor hospital navigation graph."""
    id:             str
    hospital_id:    str
    department_id:  Optional[str] = None
    label:          str             = Field(..., description="e.g. 'Entrance', 'Cardiology OPD', 'Lift'")
    node_type:      str             = Field(..., description="entrance | department | waypoint | lift | stairs")
    floor_number:   int             = Field(default=0, description="Floor number (0 = Ground)")
    x_pos:          Optional[float] = Field(default=None, description="X position on floor map SVG (px or %)")
    y_pos:          Optional[float] = Field(default=None, description="Y position on floor map SVG (px or %)")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "30000000-0001-0000-0000-000000000001",
                "hospital_id": "00000000-0000-0000-0000-000000000001",
                "department_id": None,
                "label": "Main Entrance",
                "node_type": "entrance",
                "floor_number": 0,
                "x_pos": 50.0,
                "y_pos": 95.0,
            }
        }


class MapEdge(BaseModel):
    """A directed edge between two nodes in the indoor navigation graph."""
    id:               str
    hospital_id:      str
    from_node_id:     str
    to_node_id:       str
    distance_meters:  Optional[float] = Field(default=None, description="Walking distance in metres")
    is_accessible:    bool             = Field(default=True, description="Wheelchair accessible")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "40000000-0001-0000-0000-000000000001",
                "hospital_id": "00000000-0000-0000-0000-000000000001",
                "from_node_id": "30000000-0001-0000-0000-000000000001",
                "to_node_id": "30000000-0001-0000-0000-000000000002",
                "distance_meters": 15.0,
                "is_accessible": True,
            }
        }


class MapGraphResponse(BaseModel):
    """Response for GET /api/navigation/{hospital_id}/map — full graph data."""
    hospital_id:    str
    hospital_name:  str
    floor_map_url:  Optional[str]   = Field(default=None, description="SVG/image URL for the hospital floor plan")
    nodes:          list[MapNode]
    edges:          list[MapEdge]
    total_nodes:    int             = Field(..., description="Total nodes in the graph")
    total_edges:    int             = Field(..., description="Total edges in the graph")
    floors:         list[int]       = Field(default=[], description="List of available floor numbers")

    class Config:
        json_schema_extra = {
            "example": {
                "hospital_id": "00000000-0000-0000-0000-000000000001",
                "hospital_name": "Sassoon General Hospital",
                "floor_map_url": None,
                "nodes": [],
                "edges": [],
                "total_nodes": 0,
                "total_edges": 0,
                "floors": [0, 1, 2],
            }
        }


# ── Route Models ─────────────────────────────────────────────

class RouteStep(BaseModel):
    """A single step in the navigation route."""
    step_number:    int             = Field(..., description="1-indexed step number")
    from_node_id:   str
    to_node_id:     str
    from_label:     str             = Field(..., description="Label of the starting node")
    to_label:       str             = Field(..., description="Label of the destination node")
    floor:          int             = Field(..., description="Floor number for this step")
    distance_meters: Optional[float] = None
    direction:      str             = Field(..., description="Plain-language navigation instruction")
    node_type:      str             = Field(default="waypoint", description="Type of the destination node")

    class Config:
        json_schema_extra = {
            "example": {
                "step_number": 1,
                "from_node_id": "30000000-0001-0000-0000-000000000001",
                "to_node_id": "30000000-0001-0000-0000-000000000002",
                "from_label": "Main Entrance",
                "to_label": "Reception",
                "floor": 0,
                "distance_meters": 15.0,
                "direction": "Walk straight from Main Entrance to Reception",
                "node_type": "waypoint",
            }
        }


class RouteResponse(BaseModel):
    """Response for GET /api/navigation/{hospital_id}/route — step-by-step directions."""
    hospital_id:          str
    from_node:            str       = Field(..., description="Starting node label")
    to_node:              str       = Field(..., description="Destination node label")
    steps:                list[RouteStep]
    total_steps:          int       = Field(..., description="Number of steps in the route")
    total_distance_meters: Optional[float] = Field(default=None, description="Total walking distance")
    floors_traversed:     list[int] = Field(default=[], description="Floors visited in order")
    accessible_route:     bool      = Field(default=False, description="Whether this is an accessible-only route")

    class Config:
        json_schema_extra = {
            "example": {
                "hospital_id": "00000000-0000-0000-0000-000000000001",
                "from_node": "Main Entrance",
                "to_node": "Cardiology OPD",
                "steps": [],
                "total_steps": 0,
                "total_distance_meters": 85.0,
                "floors_traversed": [0, 1],
                "accessible_route": False,
            }
        }
