-- ============================================================
-- MediGuide AI — Audit Logs Schema
-- Persistent audit trail for all user interactions & data access
-- Required for: Architecture Requirement 5.3 (Secure Logging)
-- Run this in Supabase SQL Editor ONCE after schema.sql
-- ============================================================

-- ── ENUM for audit event types ──────────────────────────────
DO $$ BEGIN
    CREATE TYPE audit_event_type AS ENUM (
        'triage_start',
        'triage_complete',
        'emergency_detected',
        'chat_message',
        'voice_stt',
        'voice_tts',
        'navigation_route',
        'qr_scan',
        'fhir_export',
        'consent_granted',
        'consent_revoked',
        'data_erasure',
        'login',
        'logout',
        'profile_update',
        'caregiver_alert',
        'scheme_lookup',
        'hospital_search'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ============================================================
-- TABLE: audit_logs
-- Immutable append-only log of all significant user actions
-- Used for compliance (DPDPA), security audits, and analytics
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Who
    user_id         UUID REFERENCES profiles(id) ON DELETE SET NULL,  -- NULL for anonymous
    session_id      TEXT,                           -- browser session or chat session ID
    -- What
    event_type      audit_event_type NOT NULL,
    event_action    TEXT NOT NULL,                  -- human-readable action: "User submitted symptoms"
    -- Context
    resource_type   TEXT,                           -- e.g. 'triage', 'chat', 'navigation', 'profile'
    resource_id     TEXT,                           -- ID of the affected resource
    metadata        JSONB DEFAULT '{}',             -- flexible extra data (language, urgency, etc.)
    -- Where
    ip_address      INET,                           -- client IP for security audit
    user_agent      TEXT,                           -- browser/device info
    -- When
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes for efficient querying ──────────────────────────
CREATE INDEX IF NOT EXISTS idx_audit_user      ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_event     ON audit_logs (event_type);
CREATE INDEX IF NOT EXISTS idx_audit_created   ON audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_resource  ON audit_logs (resource_type, resource_id);

-- ── RLS: Service-role insert only, admin read ───────────────
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Service role can insert (backend middleware)
CREATE POLICY "audit_logs: service insert"
    ON audit_logs FOR INSERT
    WITH CHECK (TRUE);

-- Users can read their own audit logs (DPDPA right to access)
CREATE POLICY "audit_logs: user read own"
    ON audit_logs FOR SELECT
    USING (auth.uid() = user_id);

-- No UPDATE or DELETE — audit logs are immutable
-- (Service role bypasses RLS for admin queries)
