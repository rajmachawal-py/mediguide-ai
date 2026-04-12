"""
MediGuide AI — Indoor Navigation Service
Handles indoor hospital map graph queries and BFS pathfinding.

Functions:
    get_map_graph()  — fetches all nodes + edges for a hospital
    find_route()     — BFS shortest path between two nodes
"""

import logging
from typing import Optional
from collections import deque

from app.db.supabase_client import get_client

logger = logging.getLogger(__name__)


# ── Map Graph Data ────────────────────────────────────────────

async def get_map_graph(hospital_id: str) -> dict:
    """
    Fetch the full indoor navigation graph for a hospital.

    Args:
        hospital_id: Hospital UUID string

    Returns:
        {
            "hospital_id":   str,
            "hospital_name": str,
            "floor_map_url": str | None,
            "nodes":  [node dicts],
            "edges":  [edge dicts],
            "floors": [int] — distinct floor numbers
        }
    """
    try:
        supabase = get_client()

        # Fetch hospital name and floor map URL
        hospital_result = (
            supabase.table("hospitals")
            .select("name, indoor_map_url")
            .eq("id", hospital_id)
            .execute()
        )

        if not hospital_result.data:
            logger.warning(f"Hospital not found for navigation: {hospital_id}")
            return None

        hospital = hospital_result.data[0]

        # Fetch all nodes for this hospital
        nodes_result = (
            supabase.table("indoor_map_nodes")
            .select("*")
            .eq("hospital_id", hospital_id)
            .order("floor_number", desc=False)
            .execute()
        )
        nodes = nodes_result.data or []

        # Fetch all edges for this hospital
        edges_result = (
            supabase.table("indoor_map_edges")
            .select("*")
            .eq("hospital_id", hospital_id)
            .execute()
        )
        edges = edges_result.data or []

        # Extract distinct floor numbers
        floors = sorted(set(node.get("floor_number", 0) for node in nodes))

        logger.info(
            f"Map graph for {hospital_id}: "
            f"{len(nodes)} nodes, {len(edges)} edges, floors={floors}"
        )

        return {
            "hospital_id": hospital_id,
            "hospital_name": hospital["name"],
            "floor_map_url": hospital.get("indoor_map_url"),
            "nodes": nodes,
            "edges": edges,
            "floors": floors,
        }

    except Exception as e:
        logger.error(f"Map graph fetch error: {e}", exc_info=True)
        raise


# ── BFS Pathfinding ──────────────────────────────────────────

async def find_route(
    hospital_id: str,
    from_node_id: str,
    to_node_id: str,
    accessible_only: bool = False,
) -> Optional[dict]:
    """
    Find the shortest route between two nodes using BFS.

    Args:
        hospital_id:     Hospital UUID
        from_node_id:    Starting node UUID (typically 'entrance')
        to_node_id:      Destination node UUID (typically a department)
        accessible_only: If True, only traverse wheelchair-accessible edges

    Returns:
        {
            "hospital_id":          str,
            "from_node":            str (label),
            "to_node":              str (label),
            "steps":                [RouteStep dicts],
            "total_steps":          int,
            "total_distance_meters": float,
            "floors_traversed":     [int],
            "accessible_route":     bool,
        }
        or None if no route found.
    """
    try:
        supabase = get_client()

        # Fetch all nodes
        nodes_result = (
            supabase.table("indoor_map_nodes")
            .select("*")
            .eq("hospital_id", hospital_id)
            .execute()
        )
        all_nodes = nodes_result.data or []

        if not all_nodes:
            logger.warning(f"No indoor map nodes for hospital: {hospital_id}")
            return None

        # Build a node lookup by ID
        node_map = {node["id"]: node for node in all_nodes}

        # Validate start and end nodes exist
        if from_node_id not in node_map:
            logger.warning(f"Start node not found: {from_node_id}")
            return None
        if to_node_id not in node_map:
            logger.warning(f"Destination node not found: {to_node_id}")
            return None

        # Fetch all edges
        edges_result = (
            supabase.table("indoor_map_edges")
            .select("*")
            .eq("hospital_id", hospital_id)
            .execute()
        )
        all_edges = edges_result.data or []

        # Filter for accessible-only if requested
        if accessible_only:
            all_edges = [e for e in all_edges if e.get("is_accessible", True)]

        # Build adjacency list (bidirectional — edges work both ways)
        adjacency: dict[str, list[dict]] = {}
        for edge in all_edges:
            from_id = edge["from_node_id"]
            to_id = edge["to_node_id"]

            if from_id not in adjacency:
                adjacency[from_id] = []
            if to_id not in adjacency:
                adjacency[to_id] = []

            adjacency[from_id].append(edge)
            # Add reverse edge (bidirectional walking paths)
            reverse_edge = {
                **edge,
                "from_node_id": to_id,
                "to_node_id": from_id,
            }
            adjacency[to_id].append(reverse_edge)

        # BFS
        visited = {from_node_id}
        queue = deque()
        queue.append((from_node_id, []))  # (current_node_id, path_of_edges)

        found_path = None

        while queue:
            current_id, path = queue.popleft()

            if current_id == to_node_id:
                found_path = path
                break

            for edge in adjacency.get(current_id, []):
                neighbor_id = edge["to_node_id"]
                if neighbor_id not in visited:
                    visited.add(neighbor_id)
                    queue.append((neighbor_id, path + [edge]))

        if found_path is None:
            logger.info(
                f"No route found from {from_node_id} to {to_node_id} "
                f"(accessible_only={accessible_only})"
            )
            return None

        # Build step-by-step directions
        steps = []
        total_distance = 0.0
        floors_visited = []

        for i, edge in enumerate(found_path):
            from_node = node_map[edge["from_node_id"]]
            to_node = node_map[edge["to_node_id"]]
            distance = float(edge.get("distance_meters", 0) or 0)
            total_distance += distance

            floor = to_node.get("floor_number", 0)
            if floor not in floors_visited:
                floors_visited.append(floor)

            # Generate plain-language direction
            direction = _generate_direction(from_node, to_node, i, len(found_path))

            steps.append({
                "step_number": i + 1,
                "from_node_id": edge["from_node_id"],
                "to_node_id": edge["to_node_id"],
                "from_label": from_node["label"],
                "to_label": to_node["label"],
                "floor": floor,
                "distance_meters": distance if distance > 0 else None,
                "direction": direction,
                "node_type": to_node.get("node_type", "waypoint"),
            })

        from_label = node_map[from_node_id]["label"]
        to_label = node_map[to_node_id]["label"]

        logger.info(
            f"Route found: {from_label} → {to_label} | "
            f"{len(steps)} steps, {total_distance:.1f}m, floors={floors_visited}"
        )

        return {
            "hospital_id": hospital_id,
            "from_node": from_label,
            "to_node": to_label,
            "steps": steps,
            "total_steps": len(steps),
            "total_distance_meters": round(total_distance, 1) if total_distance > 0 else None,
            "floors_traversed": floors_visited,
            "accessible_route": accessible_only,
        }

    except Exception as e:
        logger.error(f"Route finding error: {e}", exc_info=True)
        raise


