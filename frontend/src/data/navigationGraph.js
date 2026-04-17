/**
 * MediGuide AI — Ruby Hall Clinic Navigation Graph (v2)
 * Corrected node positions so ALL paths follow corridors only.
 *
 * KEY PRINCIPLE: Room "door" nodes sit ON the corridor edge.
 * Corridor junctions sit IN the corridor. Vertical movement
 * happens ONLY through designated vertical connector nodes
 * on the left edge, right edge, or center gap.
 * No edge ever crosses a room interior.
 *
 * Coordinate system: viewBox 0 0 1200 830 matching PNG images.
 */

// ── Helper ───────────────────────────────────────────────────
function dist(x1, y1, x2, y2) {
  return Math.round(Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2) * 10) / 10
}

// ═══════════════════════════════════════════════════════════════
// NODES
// ═══════════════════════════════════════════════════════════════

export const NODES = [
  // ╔═══════════════════════════════════════════════════════════╗
  // ║  GROUND FLOOR (floor: 0)                                 ║
  // ╚═══════════════════════════════════════════════════════════╝

  // — Corridor Y positions: Main=195, Service=415, Lower=635 —
  // — Vertical strips: Left x=280, Right x=1160 —

  // Top row rooms (doors open DOWN onto Main Entrance Corridor y=195)
  { id: 'G_MAIN_ENTRANCE',  floor: 0, x: 370, y: 195, label: 'Main Entrance',        type: 'entrance' },
  { id: 'G_OPD',            floor: 0, x: 560, y: 195, label: 'OPD Registration',      type: 'department' },
  { id: 'G_EMERGENCY',      floor: 0, x: 860, y: 195, label: 'Emergency & Casualty',  type: 'department', isCritical: true },
  { id: 'G_AMBULANCE',      floor: 0, x: 1100, y: 195, label: 'Ambulance Bay',        type: 'department', isCritical: true },
  { id: 'G_SECURITY',       floor: 0, x: 1100, y: 195, label: 'Security Post',        type: 'department' },

  // Main Entrance Corridor junctions (all at y=195)
  { id: 'G_MJ1', floor: 0, x: 280, y: 195, label: 'Main Corridor J1', type: 'junction' },
  { id: 'G_MJ2', floor: 0, x: 460, y: 195, label: 'Main Corridor J2', type: 'junction' },
  { id: 'G_MJ3', floor: 0, x: 600, y: 195, label: 'Main Corridor J3', type: 'junction' },
  { id: 'G_MJ4', floor: 0, x: 760, y: 195, label: 'Main Corridor J4', type: 'junction' },
  { id: 'G_MJ5', floor: 0, x: 960, y: 195, label: 'Main Corridor J5', type: 'junction' },
  { id: 'G_MJ6', floor: 0, x: 1160, y: 195, label: 'Main Corridor J6', type: 'junction' },

  // Middle row rooms (doors on corridor edges)
  // — Top door on Main Corridor y=195, Bottom door on Service Corridor y=415 —
  { id: 'G_CARDIOLOGY',  floor: 0, x: 310, y: 415, label: 'Cardiology OPD',  type: 'department' },
  { id: 'G_RADIOLOGY',   floor: 0, x: 460, y: 415, label: 'Radiology',       type: 'department' },
  { id: 'G_BLOOD_BANK',  floor: 0, x: 600, y: 415, label: 'Blood Bank',      type: 'department' },
  { id: 'G_PATHOLOGY',   floor: 0, x: 810, y: 415, label: 'Pathology Lab',   type: 'department' },
  { id: 'G_PHARMACY',    floor: 0, x: 960, y: 415, label: 'Pharmacy',        type: 'department' },
  { id: 'G_CAFETERIA',   floor: 0, x: 1100, y: 415, label: 'Cafeteria',      type: 'department' },

  // Service Corridor junctions (all at y=415)
  { id: 'G_SJ1', floor: 0, x: 280, y: 415, label: 'Service Corridor J1', type: 'junction' },
  { id: 'G_SJ2', floor: 0, x: 460, y: 415, label: 'Service Corridor J2', type: 'junction' },
  { id: 'G_SJ3', floor: 0, x: 600, y: 415, label: 'Service Corridor J3', type: 'junction' },
  { id: 'G_SJ4', floor: 0, x: 760, y: 415, label: 'Service Corridor J4', type: 'junction' },
  { id: 'G_SJ5', floor: 0, x: 960, y: 415, label: 'Service Corridor J5', type: 'junction' },
  { id: 'G_SJ6', floor: 0, x: 1160, y: 415, label: 'Service Corridor J6', type: 'junction' },

  // Consultation rooms (doors on Service Corridor y=415)
  { id: 'G_C01', floor: 0, x: 310, y: 415, label: 'C-01 Cardiology Consult',        type: 'department' },
  { id: 'G_C02', floor: 0, x: 460, y: 415, label: 'C-02 Neurology Consult',         type: 'department' },
  { id: 'G_C03', floor: 0, x: 600, y: 415, label: 'C-03 Orthopedics Consult',       type: 'department' },
  { id: 'G_C04', floor: 0, x: 810, y: 635, label: 'C-04 Oncology Consult',          type: 'department' },
  { id: 'G_C05', floor: 0, x: 960, y: 635, label: 'C-05 Urology Consult',           type: 'department' },
  { id: 'G_C06', floor: 0, x: 1100, y: 635, label: 'C-06 Gastroenterology Consult', type: 'department' },

  // Lower Corridor junctions (all at y=635)
  { id: 'G_LJ1', floor: 0, x: 280, y: 635, label: 'Lower Corridor J1', type: 'junction' },
  { id: 'G_LJ2', floor: 0, x: 490, y: 635, label: 'Lower Corridor J2', type: 'junction' },
  { id: 'G_LJ3', floor: 0, x: 590, y: 635, label: 'Lower Corridor J3', type: 'junction' },
  { id: 'G_LJ4', floor: 0, x: 700, y: 635, label: 'Lower Corridor J4', type: 'junction' },
  { id: 'G_LJ5', floor: 0, x: 800, y: 635, label: 'Lower Corridor J5', type: 'junction' },
  { id: 'G_LJ6', floor: 0, x: 940, y: 635, label: 'Lower Corridor J6', type: 'junction' },
  { id: 'G_LJ7', floor: 0, x: 1090, y: 635, label: 'Lower Corridor J7', type: 'junction' },
  { id: 'G_LJ8', floor: 0, x: 1160, y: 635, label: 'Lower Corridor J8', type: 'junction' },

  // Bottom row rooms (doors on Lower Corridor y=635)
  { id: 'G_WAITING',       floor: 0, x: 370, y: 635, label: 'Waiting Area',       type: 'department' },
  { id: 'G_WASHROOM_M',    floor: 0, x: 490, y: 635, label: 'Washroom (Male)',    type: 'department' },
  { id: 'G_WASHROOM_F',    floor: 0, x: 490, y: 635, label: 'Washroom (Female)',  type: 'department' },
  { id: 'G_MED_STORE',     floor: 0, x: 590, y: 635, label: 'Medical Store',      type: 'department' },
  { id: 'G_STAIRS',        floor: 0, x: 700, y: 635, label: 'Staircase',          type: 'stairs' },
  { id: 'G_LIFT',          floor: 0, x: 800, y: 635, label: 'Lift',               type: 'lift' },
  { id: 'G_ADMIN',         floor: 0, x: 940, y: 635, label: 'Admin Office',       type: 'department' },
  { id: 'G_STAIRS_FIRE',   floor: 0, x: 1090, y: 635, label: 'Staircase (Fire Exit)', type: 'stairs' },

  // Vertical connectors — RIGHT side (x=1160, within the thin orange strip)
  { id: 'G_VR_M', floor: 0, x: 1160, y: 195, label: 'Right V Main', type: 'junction' },
  { id: 'G_VR_S', floor: 0, x: 1160, y: 415, label: 'Right V Service', type: 'junction' },
  { id: 'G_VR_L', floor: 0, x: 1160, y: 635, label: 'Right V Lower', type: 'junction' },

  // Vertical connectors — LEFT side (x=280)
  { id: 'G_VL_M', floor: 0, x: 280, y: 195, label: 'Left V Main', type: 'junction' },
  { id: 'G_VL_S', floor: 0, x: 280, y: 415, label: 'Left V Service', type: 'junction' },
  { id: 'G_VL_L', floor: 0, x: 280, y: 635, label: 'Left V Lower', type: 'junction' },

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  FIRST FLOOR (floor: 1)                                  ║
  // ╚═══════════════════════════════════════════════════════════╝

  // — Corridors: Service=315, Lower=660 —
  // — Center gap at x≈690 between ward & OT/private sections —

  // Top row (doors on Service Corridor y=315)
  { id: '1F_MALE_WARD',    floor: 1, x: 460, y: 315, label: 'Male General Ward',   type: 'department' },
  { id: '1F_NURSE_WARD_M', floor: 1, x: 380, y: 315, label: 'Nurse Station (Male)', type: 'department' },
  { id: '1F_DOCTOR_ROOM',  floor: 1, x: 400, y: 315, label: 'Doctor Room',         type: 'department' },
  { id: '1F_OT1',          floor: 1, x: 860, y: 315, label: 'OT-1 General Surgery', type: 'department', isSterile: true },
  { id: '1F_OT2',          floor: 1, x: 1040, y: 315, label: 'OT-2 Orthopaedics',  type: 'department', isSterile: true },
  { id: '1F_OT3',          floor: 1, x: 860, y: 315, label: 'OT-3 Gynaecology',    type: 'department', isSterile: true },
  { id: '1F_OT4',          floor: 1, x: 1040, y: 315, label: 'OT-4 Emergency OT',  type: 'department', isSterile: true },
  { id: '1F_PREOP',        floor: 1, x: 860, y: 315, label: 'Pre-Op Room',          type: 'department' },
  { id: '1F_POSTOP',       floor: 1, x: 1040, y: 315, label: 'Post-Op Room',        type: 'department' },

  // Service Corridor 1F junctions (all at y=315)
  { id: '1F_SJ1', floor: 1, x: 280, y: 315, label: '1F Service J1', type: 'junction' },
  { id: '1F_SJ2', floor: 1, x: 460, y: 315, label: '1F Service J2', type: 'junction' },
  { id: '1F_SJ3', floor: 1, x: 690, y: 315, label: '1F Service J3 Center', type: 'junction' },
  { id: '1F_SJ4', floor: 1, x: 860, y: 315, label: '1F Service J4', type: 'junction' },
  { id: '1F_SJ5', floor: 1, x: 1040, y: 315, label: '1F Service J5', type: 'junction' },
  { id: '1F_SJ6', floor: 1, x: 1160, y: 315, label: '1F Service J6', type: 'junction' },

  // Middle section (doors on corridors)
  { id: '1F_FEMALE_WARD',  floor: 1, x: 460, y: 660, label: 'Female General Ward', type: 'department' },
  { id: '1F_NURSE_WARD_F', floor: 1, x: 380, y: 660, label: 'Nurse Station (Female)', type: 'department' },
  { id: '1F_PRIV_P1',      floor: 1, x: 860, y: 660, label: 'Room P1 (Semi-Private)', type: 'department' },
  { id: '1F_PRIV_P2',      floor: 1, x: 1040, y: 660, label: 'Room P2 (Semi-Private)', type: 'department' },
  { id: '1F_PRIV_P3',      floor: 1, x: 860, y: 660, label: 'Room P3 (Private)',      type: 'department' },
  { id: '1F_PRIV_P4',      floor: 1, x: 1040, y: 660, label: 'Room P4 (Private)',     type: 'department' },
  { id: '1F_PRIV_P5',      floor: 1, x: 860, y: 660, label: 'Room P5 (VIP)',          type: 'department' },
  { id: '1F_PRIV_P6',      floor: 1, x: 1040, y: 660, label: 'Room P6 (VIP)',         type: 'department' },

  // Lower Corridor 1F junctions (all at y=660)
  { id: '1F_LJ1', floor: 1, x: 280, y: 660, label: '1F Lower J1', type: 'junction' },
  { id: '1F_LJ2', floor: 1, x: 460, y: 660, label: '1F Lower J2', type: 'junction' },
  { id: '1F_LJ3', floor: 1, x: 690, y: 660, label: '1F Lower J3 Center', type: 'junction' },
  { id: '1F_LJ4', floor: 1, x: 800, y: 660, label: '1F Lower J4', type: 'junction' },
  { id: '1F_LJ5', floor: 1, x: 950, y: 660, label: '1F Lower J5', type: 'junction' },
  { id: '1F_LJ6', floor: 1, x: 1160, y: 660, label: '1F Lower J6', type: 'junction' },

  // Bottom row 1F (doors on Lower Corridor y=660)
  { id: '1F_WAITING',     floor: 1, x: 400, y: 660, label: 'Waiting Area 1F',     type: 'department' },
  { id: '1F_WASHROOM',    floor: 1, x: 555, y: 660, label: 'Washrooms 1F',        type: 'department' },
  { id: '1F_STAIRS',      floor: 1, x: 690, y: 660, label: 'Staircase 1F',        type: 'stairs' },
  { id: '1F_LIFT',        floor: 1, x: 800, y: 660, label: 'Lift 1F',             type: 'lift' },
  { id: '1F_MED_STORE',   floor: 1, x: 950, y: 660, label: 'Medical Store 1F',    type: 'department' },
  { id: '1F_STAIRS_FIRE', floor: 1, x: 1090, y: 660, label: 'Staircase Fire 1F',  type: 'stairs' },

  // Vertical connectors 1F
  { id: '1F_VR_S', floor: 1, x: 1160, y: 315, label: '1F Right V Top', type: 'junction' },
  { id: '1F_VR_L', floor: 1, x: 1160, y: 660, label: '1F Right V Bot', type: 'junction' },
  { id: '1F_VL_S', floor: 1, x: 280, y: 315, label: '1F Left V Top', type: 'junction' },
  { id: '1F_VL_L', floor: 1, x: 280, y: 660, label: '1F Left V Bot', type: 'junction' },
  // Center vertical connector (gap between wards & OT/private)
  { id: '1F_VC_S', floor: 1, x: 690, y: 315, label: '1F Center V Top', type: 'junction' },
  { id: '1F_VC_L', floor: 1, x: 690, y: 660, label: '1F Center V Bot', type: 'junction' },

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  SECOND FLOOR (floor: 2)                                 ║
  // ╚═══════════════════════════════════════════════════════════╝

  // — Corridors: C1=130, C2=340, C3=530, Lower=680 —
  // — Center gap at x≈690 between left/right room blocks —

  // Top section (doors on Corridor 1 y=130)
  { id: '2F_NEURO_WARD',   floor: 2, x: 460, y: 130, label: 'Neurology Ward',      type: 'department' },
  { id: '2F_NURSE_NEURO',  floor: 2, x: 340, y: 130, label: 'Nurse Station (Neuro)', type: 'department' },
  { id: '2F_DOCTOR_NEURO', floor: 2, x: 490, y: 130, label: 'Doctor Room (Neuro)',  type: 'department' },
  { id: '2F_PREOP_NEURO',  floor: 2, x: 860, y: 130, label: 'Pre-Op Room (Neuro-Onco)', type: 'department' },
  { id: '2F_POSTOP_NEURO', floor: 2, x: 1060, y: 130, label: 'Post-Op Room (Neuro-Onco)', type: 'department' },

  // Corridor 1 junctions (all at y=130)
  { id: '2F_C1J1', floor: 2, x: 280, y: 130, label: '2F C1 J1', type: 'junction' },
  { id: '2F_C1J2', floor: 2, x: 460, y: 130, label: '2F C1 J2', type: 'junction' },
  { id: '2F_C1J3', floor: 2, x: 690, y: 130, label: '2F C1 J3 Center', type: 'junction' },
  { id: '2F_C1J4', floor: 2, x: 860, y: 130, label: '2F C1 J4', type: 'junction' },
  { id: '2F_C1J5', floor: 2, x: 1060, y: 130, label: '2F C1 J5', type: 'junction' },
  { id: '2F_C1J6', floor: 2, x: 1160, y: 130, label: '2F C1 J6', type: 'junction' },

  // Neurosurgery & Oncology (doors on Corridor 2 y=340)
  { id: '2F_NEUROSURGERY',  floor: 2, x: 430, y: 340, label: 'Neurosurgery',       type: 'department' },
  { id: '2F_NEURO_OT',      floor: 2, x: 580, y: 340, label: 'Neuro-OT',           type: 'department', isSterile: true },
  { id: '2F_NEURO_OPD',     floor: 2, x: 580, y: 340, label: 'Neurosurgery OPD',   type: 'department' },
  { id: '2F_CHEMO',         floor: 2, x: 910, y: 340, label: 'Chemo Infusion',     type: 'department' },
  { id: '2F_ONCO_DAYCARE',  floor: 2, x: 1080, y: 340, label: 'Oncology Daycare',  type: 'department' },
  { id: '2F_NURSE_ONCO',    floor: 2, x: 810, y: 340, label: 'Nurse Station (Onco)', type: 'department' },

  // Corridor 2 junctions (all at y=340)
  { id: '2F_C2J1', floor: 2, x: 280, y: 340, label: '2F C2 J1', type: 'junction' },
  { id: '2F_C2J2', floor: 2, x: 430, y: 340, label: '2F C2 J2', type: 'junction' },
  { id: '2F_C2J3', floor: 2, x: 690, y: 340, label: '2F C2 J3 Center', type: 'junction' },
  { id: '2F_C2J4', floor: 2, x: 910, y: 340, label: '2F C2 J4', type: 'junction' },
  { id: '2F_C2J5', floor: 2, x: 1080, y: 340, label: '2F C2 J5', type: 'junction' },
  { id: '2F_C2J6', floor: 2, x: 1160, y: 340, label: '2F C2 J6', type: 'junction' },

  // Orthopedics & Gastroenterology (doors on Corridor 3 y=530)
  { id: '2F_ORTHO_WARD',   floor: 2, x: 400, y: 530, label: 'Orthopedics Ward',    type: 'department' },
  { id: '2F_PLASTER',      floor: 2, x: 520, y: 530, label: 'Plaster Room',        type: 'department' },
  { id: '2F_PHYSIO',       floor: 2, x: 520, y: 530, label: 'Physiotherapy',        type: 'department' },
  { id: '2F_NURSE_ORTHO',  floor: 2, x: 630, y: 530, label: 'Nurse Station (Ortho)', type: 'department' },
  { id: '2F_NURSE_GASTRO', floor: 2, x: 810, y: 530, label: 'Nurse Station (Gastro)', type: 'department' },
  { id: '2F_GI_ENDOSCOPY', floor: 2, x: 930, y: 530, label: 'GI Endoscopy Suite',  type: 'department' },
  { id: '2F_GASTRO_OPD',   floor: 2, x: 1070, y: 530, label: 'Gastro OPD',         type: 'department' },

  // Corridor 3 junctions (all at y=530)
  { id: '2F_C3J1', floor: 2, x: 280, y: 530, label: '2F C3 J1', type: 'junction' },
  { id: '2F_C3J2', floor: 2, x: 520, y: 530, label: '2F C3 J2', type: 'junction' },
  { id: '2F_C3J3', floor: 2, x: 690, y: 530, label: '2F C3 J3 Center', type: 'junction' },
  { id: '2F_C3J4', floor: 2, x: 810, y: 530, label: '2F C3 J4', type: 'junction' },
  { id: '2F_C3J5', floor: 2, x: 1070, y: 530, label: '2F C3 J5', type: 'junction' },
  { id: '2F_C3J6', floor: 2, x: 1160, y: 530, label: '2F C3 J6', type: 'junction' },

  // Urology & Semi-Private (doors on Lower Corridor y=680)
  { id: '2F_UROLOGY',       floor: 2, x: 430, y: 680, label: 'Urology Ward',       type: 'department' },
  { id: '2F_URO_OPD',       floor: 2, x: 560, y: 680, label: 'Urology OPD',        type: 'department' },
  { id: '2F_ENDOSCOPY',     floor: 2, x: 640, y: 680, label: 'Endoscopy Suite',     type: 'department' },
  { id: '2F_SEMI_S1',       floor: 2, x: 830, y: 680, label: 'Room S1 (Semi-Priv)', type: 'department' },
  { id: '2F_SEMI_S2',       floor: 2, x: 940, y: 680, label: 'Room S2 (Semi-Priv)', type: 'department' },
  { id: '2F_SEMI_S3',       floor: 2, x: 1040, y: 680, label: 'Room S3 (Semi-Priv)', type: 'department' },
  { id: '2F_NURSE_SEMI',    floor: 2, x: 1110, y: 680, label: 'Nurse Station (Semi)', type: 'department' },

  // Lower Corridor 2F junctions (all at y=680)
  { id: '2F_LJ1', floor: 2, x: 280, y: 680, label: '2F Lower J1', type: 'junction' },
  { id: '2F_LJ2', floor: 2, x: 535, y: 680, label: '2F Lower J2', type: 'junction' },
  { id: '2F_LJ3', floor: 2, x: 690, y: 680, label: '2F Lower J3 Center', type: 'junction' },
  { id: '2F_LJ4', floor: 2, x: 790, y: 680, label: '2F Lower J4 Lift', type: 'junction' },
  { id: '2F_LJ5', floor: 2, x: 950, y: 680, label: '2F Lower J5', type: 'junction' },
  { id: '2F_LJ6', floor: 2, x: 1090, y: 680, label: '2F Lower J6', type: 'junction' },
  { id: '2F_LJ7', floor: 2, x: 1160, y: 680, label: '2F Lower J7', type: 'junction' },

  // Bottom row 2F (doors on Lower Corridor y=680)
  { id: '2F_WAITING',     floor: 2, x: 400, y: 680, label: 'Waiting Area 2F',  type: 'department' },
  { id: '2F_WASHROOM',    floor: 2, x: 535, y: 680, label: 'Washrooms 2F',     type: 'department' },
  { id: '2F_STAIRS',      floor: 2, x: 690, y: 680, label: 'Staircase 2F',     type: 'stairs' },
  { id: '2F_LIFT',        floor: 2, x: 790, y: 680, label: 'Lift 2F',          type: 'lift' },
  { id: '2F_MED_STORE',   floor: 2, x: 950, y: 680, label: 'Medical Store 2F', type: 'department' },
  { id: '2F_STAIRS_FIRE', floor: 2, x: 1090, y: 680, label: 'Staircase Fire 2F', type: 'stairs' },

  // Vertical connectors 2F — RIGHT edge (x=1160)
  { id: '2F_VR1', floor: 2, x: 1160, y: 130, label: '2F Right V C1', type: 'junction' },
  { id: '2F_VR2', floor: 2, x: 1160, y: 340, label: '2F Right V C2', type: 'junction' },
  { id: '2F_VR3', floor: 2, x: 1160, y: 530, label: '2F Right V C3', type: 'junction' },
  { id: '2F_VR4', floor: 2, x: 1160, y: 680, label: '2F Right V Lower', type: 'junction' },

  // Vertical connectors 2F — LEFT edge (x=280)
  { id: '2F_VL1', floor: 2, x: 280, y: 130, label: '2F Left V C1', type: 'junction' },
  { id: '2F_VL2', floor: 2, x: 280, y: 340, label: '2F Left V C2', type: 'junction' },
  { id: '2F_VL3', floor: 2, x: 280, y: 530, label: '2F Left V C3', type: 'junction' },
  { id: '2F_VL4', floor: 2, x: 280, y: 680, label: '2F Left V Lower', type: 'junction' },

  // Vertical connectors 2F — CENTER gap (x=690, between room blocks)
  { id: '2F_VC1', floor: 2, x: 690, y: 130, label: '2F Center V C1', type: 'junction' },
  { id: '2F_VC2', floor: 2, x: 690, y: 340, label: '2F Center V C2', type: 'junction' },
  { id: '2F_VC3', floor: 2, x: 690, y: 530, label: '2F Center V C3', type: 'junction' },
  { id: '2F_VC4', floor: 2, x: 690, y: 680, label: '2F Center V Lower', type: 'junction' },
]

