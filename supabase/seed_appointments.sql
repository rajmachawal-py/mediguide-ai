-- ============================================================
-- MediGuide AI — Appointments Seed Data
-- Run AFTER seed_hospitals.sql
-- NOTE: patient_id references auth.users — these rows use a
-- placeholder UUID. Replace with a real user UUID from your
-- Supabase Auth → Users table during manual testing.
-- ============================================================

-- Placeholder patient IDs for testing
-- Create test users in Supabase Auth UI or via OTP login first,
-- then replace these UUIDs with real ones from auth.users table.

-- patient_1: pat00000-0000-0000-0000-000000000001  (Pune user)
-- patient_2: pat00000-0000-0000-0000-000000000002  (Mumbai user)

-- ─────────────────────────────────────────────────────────────
-- To use this seed file:
-- 1. Run schema.sql
-- 2. Run seed_hospitals.sql
-- 3. In Supabase Auth → Users, create 2 phone OTP test users
-- 4. Copy their UUID and replace the patient_id values below
-- 5. Run this file
-- ─────────────────────────────────────────────────────────────

-- DO NOT run this file directly without replacing patient UUIDs.
-- The insert will fail due to FK constraint: patient_id → profiles(id)
-- Use this as a template — the backend creates real appointments
-- when users book through the app.

-- ============================================================
-- SAMPLE APPOINTMENTS
-- Covers: pending, confirmed, completed, cancelled statuses
-- Spanning hospitals in Pune and Mumbai
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- INSTRUCTIONS:
-- Replace 'YOUR-PATIENT-UUID-HERE' with a real UUID from auth.
-- Example: '6f4e2a1b-7c9d-4e3f-a8b5-1c2d3e4f5a6b'
-- ─────────────────────────────────────────────────────────────

-- INSERT INTO appointments
--     (id, patient_id, hospital_id, department_id, scheduled_at, status, notes)
-- VALUES

-- Appointment 1 — Pune, Sassoon, Cardiology, pending
-- (
--     uuid_generate_v4(),
--     'YOUR-PATIENT-UUID-HERE',
--     '00000000-0000-0000-0000-000000000001',   -- Sassoon General Hospital
--     '10000000-0001-0001-0001-000000000002',   -- Cardiology OPD
--     NOW() + INTERVAL '2 days',
--     'pending',
--     'Patient reports chest tightness and shortness of breath for 3 days. Bring past ECG reports.'
-- ),

-- Appointment 2 — Pune, Ruby Hall, Orthopedics, confirmed
-- (
--     uuid_generate_v4(),
--     'YOUR-PATIENT-UUID-HERE',
--     '00000000-0000-0000-0000-000000000003',   -- Ruby Hall Clinic
--     '10000000-0003-0003-0003-000000000005',   -- Orthopedics & Joint Replacement
--     NOW() + INTERVAL '5 days',
--     'confirmed',
--     'Follow-up for knee pain. Bring X-ray films. Fast for 4 hours before appointment.'
-- ),

-- Appointment 3 — Mumbai, KEM, Emergency (same day), completed
-- (
--     uuid_generate_v4(),
--     'YOUR-PATIENT-UUID-HERE',
--     '00000000-0000-0000-0000-000000000006',   -- KEM Hospital Mumbai
--     '10000000-0006-0006-0006-000000000001',   -- Emergency & Trauma
--     NOW() - INTERVAL '1 day',
--     'completed',
--     'Acute abdominal pain. Patient visited emergency, treated and discharged.'
-- ),

-- Appointment 4 — Mumbai, Lilavati, Oncology, cancelled
-- (
--     uuid_generate_v4(),
--     'YOUR-PATIENT-UUID-HERE',
--     '00000000-0000-0000-0000-000000000008',   -- Lilavati Hospital
--     '10000000-0008-0008-0008-000000000003',   -- Oncology
--     NOW() + INTERVAL '10 days',
--     'cancelled',
--     'Patient rescheduled.'
-- ),

-- Appointment 5 — Pune, Jehangir, Pediatrics, pending
-- (
--     uuid_generate_v4(),
--     'YOUR-PATIENT-UUID-HERE',
--     '00000000-0000-0000-0000-000000000004',   -- Jehangir Hospital
--     '10000000-0004-0004-0004-000000000003',   -- Pediatrics
--     NOW() + INTERVAL '3 days',
--     'pending',
--     'Child aged 4, recurring high fever. Bring vaccination card and previous reports.'
-- );


-- ============================================================
-- HOSPITAL & DEPARTMENT UUID REFERENCE CARD (v2 — Corrected)
-- ============================================================

-- HOSPITALS
-- 00000000-0000-0000-0000-000000000001  → Sassoon General Hospital, Pune
-- 00000000-0000-0000-0000-000000000002  → KEM Hospital, Pune
-- 00000000-0000-0000-0000-000000000003  → Ruby Hall Clinic, Pune
-- 00000000-0000-0000-0000-000000000004  → Jehangir Hospital, Pune
-- 00000000-0000-0000-0000-000000000005  → Aundh District Hospital, Pune
-- 00000000-0000-0000-0000-000000000006  → KEM Hospital, Mumbai
-- 00000000-0000-0000-0000-000000000007  → Nair Hospital, Mumbai
-- 00000000-0000-0000-0000-000000000008  → Lilavati Hospital, Mumbai
-- 00000000-0000-0000-0000-000000000009  → Bombay Hospital, Mumbai
-- 00000000-0000-0000-0000-000000000010  → Wockhardt Hospital, Mumbai Central

