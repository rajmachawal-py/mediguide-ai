"""
MediGuide AI — Run Ruby Hall seed data via Supabase Python client.
Executes the corridor-aligned node/edge graph for indoor navigation.

Usage: python run_seed.py
"""

import os
import sys

# Add parent dir so we can import from app
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))

from supabase import create_client

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY') or os.getenv('SUPABASE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERROR: SUPABASE_URL and SUPABASE_KEY must be set in backend/.env")
    sys.exit(1)

sb = create_client(SUPABASE_URL, SUPABASE_KEY)
HOSPITAL_ID = '00000000-0000-0000-0000-000000000003'

print("=" * 60)
print("MediGuide AI — Ruby Hall Indoor Map Seed Runner")
print("=" * 60)

# ── Step 1: Delete old indoor map data ────────────────────────
print("\n[1/4] Deleting old indoor map edges...")
sb.table("indoor_map_edges").delete().eq("hospital_id", HOSPITAL_ID).execute()
print("      ✅ Old edges deleted")

print("[1/4] Deleting old indoor map nodes...")
sb.table("indoor_map_nodes").delete().eq("hospital_id", HOSPITAL_ID).execute()
print("      ✅ Old nodes deleted")

# ── Step 2: Insert new departments (if missing) ──────────────
print("\n[2/4] Upserting departments...")
new_departments = [
    {"id": "10000000-0003-0003-0003-000000000008", "hospital_id": HOSPITAL_ID,
     "name": "Urology", "name_hi": "यूरोलॉजी", "name_mr": "यूरोलॉजी",
     "floor_number": 2, "room_number": "2-U", "doctor_names": ["Dr. S. Desai"],
     "avg_wait_mins": 35, "is_available": True},
    {"id": "10000000-0003-0003-0003-000000000009", "hospital_id": HOSPITAL_ID,
     "name": "Gastroenterology", "name_hi": "गैस्ट्रोएंटरोलॉजी", "name_mr": "गॅस्ट्रोएन्ट्रोलॉजी",
     "floor_number": 2, "room_number": "2-G", "doctor_names": ["Dr. A. Joshi"],
     "avg_wait_mins": 40, "is_available": True},
    {"id": "10000000-0003-0003-0003-000000000010", "hospital_id": HOSPITAL_ID,
     "name": "Radiology & Imaging", "name_hi": "रेडियोलॉजी", "name_mr": "रेडिओलॉजी",
     "floor_number": 0, "room_number": "G-RAD", "doctor_names": ["Dr. P. Mehta"],
     "avg_wait_mins": 20, "is_available": True},
    {"id": "10000000-0003-0003-0003-000000000011", "hospital_id": HOSPITAL_ID,
     "name": "Pathology & Lab", "name_hi": "पैथोलॉजी", "name_mr": "पॅथॉलॉजी",
     "floor_number": 0, "room_number": "G-PATH", "doctor_names": ["Dr. R. Kale"],
     "avg_wait_mins": 15, "is_available": True},
    {"id": "10000000-0003-0003-0003-000000000012", "hospital_id": HOSPITAL_ID,
     "name": "ICU - Intensive Care", "name_hi": "आईसीयू", "name_mr": "आयसीयू",
     "floor_number": 1, "room_number": "1-ICU", "doctor_names": ["Dr. V. Shah"],
     "avg_wait_mins": 0, "is_available": True},
]
sb.table("departments").upsert(new_departments, on_conflict="id").execute()
print("      ✅ Departments upserted")

# ── Step 3: Insert corridor-aligned nodes ─────────────────────
print("\n[3/4] Inserting corridor-aligned nodes...")