// ═══════════════════════════════════════════════════════════════
// EDGES — Strictly corridor-following, auto-weighted
// ═══════════════════════════════════════════════════════════════

function e(from, to, extraWeight = 0) {
  const n1 = NODES.find(n => n.id === from)
  const n2 = NODES.find(n => n.id === to)
  if (!n1 || !n2) { console.warn(`Missing: ${from} or ${to}`); return null }
  return { from, to, weight: dist(n1.x, n1.y, n2.x, n2.y) + extraWeight }
}

const RAW_EDGES = [
  // ── GROUND FLOOR ────────────────────────────────────────────

  // Main Corridor horizontal (y=195)
  e('G_MJ1', 'G_MJ2'), e('G_MJ2', 'G_MJ3'), e('G_MJ3', 'G_MJ4'),
  e('G_MJ4', 'G_MJ5'), e('G_MJ5', 'G_MJ6'),

  // Rooms → nearest Main Corridor junction
  e('G_MAIN_ENTRANCE', 'G_MJ1'), e('G_MAIN_ENTRANCE', 'G_MJ2'),
  e('G_OPD', 'G_MJ2'), e('G_OPD', 'G_MJ3'),
  e('G_EMERGENCY', 'G_MJ4'), e('G_EMERGENCY', 'G_MJ5'),
  e('G_AMBULANCE', 'G_MJ6'), e('G_SECURITY', 'G_MJ6'),

  // Service Corridor horizontal (y=415)
  e('G_SJ1', 'G_SJ2'), e('G_SJ2', 'G_SJ3'), e('G_SJ3', 'G_SJ4'),
  e('G_SJ4', 'G_SJ5'), e('G_SJ5', 'G_SJ6'),

  // Middle rooms → Service Corridor junction (same x as room)
  e('G_CARDIOLOGY', 'G_SJ1'), e('G_RADIOLOGY', 'G_SJ2'),
  e('G_BLOOD_BANK', 'G_SJ3'), e('G_PATHOLOGY', 'G_SJ4'),
  e('G_PHARMACY', 'G_SJ5'), e('G_CAFETERIA', 'G_SJ6'),

  // Consult rooms → Service Corridor
  e('G_C01', 'G_SJ1'), e('G_C02', 'G_SJ2'), e('G_C03', 'G_SJ3'),

  // Lower Corridor horizontal (y=635)
  e('G_LJ1', 'G_LJ2'), e('G_LJ2', 'G_LJ3'), e('G_LJ3', 'G_LJ4'),
  e('G_LJ4', 'G_LJ5'), e('G_LJ5', 'G_LJ6'), e('G_LJ6', 'G_LJ7'),
  e('G_LJ7', 'G_LJ8'),

  // Consult rooms with doors on lower corridor
  e('G_C04', 'G_LJ5'), e('G_C05', 'G_LJ6'), e('G_C06', 'G_LJ7'),

  // Bottom rooms → Lower Corridor
  e('G_WAITING', 'G_LJ1'), e('G_WASHROOM_M', 'G_LJ2'),
  e('G_WASHROOM_F', 'G_LJ2'), e('G_MED_STORE', 'G_LJ3'),
  e('G_STAIRS', 'G_LJ4'), e('G_LIFT', 'G_LJ5'),
  e('G_ADMIN', 'G_LJ6'), e('G_STAIRS_FIRE', 'G_LJ7'),

  // RIGHT vertical connector (x=1160): Main ↔ Service ↔ Lower
  e('G_VR_M', 'G_VR_S'), e('G_VR_S', 'G_VR_L'),
  e('G_MJ6', 'G_VR_M'), e('G_SJ6', 'G_VR_S'), e('G_LJ8', 'G_VR_L'),

  // LEFT vertical connector (x=280): Main ↔ Service ↔ Lower
  e('G_VL_M', 'G_VL_S'), e('G_VL_S', 'G_VL_L'),
  e('G_MJ1', 'G_VL_M'), e('G_SJ1', 'G_VL_S'), e('G_LJ1', 'G_VL_L'),

  // ── FIRST FLOOR ─────────────────────────────────────────────

  // Service Corridor 1F horizontal (y=315)
  e('1F_SJ1', '1F_SJ2'), e('1F_SJ2', '1F_SJ3'), e('1F_SJ3', '1F_SJ4'),
  e('1F_SJ4', '1F_SJ5'), e('1F_SJ5', '1F_SJ6'),

  // Rooms → Service Corridor
  e('1F_MALE_WARD', '1F_SJ2'), e('1F_NURSE_WARD_M', '1F_SJ1'),
  e('1F_DOCTOR_ROOM', '1F_SJ1'),
  e('1F_OT1', '1F_SJ4'), e('1F_OT2', '1F_SJ5'),
  e('1F_OT3', '1F_SJ4'), e('1F_OT4', '1F_SJ5'),
  e('1F_PREOP', '1F_SJ4'), e('1F_POSTOP', '1F_SJ5'),

  // Lower Corridor 1F horizontal (y=660)
  e('1F_LJ1', '1F_LJ2'), e('1F_LJ2', '1F_LJ3'), e('1F_LJ3', '1F_LJ4'),
  e('1F_LJ4', '1F_LJ5'), e('1F_LJ5', '1F_LJ6'),

  // Rooms → Lower Corridor
  e('1F_FEMALE_WARD', '1F_LJ2'), e('1F_NURSE_WARD_F', '1F_LJ1'),
  e('1F_PRIV_P1', '1F_LJ5'), e('1F_PRIV_P2', '1F_LJ5'),
  e('1F_PRIV_P3', '1F_LJ5'), e('1F_PRIV_P4', '1F_LJ5'),
  e('1F_PRIV_P5', '1F_LJ5'), e('1F_PRIV_P6', '1F_LJ6'),

  // Bottom → Lower Corridor
  e('1F_WAITING', '1F_LJ1'), e('1F_WASHROOM', '1F_LJ2'),
  e('1F_STAIRS', '1F_LJ3'), e('1F_LIFT', '1F_LJ4'),
  e('1F_MED_STORE', '1F_LJ5'), e('1F_STAIRS_FIRE', '1F_LJ6'),

  // Vertical connectors 1F
  e('1F_VR_S', '1F_VR_L'), e('1F_SJ6', '1F_VR_S'), e('1F_LJ6', '1F_VR_L'),
  e('1F_VL_S', '1F_VL_L'), e('1F_SJ1', '1F_VL_S'), e('1F_LJ1', '1F_VL_L'),
  e('1F_VC_S', '1F_VC_L'), e('1F_SJ3', '1F_VC_S'), e('1F_LJ3', '1F_VC_L'),

  // ── SECOND FLOOR ────────────────────────────────────────────

  // Corridor 1 horizontal (y=130)
  e('2F_C1J1', '2F_C1J2'), e('2F_C1J2', '2F_C1J3'),
  e('2F_C1J3', '2F_C1J4'), e('2F_C1J4', '2F_C1J5'), e('2F_C1J5', '2F_C1J6'),

  e('2F_NEURO_WARD', '2F_C1J2'), e('2F_NURSE_NEURO', '2F_C1J1'),
  e('2F_DOCTOR_NEURO', '2F_C1J2'),
  e('2F_PREOP_NEURO', '2F_C1J4'), e('2F_POSTOP_NEURO', '2F_C1J5'),

  // Corridor 2 horizontal (y=340)
  e('2F_C2J1', '2F_C2J2'), e('2F_C2J2', '2F_C2J3'),
  e('2F_C2J3', '2F_C2J4'), e('2F_C2J4', '2F_C2J5'), e('2F_C2J5', '2F_C2J6'),

  e('2F_NEUROSURGERY', '2F_C2J2'), e('2F_NEURO_OT', '2F_C2J3'),
  e('2F_NEURO_OPD', '2F_C2J3'),
  e('2F_NURSE_ONCO', '2F_C2J4'), e('2F_CHEMO', '2F_C2J4'),
  e('2F_ONCO_DAYCARE', '2F_C2J5'),

  // Corridor 3 horizontal (y=530)
  e('2F_C3J1', '2F_C3J2'), e('2F_C3J2', '2F_C3J3'),
  e('2F_C3J3', '2F_C3J4'), e('2F_C3J4', '2F_C3J5'), e('2F_C3J5', '2F_C3J6'),

  e('2F_ORTHO_WARD', '2F_C3J1'), e('2F_PLASTER', '2F_C3J2'),
  e('2F_PHYSIO', '2F_C3J2'), e('2F_NURSE_ORTHO', '2F_C3J3'),
  e('2F_NURSE_GASTRO', '2F_C3J4'), e('2F_GI_ENDOSCOPY', '2F_C3J4'),
  e('2F_GASTRO_OPD', '2F_C3J5'),

  // Lower Corridor 2F horizontal (y=680)
  e('2F_LJ1', '2F_LJ2'), e('2F_LJ2', '2F_LJ3'), e('2F_LJ3', '2F_LJ4'),
  e('2F_LJ4', '2F_LJ5'), e('2F_LJ5', '2F_LJ6'), e('2F_LJ6', '2F_LJ7'),

  e('2F_UROLOGY', '2F_LJ1'), e('2F_URO_OPD', '2F_LJ2'),
  e('2F_ENDOSCOPY', '2F_LJ3'),
  e('2F_SEMI_S1', '2F_LJ4'), e('2F_SEMI_S2', '2F_LJ5'),
  e('2F_SEMI_S3', '2F_LJ6'), e('2F_NURSE_SEMI', '2F_LJ6'),

  e('2F_WAITING', '2F_LJ1'), e('2F_WASHROOM', '2F_LJ2'),
  e('2F_STAIRS', '2F_LJ3'), e('2F_LIFT', '2F_LJ4'),
  e('2F_MED_STORE', '2F_LJ5'), e('2F_STAIRS_FIRE', '2F_LJ6'),

  // RIGHT vertical connectors (x=1160): C1 ↔ C2 ↔ C3 ↔ Lower
  e('2F_VR1', '2F_VR2'), e('2F_VR2', '2F_VR3'), e('2F_VR3', '2F_VR4'),
  e('2F_C1J6', '2F_VR1'), e('2F_C2J6', '2F_VR2'),
  e('2F_C3J6', '2F_VR3'), e('2F_LJ7', '2F_VR4'),

  // LEFT vertical connectors (x=280): C1 ↔ C2 ↔ C3 ↔ Lower
  e('2F_VL1', '2F_VL2'), e('2F_VL2', '2F_VL3'), e('2F_VL3', '2F_VL4'),
  e('2F_C1J1', '2F_VL1'), e('2F_C2J1', '2F_VL2'),
  e('2F_C3J1', '2F_VL3'), e('2F_LJ1', '2F_VL4'),

  // CENTER vertical connectors (x=690): C1 ↔ C2 ↔ C3 ↔ Lower
  e('2F_VC1', '2F_VC2'), e('2F_VC2', '2F_VC3'), e('2F_VC3', '2F_VC4'),
  e('2F_C1J3', '2F_VC1'), e('2F_C2J3', '2F_VC2'),
  e('2F_C3J3', '2F_VC3'), e('2F_LJ3', '2F_VC4'),

  // ── CROSS-FLOOR ─────────────────────────────────────────────
  { from: 'G_LIFT',  to: '1F_LIFT',  weight: 50, isCrossFloor: true, transport: 'lift' },
  { from: '1F_LIFT', to: '2F_LIFT',  weight: 50, isCrossFloor: true, transport: 'lift' },
  { from: 'G_STAIRS',  to: '1F_STAIRS',  weight: 80, isCrossFloor: true, transport: 'stairs' },
  { from: '1F_STAIRS', to: '2F_STAIRS',  weight: 80, isCrossFloor: true, transport: 'stairs' },
  { from: 'G_STAIRS_FIRE',  to: '1F_STAIRS_FIRE',  weight: 80, isCrossFloor: true, transport: 'stairs' },
  { from: '1F_STAIRS_FIRE', to: '2F_STAIRS_FIRE',  weight: 80, isCrossFloor: true, transport: 'stairs' },
].filter(Boolean)

export const EDGES = RAW_EDGES

// ═══════════════════════════════════════════════════════════════
// ROOM REGISTRY
// ═══════════════════════════════════════════════════════════════

export const ROOMS = NODES
  .filter(n => n.type === 'department' || n.type === 'entrance')
  .map(n => ({
    id: n.id,
    label: n.label,
    floor: n.floor,
    isCritical: n.isCritical || false,
    isSterile: n.isSterile || false,
  }))
  // Remove duplicates (some rooms share junction positions)
  .filter((r, i, arr) => arr.findIndex(x => x.id === r.id) === i)
  .sort((a, b) => a.floor - b.floor || a.label.localeCompare(b.label))

export const FLOOR_LABELS = {
  0: 'Ground Floor',
  1: 'First Floor',
  2: 'Second Floor',
}

export const FLOOR_PLAN_IMAGES = {
  0: '/plans/ground_floor.png',
  1: '/plans/first_floor.png',
  2: '/plans/second_floor.png',
}
