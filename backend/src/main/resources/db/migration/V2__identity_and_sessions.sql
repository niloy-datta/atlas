CREATE TABLE users (
    id uuid PRIMARY KEY,
    email_normalized varchar(320) NOT NULL UNIQUE,
    email_display varchar(320) NOT NULL,
    password_hash varchar(255) NOT NULL,
    enabled boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL
);

CREATE TABLE user_roles (
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role varchar(32) NOT NULL CHECK (role IN ('WORKER', 'EMPLOYER_MEMBER', 'EMPLOYER_ADMIN', 'PLATFORM_ADMIN')),
    PRIMARY KEY (user_id, role)
);

CREATE TABLE user_sessions (
    id uuid PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL,
    last_seen_at timestamptz NOT NULL,
    expires_at timestamptz NOT NULL,
    revoked_at timestamptz,
    ip_address varchar(64),
    user_agent varchar(512)
);
CREATE INDEX idx_user_sessions_user_active ON user_sessions(user_id, expires_at) WHERE revoked_at IS NULL;

CREATE TABLE refresh_tokens (
    id uuid PRIMARY KEY,
    session_id uuid NOT NULL REFERENCES user_sessions(id) ON DELETE CASCADE,
    family_id uuid NOT NULL,
    token_hash varchar(64) NOT NULL UNIQUE,
    status varchar(16) NOT NULL CHECK (status IN ('ACTIVE', 'ROTATED', 'REVOKED', 'REUSED')),
    created_at timestamptz NOT NULL,
    expires_at timestamptz NOT NULL,
    used_at timestamptz,
    replaced_by_id uuid REFERENCES refresh_tokens(id)
);
CREATE INDEX idx_refresh_tokens_family ON refresh_tokens(family_id);
CREATE UNIQUE INDEX uq_refresh_tokens_one_active_per_session ON refresh_tokens(session_id) WHERE status = 'ACTIVE';

CREATE TABLE password_reset_tokens (
    id uuid PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash varchar(64) NOT NULL UNIQUE,
    created_at timestamptz NOT NULL,
    expires_at timestamptz NOT NULL,
    used_at timestamptz
);
CREATE INDEX idx_password_reset_user ON password_reset_tokens(user_id, expires_at);

CREATE TABLE audit_events (
    id uuid PRIMARY KEY,
    actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    event_type varchar(64) NOT NULL,
    outcome varchar(16) NOT NULL,
    subject_id uuid,
    ip_address varchar(64),
    user_agent varchar(512),
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL
);
CREATE INDEX idx_audit_events_actor_created ON audit_events(actor_user_id, created_at DESC);
CREATE INDEX idx_audit_events_type_created ON audit_events(event_type, created_at DESC);

UPDATE atlas_schema_metadata SET schema_version = 2 WHERE id = 1;