nodes = [
    # ═══ GROUND FLOOR (0) — ROOMS ═══
    {"id": "30000000-0003-0000-0000-000000000001", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "Main Entrance", "node_type": "entrance",
     "floor_number": 0, "x_pos": 17.7, "y_pos": 19.3},
    {"id": "30000000-0003-0000-0000-000000000002", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "OPD Registration", "node_type": "waypoint",
     "floor_number": 0, "x_pos": 41.4, "y_pos": 19.3},
    {"id": "30000000-0003-0000-0000-000000000003", "hospital_id": HOSPITAL_ID,
     "department_id": "10000000-0003-0003-0003-000000000001", "label": "Emergency & Casualty", "node_type": "department",
     "floor_number": 0, "x_pos": 61.4, "y_pos": 19.3},
    {"id": "30000000-0003-0000-0000-000000000004", "hospital_id": HOSPITAL_ID,
     "department_id": "10000000-0003-0003-0003-000000000002", "label": "Cardiology OPD", "node_type": "department",
     "floor_number": 0, "x_pos": 11.5, "y_pos": 42.5},
    {"id": "30000000-0003-0000-0000-000000000005", "hospital_id": HOSPITAL_ID,
     "department_id": "10000000-0003-0003-0003-000000000010", "label": "Radiology & Imaging", "node_type": "department",
     "floor_number": 0, "x_pos": 29.1, "y_pos": 42.5},
    {"id": "30000000-0003-0000-0000-000000000006", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "Blood Bank", "node_type": "waypoint",
     "floor_number": 0, "x_pos": 45.9, "y_pos": 38.8},
    {"id": "30000000-0003-0000-0000-000000000007", "hospital_id": HOSPITAL_ID,
     "department_id": "10000000-0003-0003-0003-000000000011", "label": "Pathology & Lab", "node_type": "department",
     "floor_number": 0, "x_pos": 45.9, "y_pos": 46.4},
    {"id": "30000000-0003-0000-0000-000000000008", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "Pharmacy", "node_type": "waypoint",
     "floor_number": 0, "x_pos": 61.5, "y_pos": 42.5},
    {"id": "30000000-0003-0000-0000-000000000009", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "Cafeteria", "node_type": "waypoint",
     "floor_number": 0, "x_pos": 79.1, "y_pos": 42.5},
    # Consult rooms
    {"id": "30000000-0003-0000-0000-000000000010", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "Consult C-01 (Cardiology)", "node_type": "waypoint",
     "floor_number": 0, "x_pos": 10.2, "y_pos": 63.6},
    {"id": "30000000-0003-0000-0000-000000000011", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "Consult C-02 (Neurology)", "node_type": "waypoint",
     "floor_number": 0, "x_pos": 23.8, "y_pos": 63.6},
    {"id": "30000000-0003-0000-0000-000000000012", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "Consult C-03 (Orthopedics)", "node_type": "waypoint",
     "floor_number": 0, "x_pos": 37.5, "y_pos": 63.6},
    {"id": "30000000-0003-0000-0000-000000000013", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "Consult C-04 (Oncology)", "node_type": "waypoint",
     "floor_number": 0, "x_pos": 51.1, "y_pos": 63.6},
    {"id": "30000000-0003-0000-0000-000000000014", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "Consult C-05 (Urology)", "node_type": "waypoint",
     "floor_number": 0, "x_pos": 64.7, "y_pos": 63.6},
    {"id": "30000000-0003-0000-0000-000000000015", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "Consult C-06 (Gastro)", "node_type": "waypoint",
     "floor_number": 0, "x_pos": 78.4, "y_pos": 63.6},
    # Bottom area
    {"id": "30000000-0003-0000-0000-000000000016", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "Waiting Area", "node_type": "waypoint",
     "floor_number": 0, "x_pos": 12.7, "y_pos": 81.7},
    {"id": "30000000-0003-0000-0000-000000000017", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "Lifts (Ground)", "node_type": "lift",
     "floor_number": 0, "x_pos": 50.2, "y_pos": 81.7},
    {"id": "30000000-0003-0000-0000-000000000018", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "Staircase Left (G)", "node_type": "stairs",
     "floor_number": 0, "x_pos": 58.6, "y_pos": 81.7},
    {"id": "30000000-0003-0000-0000-000000000019", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "Staircase Right (G)", "node_type": "stairs",
     "floor_number": 0, "x_pos": 83.2, "y_pos": 81.7},

    # ═══ GROUND FLOOR (0) — CORRIDOR JUNCTIONS ═══
    # Main Corridor (y=32.3%)
    {"id": "30000000-0003-0000-1000-000000000001", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "MC Junction (Cardiology)", "node_type": "waypoint",
     "floor_number": 0, "x_pos": 11.5, "y_pos": 32.3},
    {"id": "30000000-0003-0000-1000-000000000002", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "MC Junction (Entrance)", "node_type": "waypoint",
     "floor_number": 0, "x_pos": 17.7, "y_pos": 32.3},
    {"id": "30000000-0003-0000-1000-000000000003", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "MC Junction (Radiology)", "node_type": "waypoint",
     "floor_number": 0, "x_pos": 29.1, "y_pos": 32.3},
    {"id": "30000000-0003-0000-1000-000000000004", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "MC Junction (OPD)", "node_type": "waypoint",
     "floor_number": 0, "x_pos": 41.4, "y_pos": 32.3},
    {"id": "30000000-0003-0000-1000-000000000005", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "MC Junction (Center)", "node_type": "waypoint",
     "floor_number": 0, "x_pos": 45.9, "y_pos": 32.3},
    {"id": "30000000-0003-0000-1000-000000000006", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "MC Junction (Emergency)", "node_type": "waypoint",
     "floor_number": 0, "x_pos": 61.4, "y_pos": 32.3},
    {"id": "30000000-0003-0000-1000-000000000007", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "MC Junction (Cafeteria)", "node_type": "waypoint",
     "floor_number": 0, "x_pos": 79.1, "y_pos": 32.3},
    {"id": "30000000-0003-0000-1000-000000000008", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "MC Junction (Right)", "node_type": "waypoint",
     "floor_number": 0, "x_pos": 88.2, "y_pos": 32.3},
    # Service Corridor (y=52.3%)
    {"id": "30000000-0003-0000-2000-000000000001", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "SC Junction (C-01)", "node_type": "waypoint",
     "floor_number": 0, "x_pos": 10.2, "y_pos": 52.3},
    {"id": "30000000-0003-0000-2000-000000000002", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "SC Junction (C-02)", "node_type": "waypoint",
     "floor_number": 0, "x_pos": 23.8, "y_pos": 52.3},
    {"id": "30000000-0003-0000-2000-000000000003", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "SC Junction (C-03)", "node_type": "waypoint",
     "floor_number": 0, "x_pos": 37.5, "y_pos": 52.3},
    {"id": "30000000-0003-0000-2000-000000000004", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "SC Junction (Center)", "node_type": "waypoint",
     "floor_number": 0, "x_pos": 45.9, "y_pos": 52.3},
    {"id": "30000000-0003-0000-2000-000000000005", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "SC Junction (C-04)", "node_type": "waypoint",
     "floor_number": 0, "x_pos": 51.1, "y_pos": 52.3},
    {"id": "30000000-0003-0000-2000-000000000006", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "SC Junction (C-05)", "node_type": "waypoint",
     "floor_number": 0, "x_pos": 64.7, "y_pos": 52.3},
    {"id": "30000000-0003-0000-2000-000000000007", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "SC Junction (C-06)", "node_type": "waypoint",
     "floor_number": 0, "x_pos": 78.4, "y_pos": 52.3},
    {"id": "30000000-0003-0000-2000-000000000008", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "SC Junction (Right)", "node_type": "waypoint",
     "floor_number": 0, "x_pos": 88.2, "y_pos": 52.3},
    # Lower Corridor (y=72.0%)
    {"id": "30000000-0003-0000-3000-000000000001", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "LC Junction (Waiting)", "node_type": "waypoint",
     "floor_number": 0, "x_pos": 12.7, "y_pos": 72.0},
    {"id": "30000000-0003-0000-3000-000000000002", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "LC Junction (Lifts)", "node_type": "waypoint",
     "floor_number": 0, "x_pos": 50.2, "y_pos": 72.0},
    {"id": "30000000-0003-0000-3000-000000000003", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "LC Junction (Stairs-L)", "node_type": "waypoint",
     "floor_number": 0, "x_pos": 58.6, "y_pos": 72.0},
    {"id": "30000000-0003-0000-3000-000000000004", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "LC Junction (Right)", "node_type": "waypoint",
     "floor_number": 0, "x_pos": 83.2, "y_pos": 72.0},
    {"id": "30000000-0003-0000-3000-000000000005", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "LC Junction (Stairs-R)", "node_type": "waypoint",
     "floor_number": 0, "x_pos": 88.2, "y_pos": 72.0},

    # ═══ FIRST FLOOR (1) — ROOMS ═══
    {"id": "30000000-0003-0001-0000-000000000001", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "Male General Ward", "node_type": "department",
     "floor_number": 1, "x_pos": 17.7, "y_pos": 26.7},
    {"id": "30000000-0003-0001-0000-000000000002", "hospital_id": HOSPITAL_ID,
     "department_id": "10000000-0003-0003-0003-000000000012", "label": "ICU - Intensive Care", "node_type": "department",
     "floor_number": 1, "x_pos": 48.0, "y_pos": 25.3},
    {"id": "30000000-0003-0001-0000-000000000003", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "OT Complex", "node_type": "department",
     "floor_number": 1, "x_pos": 80.7, "y_pos": 28.0},
    {"id": "30000000-0003-0001-0000-000000000004", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "Female General Ward", "node_type": "department",
     "floor_number": 1, "x_pos": 17.7, "y_pos": 67.7},
    {"id": "30000000-0003-0001-0000-000000000005", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "Private Rooms", "node_type": "department",
     "floor_number": 1, "x_pos": 80.7, "y_pos": 70.0},
    {"id": "30000000-0003-0001-0000-000000000006", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "Lifts (Floor 1)", "node_type": "lift",
     "floor_number": 1, "x_pos": 36.0, "y_pos": 79.3},
    {"id": "30000000-0003-0001-0000-000000000007", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "Staircase Left (F1)", "node_type": "stairs",
     "floor_number": 1, "x_pos": 10.6, "y_pos": 93.3},
    {"id": "30000000-0003-0001-0000-000000000008", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "Staircase Right (F1)", "node_type": "stairs",
     "floor_number": 1, "x_pos": 89.5, "y_pos": 93.3},

    # ═══ FIRST FLOOR (1) — CORRIDOR JUNCTIONS ═══
    {"id": "30000000-0003-0001-1000-000000000001", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "F1 MC Junction (Male Ward)", "node_type": "waypoint",
     "floor_number": 1, "x_pos": 17.7, "y_pos": 47.3},
    {"id": "30000000-0003-0001-1000-000000000002", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "F1 MC Junction (Lifts)", "node_type": "waypoint",
     "floor_number": 1, "x_pos": 36.0, "y_pos": 47.3},
    {"id": "30000000-0003-0001-1000-000000000003", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "F1 MC Junction (ICU)", "node_type": "waypoint",
     "floor_number": 1, "x_pos": 48.0, "y_pos": 47.3},
    {"id": "30000000-0003-0001-1000-000000000004", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "F1 MC Junction (OT)", "node_type": "waypoint",
     "floor_number": 1, "x_pos": 80.7, "y_pos": 47.3},
    {"id": "30000000-0003-0001-1000-000000000005", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "F1 MC Junction (Right)", "node_type": "waypoint",
     "floor_number": 1, "x_pos": 88.2, "y_pos": 47.3},
    {"id": "30000000-0003-0001-2000-000000000001", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "F1 LC Junction (Stairs-L)", "node_type": "waypoint",
     "floor_number": 1, "x_pos": 10.6, "y_pos": 88.3},
    {"id": "30000000-0003-0001-2000-000000000002", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "F1 LC Junction (Lifts)", "node_type": "waypoint",
     "floor_number": 1, "x_pos": 36.0, "y_pos": 88.3},
    {"id": "30000000-0003-0001-2000-000000000003", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "F1 LC Junction (Right)", "node_type": "waypoint",
     "floor_number": 1, "x_pos": 88.2, "y_pos": 88.3},
    {"id": "30000000-0003-0001-2000-000000000004", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "F1 LC Junction (Stairs-R)", "node_type": "waypoint",
     "floor_number": 1, "x_pos": 89.5, "y_pos": 88.3},

    # ═══ SECOND FLOOR (2) — ROOMS ═══
    {"id": "30000000-0003-0002-0000-000000000001", "hospital_id": HOSPITAL_ID,
     "department_id": "10000000-0003-0003-0003-000000000003", "label": "Neurology Ward", "node_type": "department",
     "floor_number": 2, "x_pos": 17.3, "y_pos": 26.0},
    {"id": "30000000-0003-0002-0000-000000000002", "hospital_id": HOSPITAL_ID,
     "department_id": "10000000-0003-0003-0003-000000000007", "label": "Neurosurgery", "node_type": "department",
     "floor_number": 2, "x_pos": 43.4, "y_pos": 26.0},
    {"id": "30000000-0003-0002-0000-000000000003", "hospital_id": HOSPITAL_ID,
     "department_id": "10000000-0003-0003-0003-000000000004", "label": "Oncology", "node_type": "department",
     "floor_number": 2, "x_pos": 67.2, "y_pos": 26.0},
    {"id": "30000000-0003-0002-0000-000000000004", "hospital_id": HOSPITAL_ID,
     "department_id": "10000000-0003-0003-0003-000000000005", "label": "Orthopedics Ward", "node_type": "department",
     "floor_number": 2, "x_pos": 15.9, "y_pos": 66.8},
    {"id": "30000000-0003-0002-0000-000000000005", "hospital_id": HOSPITAL_ID,
     "department_id": "10000000-0003-0003-0003-000000000008", "label": "Urology", "node_type": "department",
     "floor_number": 2, "x_pos": 39.9, "y_pos": 60.4},
    {"id": "30000000-0003-0002-0000-000000000006", "hospital_id": HOSPITAL_ID,
     "department_id": "10000000-0003-0003-0003-000000000009", "label": "Gastroenterology", "node_type": "department",
     "floor_number": 2, "x_pos": 62.8, "y_pos": 66.8},
    {"id": "30000000-0003-0002-0000-000000000007", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "Private & VIP Rooms", "node_type": "department",
     "floor_number": 2, "x_pos": 85.9, "y_pos": 66.8},
    {"id": "30000000-0003-0002-0000-000000000008", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "Lifts (Floor 2)", "node_type": "lift",
     "floor_number": 2, "x_pos": 29.3, "y_pos": 93.3},
    {"id": "30000000-0003-0002-0000-000000000009", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "Staircase Left (F2)", "node_type": "stairs",
     "floor_number": 2, "x_pos": 10.6, "y_pos": 93.3},
    {"id": "30000000-0003-0002-0000-000000000010", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "Staircase Right (F2)", "node_type": "stairs",
     "floor_number": 2, "x_pos": 89.5, "y_pos": 93.3},

    # ═══ SECOND FLOOR (2) — CORRIDOR JUNCTIONS ═══
    {"id": "30000000-0003-0002-1000-000000000001", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "F2 MC Junction (Neurology)", "node_type": "waypoint",
     "floor_number": 2, "x_pos": 17.3, "y_pos": 45.7},
    {"id": "30000000-0003-0002-1000-000000000002", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "F2 MC Junction (Neurosurgery)", "node_type": "waypoint",
     "floor_number": 2, "x_pos": 43.4, "y_pos": 45.7},
    {"id": "30000000-0003-0002-1000-000000000003", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "F2 MC Junction (Oncology)", "node_type": "waypoint",
     "floor_number": 2, "x_pos": 67.2, "y_pos": 45.7},
    {"id": "30000000-0003-0002-1000-000000000004", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "F2 MC Junction (Right)", "node_type": "waypoint",
     "floor_number": 2, "x_pos": 88.2, "y_pos": 45.7},
    {"id": "30000000-0003-0002-1000-000000000005", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "F2 MC Junction (Orthopedics)", "node_type": "waypoint",
     "floor_number": 2, "x_pos": 15.9, "y_pos": 45.7},
    {"id": "30000000-0003-0002-1000-000000000006", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "F2 MC Junction (Urology)", "node_type": "waypoint",
     "floor_number": 2, "x_pos": 39.9, "y_pos": 45.7},
    {"id": "30000000-0003-0002-1000-000000000007", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "F2 MC Junction (Gastro)", "node_type": "waypoint",
     "floor_number": 2, "x_pos": 62.8, "y_pos": 45.7},
    {"id": "30000000-0003-0002-1000-000000000008", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "F2 MC Junction (VIP)", "node_type": "waypoint",
     "floor_number": 2, "x_pos": 85.9, "y_pos": 45.7},
    {"id": "30000000-0003-0002-2000-000000000001", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "F2 LC Junction (Stairs-L)", "node_type": "waypoint",
     "floor_number": 2, "x_pos": 10.6, "y_pos": 88.3},
    {"id": "30000000-0003-0002-2000-000000000002", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "F2 LC Junction (Lifts)", "node_type": "waypoint",
     "floor_number": 2, "x_pos": 29.3, "y_pos": 88.3},
    {"id": "30000000-0003-0002-2000-000000000003", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "F2 LC Junction (Right)", "node_type": "waypoint",
     "floor_number": 2, "x_pos": 88.2, "y_pos": 88.3},
    {"id": "30000000-0003-0002-2000-000000000004", "hospital_id": HOSPITAL_ID,
     "department_id": None, "label": "F2 LC Junction (Stairs-R)", "node_type": "waypoint",
     "floor_number": 2, "x_pos": 89.5, "y_pos": 88.3},
]