-- DEPARTMENTS — Sassoon General (0001) — 12 departments
-- 10000000-0001-0001-0001-000000000001  → Emergency & Trauma
-- 10000000-0001-0001-0001-000000000002  → Cardiology OPD
-- 10000000-0001-0001-0001-000000000003  → General Medicine
-- 10000000-0001-0001-0001-000000000004  → Pediatrics
-- 10000000-0001-0001-0001-000000000005  → Gynecology & Obstetrics
-- 10000000-0001-0001-0001-000000000006  → Orthopedics
-- 10000000-0001-0001-0001-000000000007  → Psychiatry
-- 10000000-0001-0001-0001-000000000008  → Neurology           [NEW]
-- 10000000-0001-0001-0001-000000000009  → Nephrology           [NEW]
-- 10000000-0001-0001-0001-000000000010  → ENT                  [NEW]
-- 10000000-0001-0001-0001-000000000011  → Ophthalmology        [NEW]
-- 10000000-0001-0001-0001-000000000012  → General Surgery      [NEW]

-- DEPARTMENTS — KEM Pune (0002) — 7 departments
-- 10000000-0002-0002-0002-000000000001  → Emergency
-- 10000000-0002-0002-0002-000000000002  → Cardiology
-- 10000000-0002-0002-0002-000000000003  → General Medicine
-- 10000000-0002-0002-0002-000000000004  → Gynecology
-- 10000000-0002-0002-0002-000000000005  → Orthopedics
-- 10000000-0002-0002-0002-000000000006  → Nephrology & Dialysis [NEW — flagship]
-- 10000000-0002-0002-0002-000000000007  → Neonatology           [NEW]

-- DEPARTMENTS — Ruby Hall (0003) — 7 departments
-- 10000000-0003-0003-0003-000000000001  → Emergency
-- 10000000-0003-0003-0003-000000000002  → Cardiology & Cardiac Surgery
-- 10000000-0003-0003-0003-000000000003  → Neurology
-- 10000000-0003-0003-0003-000000000004  → Oncology
-- 10000000-0003-0003-0003-000000000005  → Orthopedics & Joint Replacement
-- 10000000-0003-0003-0003-000000000006  → Nephrology & Dialysis
-- 10000000-0003-0003-0003-000000000007  → Neurosurgery          [NEW]

-- DEPARTMENTS — Jehangir (0004) — 6 departments
-- 10000000-0004-0004-0004-000000000001  → Cardiology
-- 10000000-0004-0004-0004-000000000002  → Orthopedics & Spine Surgery
-- 10000000-0004-0004-0004-000000000003  → [REMOVED — was Pediatrics, not a primary dept]
-- 10000000-0004-0004-0004-000000000004  → ENT
-- 10000000-0004-0004-0004-000000000005  → Neurology             [NEW]
-- 10000000-0004-0004-0004-000000000006  → Gastroenterology & Hepatology [NEW]
-- 10000000-0004-0004-0004-000000000007  → Oncology              [NEW]

-- DEPARTMENTS — Aundh District (0005) — 3 departments (correct for district-level)
-- 10000000-0005-0005-0005-000000000001  → Emergency
-- 10000000-0005-0005-0005-000000000002  → General Medicine
-- 10000000-0005-0005-0005-000000000003  → Gynecology

-- DEPARTMENTS — KEM Mumbai (0006) — 6 departments
-- 10000000-0006-0006-0006-000000000001  → Emergency & Trauma
-- 10000000-0006-0006-0006-000000000002  → Cardiology
-- 10000000-0006-0006-0006-000000000003  → Neurology
-- 10000000-0006-0006-0006-000000000004  → Psychiatry
-- 10000000-0006-0006-0006-000000000005  → Pediatrics
-- 10000000-0006-0006-0006-000000000006  → Gastroenterology      [NEW — oldest in India]

-- DEPARTMENTS — Nair Hospital (0007) — 4 departments
-- 10000000-0007-0007-0007-000000000001  → Emergency
-- 10000000-0007-0007-0007-000000000002  → [REMOVED — was Gynecology, not a primary dept]
-- 10000000-0007-0007-0007-000000000003  → Orthopedics
-- 10000000-0007-0007-0007-000000000004  → Neurology             [NEW]
-- 10000000-0007-0007-0007-000000000005  → Gastroenterology      [NEW — oldest in Mumbai]

-- DEPARTMENTS — Lilavati (0008) — 5 departments
-- 10000000-0008-0008-0008-000000000001  → Cardiology & Interventional
-- 10000000-0008-0008-0008-000000000002  → Neurology & Neurosurgery
-- 10000000-0008-0008-0008-000000000003  → Oncology
-- 10000000-0008-0008-0008-000000000004  → Nephrology
-- 10000000-0008-0008-0008-000000000005  → Gastroenterology      [NEW]

-- DEPARTMENTS — Bombay Hospital (0009) — 5 departments
-- 10000000-0009-0009-0009-000000000001  → Cardiology (R.D. Birla Cardiac Centre)
-- 10000000-0009-0009-0009-000000000002  → Neurology
-- 10000000-0009-0009-0009-000000000003  → Gastroenterology
-- 10000000-0009-0009-0009-000000000004  → Neurosurgery          [NEW — flagship]
-- 10000000-0009-0009-0009-000000000005  → Nephrology            [NEW — flagship]

-- DEPARTMENTS — Wockhardt (0010) — 4 departments (verified correct)
-- 10000000-0010-0010-0010-000000000001  → Emergency
-- 10000000-0010-0010-0010-000000000002  → Cardiology
-- 10000000-0010-0010-0010-000000000003  → Neurology
-- 10000000-0010-0010-0010-000000000004  → Orthopedics