# ── Helper: Find Entrance Node ───────────────────────────────

async def find_entrance_node(hospital_id: str) -> Optional[str]:
    """
    Find the 'entrance' type node for a hospital.
    Returns the node ID, or None if no entrance node exists.
    """
    try:
        supabase = get_client()

        result = (
            supabase.table("indoor_map_nodes")
            .select("id")
            .eq("hospital_id", hospital_id)
            .eq("node_type", "entrance")
            .limit(1)
            .execute()
        )

        if result.data:
            return result.data[0]["id"]
        return None

    except Exception as e:
        logger.error(f"Entrance node lookup error: {e}", exc_info=True)
        return None


# ── Helper: Find Department Node ─────────────────────────────

async def find_department_node(hospital_id: str, department_id: str) -> Optional[str]:
    """
    Find the indoor map node linked to a specific department.
    Returns the node ID, or None if no matching node exists.
    """
    try:
        supabase = get_client()

        result = (
            supabase.table("indoor_map_nodes")
            .select("id")
            .eq("hospital_id", hospital_id)
            .eq("department_id", department_id)
            .limit(1)
            .execute()
        )

        if result.data:
            return result.data[0]["id"]
        return None

    except Exception as e:
        logger.error(f"Department node lookup error: {e}", exc_info=True)
        return None


# ── Internal Helpers ─────────────────────────────────────────

def _generate_direction(from_node: dict, to_node: dict, step_index: int, total_steps: int) -> str:
    """
    Generate a plain-language navigation instruction for a single step.
    Uses node types and labels to create human-readable directions.
    """
    from_label = from_node["label"]
    to_label = to_node["label"]
    to_type = to_node.get("node_type", "waypoint")
    from_floor = from_node.get("floor_number", 0)
    to_floor = to_node.get("floor_number", 0)

    # Floor change via lift or stairs
    if from_floor != to_floor:
        transport = "Lift" if to_type == "lift" else "Stairs"
        direction_word = "up" if to_floor > from_floor else "down"
        return f"Take the {transport} {direction_word} from Floor {from_floor} to Floor {to_floor}"

    # Arriving at destination (last step)
    if step_index == total_steps - 1:
        if to_type == "department":
            return f"You have arrived at {to_label}"
        return f"Walk to {to_label} — you have reached your destination"

    # Starting from entrance
    if step_index == 0 and from_node.get("node_type") == "entrance":
        return f"Enter through {from_label} and walk towards {to_label}"

    # Approaching lift or stairs
    if to_type == "lift":
        return f"Walk from {from_label} to the {to_label}"
    if to_type == "stairs":
        return f"Walk from {from_label} to the {to_label}"

    # General waypoint
    return f"Walk from {from_label} to {to_label}"
