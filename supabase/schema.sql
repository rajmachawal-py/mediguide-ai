-- ============================================================
-- MediGuide AI — Supabase Schema
-- Run this file first in Supabase SQL Editor (once)
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for fuzzy text search on hospitals/schemes


-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE language_code AS ENUM ('hi', 'mr', 'en');

CREATE TYPE urgency_level AS ENUM ('mild', 'moderate', 'emergency');

CREATE TYPE gender_type AS ENUM ('male', 'female', 'other', 'prefer_not_to_say');

CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');

CREATE TYPE caregiver_status AS ENUM ('pending', 'active', 'revoked');

CREATE TYPE hospital_type AS ENUM ('government', 'private', 'trust', 'clinic');


-- ============================================================
-- TABLE: profiles
-- Extends Supabase auth.users — one row per registered user
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
    id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    phone           TEXT UNIQUE,                    -- phone (optional, for OTP login)
    email           TEXT,                            -- email (for email/password + Google login)
    full_name       TEXT,
    age             SMALLINT CHECK (age BETWEEN 0 AND 120),
    gender          gender_type DEFAULT 'prefer_not_to_say',
    state           TEXT,                           -- Indian state (e.g. 'Maharashtra')
    district        TEXT,
    preferred_lang  language_code NOT NULL DEFAULT 'hi',
    annual_income   INTEGER,                        -- in INR, used for scheme eligibility
    fcm_token       TEXT,                           -- Firebase Cloud Messaging device token
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================
-- TABLE: hospitals
-- Master list of hospitals — seeded via seed_hospitals.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS hospitals (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            TEXT NOT NULL,
    name_hi         TEXT,                           -- Hindi name
    name_mr         TEXT,                           -- Marathi name
    hospital_type   hospital_type NOT NULL DEFAULT 'government',
    address         TEXT NOT NULL,
    city            TEXT NOT NULL,
    state           TEXT NOT NULL,
    pincode         TEXT,
    phone           TEXT,
    lat             DOUBLE PRECISION NOT NULL,      -- latitude
    lng             DOUBLE PRECISION NOT NULL,      -- longitude
    google_maps_url TEXT,
    is_24x7         BOOLEAN NOT NULL DEFAULT FALSE,
    has_emergency   BOOLEAN NOT NULL DEFAULT FALSE,
    has_ambulance   BOOLEAN NOT NULL DEFAULT FALSE,
    rating          NUMERIC(2,1) CHECK (rating BETWEEN 0 AND 5),
    total_beds      INTEGER,
    indoor_map_url  TEXT,                           -- SVG/image URL for indoor navigation
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for geolocation proximity queries (lat/lng bounding box)
CREATE INDEX IF NOT EXISTS idx_hospitals_location ON hospitals (lat, lng);

-- Full-text search on hospital name
CREATE INDEX IF NOT EXISTS idx_hospitals_name_trgm ON hospitals USING gin (name gin_trgm_ops);


-- ============================================================
-- TABLE: departments
-- Departments within a hospital (cardiology, ortho, etc.)
-- ============================================================

CREATE TABLE IF NOT EXISTS departments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id     UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,                  -- e.g. "Cardiology"
    name_hi         TEXT,
    name_mr         TEXT,
    floor_number    SMALLINT,                        -- for indoor navigation
    room_number     TEXT,
    doctor_names    TEXT[],                         -- array of doctor names in this dept
    avg_wait_mins   SMALLINT,                       -- average patient wait time
    is_available    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_departments_hospital ON departments (hospital_id);


-- ============================================================
-- TABLE: hospital_specialties
-- Many-to-many: hospitals ↔ medical specialties (for triage routing)
-- ============================================================

CREATE TABLE IF NOT EXISTS hospital_specialties (
    hospital_id     UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    specialty       TEXT NOT NULL,                  -- e.g. 'cardiology', 'pediatrics', 'trauma'
    PRIMARY KEY (hospital_id, specialty)
);

CREATE INDEX IF NOT EXISTS idx_specialties_hospital ON hospital_specialties (hospital_id);
CREATE INDEX IF NOT EXISTS idx_specialties_specialty ON hospital_specialties (specialty);


-- ============================================================
-- TABLE: appointments
-- Patient appointment slots
-- ============================================================

CREATE TABLE IF NOT EXISTS appointments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    hospital_id     UUID NOT NULL REFERENCES hospitals(id),
    department_id   UUID NOT NULL REFERENCES departments(id),
    scheduled_at    TIMESTAMPTZ NOT NULL,
    status          appointment_status NOT NULL DEFAULT 'pending',
    notes           TEXT,                           -- pre-visit notes from checklist
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments (patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_hospital ON appointments (hospital_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled ON appointments (scheduled_at);


-- ============================================================
-- TABLE: schemes
-- Government healthcare scheme master data
-- ============================================================

CREATE TABLE IF NOT EXISTS schemes (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                TEXT NOT NULL,
    name_hi             TEXT,
    name_mr             TEXT,
    description         TEXT,
    description_hi      TEXT,
    description_mr      TEXT,
    eligibility_states  TEXT[],                     -- NULL = all India
    max_annual_income   INTEGER,                    -- INR cap; NULL = no income limit
    applicable_genders  gender_type[],              -- NULL = all genders
    min_age             SMALLINT DEFAULT 0,
    max_age             SMALLINT DEFAULT 120,
    applicable_conditions TEXT[],                  -- e.g. ['diabetes','cancer','pregnancy']
    benefit_amount      INTEGER,                    -- INR (annual coverage)
    scheme_url          TEXT,                       -- official government link
    helpline            TEXT,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schemes_states ON schemes USING gin (eligibility_states);
CREATE INDEX IF NOT EXISTS idx_schemes_conditions ON schemes USING gin (applicable_conditions);


-- ============================================================
-- TABLE: chat_sessions
-- Each conversation the user has with MediGuide AI
-- ============================================================

CREATE TABLE IF NOT EXISTS chat_sessions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    language        language_code NOT NULL DEFAULT 'hi',
    urgency         urgency_level,                  -- set after triage classification
    summary         TEXT,                           -- doctor-ready symptom summary (AI-generated)
    recommended_specialty TEXT,                     -- e.g. 'cardiology'
    recommended_hospital_id UUID REFERENCES hospitals(id),
    caregiver_notified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sessions_patient ON chat_sessions (patient_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created ON chat_sessions (created_at DESC);


-- ============================================================
-- TABLE: chat_messages
-- Individual turns within a chat session
-- ============================================================

CREATE TABLE IF NOT EXISTS chat_messages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id      UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role            TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content         TEXT NOT NULL,
    audio_url       TEXT,                           -- if message was voice input, store audio ref
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_session ON chat_messages (session_id, created_at ASC);


-- ============================================================
-- TABLE: caregiver_links
-- Links between a patient and their caregiver (family member)
-- ============================================================

CREATE TABLE IF NOT EXISTS caregiver_links (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    caregiver_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
    caregiver_phone TEXT NOT NULL,                  -- caregiver may not be a registered user yet
    caregiver_name  TEXT,
    relationship    TEXT,                           -- e.g. 'spouse', 'son', 'daughter'
    status          caregiver_status NOT NULL DEFAULT 'pending',
    linked_at       TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_caregiver_patient ON caregiver_links (patient_id);
CREATE INDEX IF NOT EXISTS idx_caregiver_id     ON caregiver_links (caregiver_id);


-- ============================================================
-- TABLE: caregiver_alerts
-- Push notification log sent to caregivers
-- ============================================================

CREATE TABLE IF NOT EXISTS caregiver_alerts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    link_id         UUID NOT NULL REFERENCES caregiver_links(id) ON DELETE CASCADE,
    session_id      UUID REFERENCES chat_sessions(id),
    urgency         urgency_level NOT NULL,
    message         TEXT NOT NULL,
    sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    delivered       BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_alerts_link    ON caregiver_alerts (link_id);
CREATE INDEX IF NOT EXISTS idx_alerts_session ON caregiver_alerts (session_id);


-- ============================================================
-- TABLE: indoor_map_nodes
-- Graph nodes for indoor navigation within a hospital floor
-- ============================================================

CREATE TABLE IF NOT EXISTS indoor_map_nodes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id     UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    department_id   UUID REFERENCES departments(id) ON DELETE SET NULL,
    label           TEXT NOT NULL,                  -- e.g. 'Entrance', 'Cardiology OPD', 'Lift'
    node_type       TEXT NOT NULL DEFAULT 'waypoint', -- 'entrance' | 'department' | 'waypoint' | 'lift' | 'stairs'
    floor_number    SMALLINT NOT NULL DEFAULT 0,
    x_pos           NUMERIC(6,2),                   -- pixel or percentage X on floor map SVG
    y_pos           NUMERIC(6,2)                    -- pixel or percentage Y on floor map SVG
);

CREATE INDEX IF NOT EXISTS idx_nodes_hospital ON indoor_map_nodes (hospital_id);


-- ============================================================
-- TABLE: indoor_map_edges
-- Directed edges between indoor_map_nodes (graph adjacency)
-- ============================================================

CREATE TABLE IF NOT EXISTS indoor_map_edges (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id     UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    from_node_id    UUID NOT NULL REFERENCES indoor_map_nodes(id) ON DELETE CASCADE,
    to_node_id      UUID NOT NULL REFERENCES indoor_map_nodes(id) ON DELETE CASCADE,
    distance_meters NUMERIC(5,1),                   -- walking distance in metres
    is_accessible   BOOLEAN NOT NULL DEFAULT TRUE   -- wheelchair accessible
);

CREATE INDEX IF NOT EXISTS idx_edges_hospital  ON indoor_map_edges (hospital_id);
CREATE INDEX IF NOT EXISTS idx_edges_from_node ON indoor_map_edges (from_node_id);


-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all user-data tables
ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE caregiver_links    ENABLE ROW LEVEL SECURITY;
ALTER TABLE caregiver_alerts   ENABLE ROW LEVEL SECURITY;

-- Public read on reference tables (no auth needed for hospital/scheme data)
ALTER TABLE hospitals           ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE schemes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE indoor_map_nodes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE indoor_map_edges    ENABLE ROW LEVEL SECURITY;


-- ── profiles ────────────────────────────────────────────────
-- Users can read and update only their own profile
CREATE POLICY "profiles: owner read"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "profiles: owner update"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "profiles: insert on signup"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);


-- ── appointments ─────────────────────────────────────────────
CREATE POLICY "appointments: patient access"
    ON appointments FOR ALL
    USING (auth.uid() = patient_id);


-- ── chat_sessions ─────────────────────────────────────────────
CREATE POLICY "chat_sessions: patient access"
    ON chat_sessions FOR ALL
    USING (auth.uid() = patient_id);


-- ── chat_messages ─────────────────────────────────────────────
-- Access messages only if user owns the parent session
CREATE POLICY "chat_messages: session owner access"
    ON chat_messages FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM chat_sessions s
            WHERE s.id = chat_messages.session_id
              AND s.patient_id = auth.uid()
        )
    );


-- ── caregiver_links ───────────────────────────────────────────
-- Patient can manage their own links; caregiver can view links where they appear
CREATE POLICY "caregiver_links: patient manage"
    ON caregiver_links FOR ALL
    USING (auth.uid() = patient_id);

CREATE POLICY "caregiver_links: caregiver view"
    ON caregiver_links FOR SELECT
    USING (auth.uid() = caregiver_id);


-- ── caregiver_alerts ──────────────────────────────────────────
CREATE POLICY "caregiver_alerts: caregiver view"
    ON caregiver_alerts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM caregiver_links cl
            WHERE cl.id = caregiver_alerts.link_id
              AND (cl.patient_id = auth.uid() OR cl.caregiver_id = auth.uid())
        )
    );


