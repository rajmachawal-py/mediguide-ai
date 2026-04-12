"""
MediGuide AI — Indoor Navigation Router
Endpoints for hospital indoor map data and route calculation.

Endpoints:
    GET /api/navigation/{hospital_id}/map    — full graph (nodes + edges)
    GET /api/navigation/{hospital_id}/route  — BFS route between two nodes
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from app.services.navigation_service import (
    get_map_graph,
    find_route,
    find_entrance_node,
    find_department_node,
)
from app.models.navigation_models import MapGraphResponse, RouteResponse

router = APIRouter()


# ── GET /navigation/{hospital_id}/map ────────────────────────

@router.get(
    "/navigation/{hospital_id}/map",
    response_model=MapGraphResponse,
    summary="Get indoor map graph",
    description=(
        "Returns all indoor navigation nodes and edges for a hospital. "
        "Used to render the SVG floor map with department markers."
    ),
)
async def get_hospital_map(hospital_id: str):
    """
    Fetch the complete indoor navigation graph for a hospital.
    Returns nodes (departments, waypoints, lifts, stairs, entrance)
    and edges (walking paths with distance and accessibility info).
    """
    graph = await get_map_graph(hospital_id)

    if graph is None:
        raise HTTPException(
            status_code=404,
            detail=f"Hospital not found or has no indoor map: {hospital_id}",
        )

    return MapGraphResponse(
        hospital_id=graph["hospital_id"],
        hospital_name=graph["hospital_name"],
        floor_map_url=graph["floor_map_url"],
        nodes=graph["nodes"],
        edges=graph["edges"],
        total_nodes=len(graph["nodes"]),
        total_edges=len(graph["edges"]),
        floors=graph["floors"],
    )


# ── GET /navigation/{hospital_id}/route ──────────────────────

@router.get(
    "/navigation/{hospital_id}/route",
    response_model=RouteResponse,
    summary="Calculate indoor route",
    description=(
        "Calculates the shortest walking route between two nodes inside a hospital "
        "using BFS pathfinding. Supports accessible-only routing.\n\n"
        "**Shortcut**: Use `from=entrance` to auto-detect the hospital entrance node. "
        "Use `to={department_id}` to auto-detect the department's map node."
    ),
)
async def get_navigation_route(
    hospital_id: str,
    from_node: str = Query(
        ...,
        alias="from",
        description=(
            "Starting node UUID, or 'entrance' to auto-detect the hospital entrance"
        ),
    ),
    to_node: str = Query(
        ...,
        alias="to",
        description=(
            "Destination node UUID. Can also be a department_id — "
            "the system will find the corresponding map node"
        ),
    ),
    accessible_only: bool = Query(
        default=False,
        description="If true, only use wheelchair-accessible paths",
    ),
):
    """
    Calculate step-by-step indoor walking directions.

    The `from` parameter accepts:
    - `entrance` — auto-selects the hospital's entrance node
    - A specific node UUID

    The `to` parameter accepts:
    - A node UUID
    - A department UUID — the system looks up the corresponding map node
    """

    # Resolve 'entrance' shortcut
    if from_node.lower() == "entrance":
        entrance_id = await find_entrance_node(hospital_id)
        if not entrance_id:
            raise HTTPException(
                status_code=404,
                detail="No entrance node found for this hospital's indoor map",
            )
        from_node = entrance_id

    # Try to resolve `to` as a department_id first
    dept_node_id = await find_department_node(hospital_id, to_node)
    if dept_node_id:
        to_node = dept_node_id

    # Run BFS
    route = await find_route(
        hospital_id=hospital_id,
        from_node_id=from_node,
        to_node_id=to_node,
        accessible_only=accessible_only,
    )

    if route is None:
        raise HTTPException(
            status_code=404,
            detail=(
                f"No route found between the specified nodes. "
                f"{'Accessible-only routes may be limited.' if accessible_only else ''}"
            ),
        )

    return RouteResponse(**route)