# Insert in batches of 20
for i in range(0, len(nodes), 20):
    batch = nodes[i:i+20]
    sb.table("indoor_map_nodes").insert(batch).execute()
    print(f"      ✅ Inserted nodes batch {i//20 + 1} ({len(batch)} nodes)")

print(f"      Total: {len(nodes)} nodes inserted")


# ── Step 4: Insert corridor-aligned edges ─────────────────────
print("\n[4/4] Inserting corridor-aligned edges...")

edges = [
    # ═══ GROUND FLOOR — Main Corridor horizontal chain ═══
    {"id": "40000000-0003-0000-1000-000000000001", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0000-1000-000000000001", "to_node_id": "30000000-0003-0000-1000-000000000002", "distance_meters": 7, "is_accessible": True},
    {"id": "40000000-0003-0000-1000-000000000002", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0000-1000-000000000002", "to_node_id": "30000000-0003-0000-1000-000000000003", "distance_meters": 13, "is_accessible": True},
    {"id": "40000000-0003-0000-1000-000000000003", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0000-1000-000000000003", "to_node_id": "30000000-0003-0000-1000-000000000004", "distance_meters": 14, "is_accessible": True},
    {"id": "40000000-0003-0000-1000-000000000004", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0000-1000-000000000004", "to_node_id": "30000000-0003-0000-1000-000000000005", "distance_meters": 5, "is_accessible": True},
    {"id": "40000000-0003-0000-1000-000000000005", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0000-1000-000000000005", "to_node_id": "30000000-0003-0000-1000-000000000006", "distance_meters": 17, "is_accessible": True},
    {"id": "40000000-0003-0000-1000-000000000006", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0000-1000-000000000006", "to_node_id": "30000000-0003-0000-1000-000000000007", "distance_meters": 20, "is_accessible": True},
    {"id": "40000000-0003-0000-1000-000000000007", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0000-1000-000000000007", "to_node_id": "30000000-0003-0000-1000-000000000008", "distance_meters": 10, "is_accessible": True},

    # MC → Rooms ABOVE (vertical up)
    {"id": "40000000-0003-0000-1100-000000000001", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0000-1000-000000000002", "to_node_id": "30000000-0003-0000-0000-000000000001", "distance_meters": 15, "is_accessible": True},
    {"id": "40000000-0003-0000-1100-000000000002", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0000-1000-000000000004", "to_node_id": "30000000-0003-0000-0000-000000000002", "distance_meters": 15, "is_accessible": True},
    {"id": "40000000-0003-0000-1100-000000000003", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0000-1000-000000000006", "to_node_id": "30000000-0003-0000-0000-000000000003", "distance_meters": 15, "is_accessible": True},

    # MC → Rooms BELOW (vertical down)
    {"id": "40000000-0003-0000-1200-000000000001", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0000-1000-000000000001", "to_node_id": "30000000-0003-0000-0000-000000000004", "distance_meters": 12, "is_accessible": True},
    {"id": "40000000-0003-0000-1200-000000000002", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0000-1000-000000000003", "to_node_id": "30000000-0003-0000-0000-000000000005", "distance_meters": 12, "is_accessible": True},
    {"id": "40000000-0003-0000-1200-000000000003", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0000-1000-000000000005", "to_node_id": "30000000-0003-0000-0000-000000000006", "distance_meters": 8, "is_accessible": True},
    {"id": "40000000-0003-0000-1200-000000000004", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0000-0000-000000000006", "to_node_id": "30000000-0003-0000-0000-000000000007", "distance_meters": 8, "is_accessible": True},
    {"id": "40000000-0003-0000-1200-000000000005", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0000-1000-000000000006", "to_node_id": "30000000-0003-0000-0000-000000000008", "distance_meters": 12, "is_accessible": True},
    {"id": "40000000-0003-0000-1200-000000000006", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0000-1000-000000000007", "to_node_id": "30000000-0003-0000-0000-000000000009", "distance_meters": 12, "is_accessible": True},

    # Right-edge vertical: MC-Right → SC-Right
    {"id": "40000000-0003-0000-1300-000000000001", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0000-1000-000000000008", "to_node_id": "30000000-0003-0000-2000-000000000008", "distance_meters": 20, "is_accessible": True},

    # ═══ GROUND FLOOR — Service Corridor horizontal chain ═══
    {"id": "40000000-0003-0000-2000-000000000001", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0000-2000-000000000001", "to_node_id": "30000000-0003-0000-2000-000000000002", "distance_meters": 15, "is_accessible": True},
    {"id": "40000000-0003-0000-2000-000000000002", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0000-2000-000000000002", "to_node_id": "30000000-0003-0000-2000-000000000003", "distance_meters": 15, "is_accessible": True},
    {"id": "40000000-0003-0000-2000-000000000003", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0000-2000-000000000003", "to_node_id": "30000000-0003-0000-2000-000000000004", "distance_meters": 10, "is_accessible": True},
    {"id": "40000000-0003-0000-2000-000000000004", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0000-2000-000000000004", "to_node_id": "30000000-0003-0000-2000-000000000005", "distance_meters": 6, "is_accessible": True},
    {"id": "40000000-0003-0000-2000-000000000005", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0000-2000-000000000005", "to_node_id": "30000000-0003-0000-2000-000000000006", "distance_meters": 15, "is_accessible": True},
    {"id": "40000000-0003-0000-2000-000000000006", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0000-2000-000000000006", "to_node_id": "30000000-0003-0000-2000-000000000007", "distance_meters": 15, "is_accessible": True},
    {"id": "40000000-0003-0000-2000-000000000007", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0000-2000-000000000007", "to_node_id": "30000000-0003-0000-2000-000000000008", "distance_meters": 10, "is_accessible": True},

    # SC → Consult Rooms BELOW
    {"id": "40000000-0003-0000-2100-000000000001", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0000-2000-000000000001", "to_node_id": "30000000-0003-0000-0000-000000000010", "distance_meters": 10, "is_accessible": True},
    {"id": "40000000-0003-0000-2100-000000000002", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0000-2000-000000000002", "to_node_id": "30000000-0003-0000-0000-000000000011", "distance_meters": 10, "is_accessible": True},
    {"id": "40000000-0003-0000-2100-000000000003", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0000-2000-000000000003", "to_node_id": "30000000-0003-0000-0000-000000000012", "distance_meters": 10, "is_accessible": True},
    {"id": "40000000-0003-0000-2100-000000000004", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0000-2000-000000000005", "to_node_id": "30000000-0003-0000-0000-000000000013", "distance_meters": 10, "is_accessible": True},
    {"id": "40000000-0003-0000-2100-000000000005", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0000-2000-000000000006", "to_node_id": "30000000-0003-0000-0000-000000000014", "distance_meters": 10, "is_accessible": True},
    {"id": "40000000-0003-0000-2100-000000000006", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0000-2000-000000000007", "to_node_id": "30000000-0003-0000-0000-000000000015", "distance_meters": 10, "is_accessible": True},

    # Right-edge vertical: SC-Right → LC-Right
    {"id": "40000000-0003-0000-2300-000000000001", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0000-2000-000000000008", "to_node_id": "30000000-0003-0000-3000-000000000005", "distance_meters": 20, "is_accessible": True},

    # ═══ GROUND FLOOR — Lower Corridor horizontal chain ═══
    {"id": "40000000-0003-0000-3000-000000000001", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0000-3000-000000000001", "to_node_id": "30000000-0003-0000-3000-000000000002", "distance_meters": 40, "is_accessible": True},
    {"id": "40000000-0003-0000-3000-000000000002", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0000-3000-000000000002", "to_node_id": "30000000-0003-0000-3000-000000000003", "distance_meters": 9, "is_accessible": True},
    {"id": "40000000-0003-0000-3000-000000000003", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0000-3000-000000000003", "to_node_id": "30000000-0003-0000-3000-000000000004", "distance_meters": 27, "is_accessible": True},
    {"id": "40000000-0003-0000-3000-000000000004", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0000-3000-000000000004", "to_node_id": "30000000-0003-0000-3000-000000000005", "distance_meters": 6, "is_accessible": True},

    # LC → Bottom rooms
    {"id": "40000000-0003-0000-3100-000000000001", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0000-3000-000000000001", "to_node_id": "30000000-0003-0000-0000-000000000016", "distance_meters": 12, "is_accessible": True},
    {"id": "40000000-0003-0000-3100-000000000002", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0000-3000-000000000002", "to_node_id": "30000000-0003-0000-0000-000000000017", "distance_meters": 12, "is_accessible": True},
    {"id": "40000000-0003-0000-3100-000000000003", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0000-3000-000000000003", "to_node_id": "30000000-0003-0000-0000-000000000018", "distance_meters": 12, "is_accessible": True},
    {"id": "40000000-0003-0000-3100-000000000004", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0000-3000-000000000004", "to_node_id": "30000000-0003-0000-0000-000000000019", "distance_meters": 12, "is_accessible": True},

    # ═══ FIRST FLOOR EDGES ═══
    {"id": "40000000-0003-0001-1000-000000000001", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0001-1000-000000000001", "to_node_id": "30000000-0003-0001-1000-000000000002", "distance_meters": 20, "is_accessible": True},
    {"id": "40000000-0003-0001-1000-000000000002", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0001-1000-000000000002", "to_node_id": "30000000-0003-0001-1000-000000000003", "distance_meters": 13, "is_accessible": True},
    {"id": "40000000-0003-0001-1000-000000000003", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0001-1000-000000000003", "to_node_id": "30000000-0003-0001-1000-000000000004", "distance_meters": 36, "is_accessible": True},
    {"id": "40000000-0003-0001-1000-000000000004", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0001-1000-000000000004", "to_node_id": "30000000-0003-0001-1000-000000000005", "distance_meters": 8, "is_accessible": True},
    # F1 MC → rooms above
    {"id": "40000000-0003-0001-1100-000000000001", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0001-1000-000000000001", "to_node_id": "30000000-0003-0001-0000-000000000001", "distance_meters": 18, "is_accessible": True},
    {"id": "40000000-0003-0001-1100-000000000002", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0001-1000-000000000003", "to_node_id": "30000000-0003-0001-0000-000000000002", "distance_meters": 18, "is_accessible": True},
    {"id": "40000000-0003-0001-1100-000000000003", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0001-1000-000000000004", "to_node_id": "30000000-0003-0001-0000-000000000003", "distance_meters": 18, "is_accessible": True},
    # F1 MC → rooms below
    {"id": "40000000-0003-0001-1200-000000000001", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0001-1000-000000000001", "to_node_id": "30000000-0003-0001-0000-000000000004", "distance_meters": 18, "is_accessible": True},
    {"id": "40000000-0003-0001-1200-000000000002", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0001-1000-000000000004", "to_node_id": "30000000-0003-0001-0000-000000000005", "distance_meters": 18, "is_accessible": True},
    {"id": "40000000-0003-0001-1200-000000000003", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0001-1000-000000000002", "to_node_id": "30000000-0003-0001-0000-000000000006", "distance_meters": 25, "is_accessible": True},
    # F1 right-edge vertical
    {"id": "40000000-0003-0001-1300-000000000001", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0001-1000-000000000005", "to_node_id": "30000000-0003-0001-2000-000000000003", "distance_meters": 30, "is_accessible": True},
    # F1 LC horizontal
    {"id": "40000000-0003-0001-2000-000000000001", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0001-2000-000000000001", "to_node_id": "30000000-0003-0001-2000-000000000002", "distance_meters": 28, "is_accessible": True},
    {"id": "40000000-0003-0001-2000-000000000002", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0001-2000-000000000002", "to_node_id": "30000000-0003-0001-2000-000000000003", "distance_meters": 57, "is_accessible": True},
    {"id": "40000000-0003-0001-2000-000000000003", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0001-2000-000000000003", "to_node_id": "30000000-0003-0001-2000-000000000004", "distance_meters": 2, "is_accessible": True},
    # F1 LC → bottom rooms
    {"id": "40000000-0003-0001-2100-000000000001", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0001-2000-000000000001", "to_node_id": "30000000-0003-0001-0000-000000000007", "distance_meters": 5, "is_accessible": True},
    {"id": "40000000-0003-0001-2100-000000000002", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0001-2000-000000000004", "to_node_id": "30000000-0003-0001-0000-000000000008", "distance_meters": 5, "is_accessible": True},

    # ═══ SECOND FLOOR EDGES ═══
    {"id": "40000000-0003-0002-1000-000000000001", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0002-1000-000000000005", "to_node_id": "30000000-0003-0002-1000-000000000001", "distance_meters": 2, "is_accessible": True},
    {"id": "40000000-0003-0002-1000-000000000002", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0002-1000-000000000001", "to_node_id": "30000000-0003-0002-1000-000000000006", "distance_meters": 25, "is_accessible": True},
    {"id": "40000000-0003-0002-1000-000000000003", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0002-1000-000000000006", "to_node_id": "30000000-0003-0002-1000-000000000002", "distance_meters": 4, "is_accessible": True},
    {"id": "40000000-0003-0002-1000-000000000004", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0002-1000-000000000002", "to_node_id": "30000000-0003-0002-1000-000000000007", "distance_meters": 21, "is_accessible": True},
    {"id": "40000000-0003-0002-1000-000000000005", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0002-1000-000000000007", "to_node_id": "30000000-0003-0002-1000-000000000003", "distance_meters": 5, "is_accessible": True},
    {"id": "40000000-0003-0002-1000-000000000006", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0002-1000-000000000003", "to_node_id": "30000000-0003-0002-1000-000000000008", "distance_meters": 21, "is_accessible": True},
    {"id": "40000000-0003-0002-1000-000000000007", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0002-1000-000000000008", "to_node_id": "30000000-0003-0002-1000-000000000004", "distance_meters": 3, "is_accessible": True},
    # F2 MC → rooms above
    {"id": "40000000-0003-0002-1100-000000000001", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0002-1000-000000000001", "to_node_id": "30000000-0003-0002-0000-000000000001", "distance_meters": 18, "is_accessible": True},
    {"id": "40000000-0003-0002-1100-000000000002", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0002-1000-000000000002", "to_node_id": "30000000-0003-0002-0000-000000000002", "distance_meters": 18, "is_accessible": True},
    {"id": "40000000-0003-0002-1100-000000000003", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0002-1000-000000000003", "to_node_id": "30000000-0003-0002-0000-000000000003", "distance_meters": 18, "is_accessible": True},
    # F2 MC → rooms below
    {"id": "40000000-0003-0002-1200-000000000001", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0002-1000-000000000005", "to_node_id": "30000000-0003-0002-0000-000000000004", "distance_meters": 18, "is_accessible": True},
    {"id": "40000000-0003-0002-1200-000000000002", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0002-1000-000000000006", "to_node_id": "30000000-0003-0002-0000-000000000005", "distance_meters": 12, "is_accessible": True},
    {"id": "40000000-0003-0002-1200-000000000003", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0002-1000-000000000007", "to_node_id": "30000000-0003-0002-0000-000000000006", "distance_meters": 18, "is_accessible": True},
    {"id": "40000000-0003-0002-1200-000000000004", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0002-1000-000000000008", "to_node_id": "30000000-0003-0002-0000-000000000007", "distance_meters": 18, "is_accessible": True},
    # F2 right-edge vertical
    {"id": "40000000-0003-0002-1300-000000000001", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0002-1000-000000000004", "to_node_id": "30000000-0003-0002-2000-000000000003", "distance_meters": 30, "is_accessible": True},
    # F2 LC horizontal
    {"id": "40000000-0003-0002-2000-000000000001", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0002-2000-000000000001", "to_node_id": "30000000-0003-0002-2000-000000000002", "distance_meters": 20, "is_accessible": True},
    {"id": "40000000-0003-0002-2000-000000000002", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0002-2000-000000000002", "to_node_id": "30000000-0003-0002-2000-000000000003", "distance_meters": 65, "is_accessible": True},
    {"id": "40000000-0003-0002-2000-000000000003", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0002-2000-000000000003", "to_node_id": "30000000-0003-0002-2000-000000000004", "distance_meters": 2, "is_accessible": True},
    # F2 LC → bottom rooms
    {"id": "40000000-0003-0002-2100-000000000001", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0002-2000-000000000001", "to_node_id": "30000000-0003-0002-0000-000000000009", "distance_meters": 5, "is_accessible": True},
    {"id": "40000000-0003-0002-2100-000000000002", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0002-2000-000000000002", "to_node_id": "30000000-0003-0002-0000-000000000008", "distance_meters": 5, "is_accessible": True},
    {"id": "40000000-0003-0002-2100-000000000003", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0002-2000-000000000004", "to_node_id": "30000000-0003-0002-0000-000000000010", "distance_meters": 5, "is_accessible": True},

    # ═══ FLOOR TRANSITIONS ═══
    {"id": "40000000-0003-9000-0000-000000000001", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0000-0000-000000000017", "to_node_id": "30000000-0003-0001-0000-000000000006", "distance_meters": 0, "is_accessible": True},
    {"id": "40000000-0003-9000-0000-000000000002", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0001-0000-000000000006", "to_node_id": "30000000-0003-0002-0000-000000000008", "distance_meters": 0, "is_accessible": True},
    {"id": "40000000-0003-9000-0000-000000000003", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0000-0000-000000000018", "to_node_id": "30000000-0003-0001-0000-000000000007", "distance_meters": 0, "is_accessible": False},
    {"id": "40000000-0003-9000-0000-000000000004", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0001-0000-000000000007", "to_node_id": "30000000-0003-0002-0000-000000000009", "distance_meters": 0, "is_accessible": False},
    {"id": "40000000-0003-9000-0000-000000000005", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0000-0000-000000000019", "to_node_id": "30000000-0003-0001-0000-000000000008", "distance_meters": 0, "is_accessible": False},
    {"id": "40000000-0003-9000-0000-000000000006", "hospital_id": HOSPITAL_ID,
     "from_node_id": "30000000-0003-0001-0000-000000000008", "to_node_id": "30000000-0003-0002-0000-000000000010", "distance_meters": 0, "is_accessible": False},
]

# Insert edges in batches
for i in range(0, len(edges), 20):
    batch = edges[i:i+20]
    sb.table("indoor_map_edges").insert(batch).execute()
    print(f"      ✅ Inserted edges batch {i//20 + 1} ({len(batch)} edges)")

print(f"      Total: {len(edges)} edges inserted")

# ── Verify ────────────────────────────────────────────────────
node_count = sb.table("indoor_map_nodes").select("id", count="exact").eq("hospital_id", HOSPITAL_ID).execute()
edge_count = sb.table("indoor_map_edges").select("id", count="exact").eq("hospital_id", HOSPITAL_ID).execute()

print("\n" + "=" * 60)
print(f"✅ DONE! Ruby Hall indoor map seeded successfully.")
print(f"   Nodes: {node_count.count}")
print(f"   Edges: {edge_count.count}")
print("=" * 60)