-- ── reference tables: public read-only ───────────────────────
CREATE POLICY "hospitals: public read"
    ON hospitals FOR SELECT USING (TRUE);

CREATE POLICY "departments: public read"
    ON departments FOR SELECT USING (TRUE);

CREATE POLICY "hospital_specialties: public read"
    ON hospital_specialties FOR SELECT USING (TRUE);

CREATE POLICY "schemes: public read"
    ON schemes FOR SELECT USING (TRUE);

CREATE POLICY "indoor_map_nodes: public read"
    ON indoor_map_nodes FOR SELECT USING (TRUE);

CREATE POLICY "indoor_map_edges: public read"
    ON indoor_map_edges FOR SELECT USING (TRUE);


-- ============================================================
-- HELPER FUNCTION: calculate distance between two lat/lng points
-- Returns distance in kilometres using Haversine formula
-- Used for finding nearby hospitals without PostGIS
-- ============================================================

CREATE OR REPLACE FUNCTION haversine_km(
    lat1 DOUBLE PRECISION, lng1 DOUBLE PRECISION,
    lat2 DOUBLE PRECISION, lng2 DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION AS $$
DECLARE
    r  DOUBLE PRECISION := 6371.0; -- Earth radius in km
    d_lat DOUBLE PRECISION;
    d_lng DOUBLE PRECISION;
    a  DOUBLE PRECISION;
BEGIN
    d_lat := RADIANS(lat2 - lat1);
    d_lng := RADIANS(lng2 - lng1);
    a := SIN(d_lat / 2)^2
       + COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * SIN(d_lng / 2)^2;
    RETURN r * 2 * ASIN(SQRT(a));
END;
$$ LANGUAGE plpgsql IMMUTABLE;


-- ============================================================
-- HELPER FUNCTION: get nearby hospitals
-- Usage: SELECT * FROM get_nearby_hospitals(18.5204, 73.8567, 10, 'cardiology');
-- ============================================================

CREATE OR REPLACE FUNCTION get_nearby_hospitals(
    user_lat   DOUBLE PRECISION,
    user_lng   DOUBLE PRECISION,
    radius_km  DOUBLE PRECISION DEFAULT 10.0,
    specialty  TEXT DEFAULT NULL
)
RETURNS TABLE (
    id              UUID,
    name            TEXT,
    name_hi         TEXT,
    name_mr         TEXT,
    hospital_type   hospital_type,
    address         TEXT,
    city            TEXT,
    state           TEXT,
    phone           TEXT,
    lat             DOUBLE PRECISION,
    lng             DOUBLE PRECISION,
    google_maps_url TEXT,
    is_24x7         BOOLEAN,
    has_emergency   BOOLEAN,
    has_ambulance   BOOLEAN,
    rating          NUMERIC,
    distance_km     DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        h.id, h.name, h.name_hi, h.name_mr, h.hospital_type,
        h.address, h.city, h.state, h.phone,
        h.lat, h.lng, h.google_maps_url,
        h.is_24x7, h.has_emergency, h.has_ambulance, h.rating,
        haversine_km(user_lat, user_lng, h.lat, h.lng) AS distance_km
    FROM hospitals h
    WHERE
        haversine_km(user_lat, user_lng, h.lat, h.lng) <= radius_km
        AND (
            specialty IS NULL
            OR EXISTS (
                SELECT 1 FROM hospital_specialties hs
                WHERE hs.hospital_id = h.id
                  AND hs.specialty ILIKE specialty
            )
        )
    ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql STABLE;


-- ============================================================
-- REALTIME: enable for caregiver dashboard live updates
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE caregiver_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_sessions;


-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- Supabase trigger: fires when a new user signs up
-- Supports: Email/Password, Google OAuth, and Phone OTP
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, phone, email, full_name, preferred_lang)
    VALUES (
        NEW.id,
        NEW.phone,
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            NULL
        ),
        'hi'  -- default language Hindi; user can change in ProfilePage
    )
    ON CONFLICT (id) DO UPDATE SET
        email = COALESCE(EXCLUDED.email, profiles.email),
        full_name = COALESCE(profiles.full_name, EXCLUDED.full_name);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

