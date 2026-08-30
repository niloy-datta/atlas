CREATE TABLE skill_categories (
    id uuid PRIMARY KEY,
    name varchar(120) NOT NULL,
    slug varchar(80) NOT NULL UNIQUE,
    description varchar(1000),
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    CONSTRAINT skill_categories_slug_format CHECK (slug ~ '^[a-z0-9][a-z0-9-]{1,78}[a-z0-9]$')
);
CREATE UNIQUE INDEX uq_skill_categories_name_ci ON skill_categories(lower(name));

CREATE TABLE skills (
    id uuid PRIMARY KEY,
    category_id uuid NOT NULL REFERENCES skill_categories(id),
    name varchar(120) NOT NULL,
    slug varchar(80) NOT NULL UNIQUE,
    description varchar(1000),
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    CONSTRAINT skills_slug_format CHECK (slug ~ '^[a-z0-9][a-z0-9-]{1,78}[a-z0-9]$')
);
CREATE UNIQUE INDEX uq_skills_category_name_ci ON skills(category_id, lower(name));
CREATE INDEX idx_skills_active_name ON skills(active, name, id);

CREATE TABLE worker_skills (
    id uuid PRIMARY KEY,
    worker_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_id uuid NOT NULL REFERENCES skills(id),
    proficiency varchar(16) NOT NULL
        CHECK (proficiency IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT')),
    verification_status varchar(24) NOT NULL
        CHECK (verification_status IN ('SELF_DECLARED', 'EVIDENCE_SUBMITTED', 'VERIFIED', 'REJECTED', 'REVOKED')),
    version bigint NOT NULL CHECK (version >= 0),
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    UNIQUE (worker_user_id, skill_id)
);
CREATE INDEX idx_worker_skills_worker ON worker_skills(worker_user_id, created_at, id);
CREATE INDEX idx_worker_skills_verified ON worker_skills(skill_id, worker_user_id)
    WHERE verification_status = 'VERIFIED';

CREATE TABLE skill_verification_evidence (
    id uuid PRIMARY KEY,
    worker_skill_id uuid NOT NULL REFERENCES worker_skills(id) ON DELETE CASCADE,
    evidence_type varchar(32) NOT NULL
        CHECK (evidence_type IN ('DOCUMENT', 'ASSESSMENT', 'EMPLOYER_ATTESTATION', 'PORTFOLIO', 'OTHER')),
    evidence_reference varchar(500) NOT NULL,
    status varchar(16) NOT NULL CHECK (status IN ('SUBMITTED', 'ACCEPTED', 'REJECTED')),
    submitted_by_user_id uuid NOT NULL REFERENCES users(id),
    reviewed_by_user_id uuid REFERENCES users(id),
    review_reason varchar(1000),
    created_at timestamptz NOT NULL,
    reviewed_at timestamptz
);
CREATE INDEX idx_skill_evidence_worker_skill ON skill_verification_evidence(worker_skill_id, created_at DESC);

CREATE TABLE worker_skill_verification_history (
    id uuid PRIMARY KEY,
    worker_skill_id uuid NOT NULL REFERENCES worker_skills(id) ON DELETE CASCADE,
    from_status varchar(24),
    to_status varchar(24) NOT NULL,
    actor_user_id uuid NOT NULL REFERENCES users(id),
    evidence_id uuid REFERENCES skill_verification_evidence(id),
    reason varchar(1000) NOT NULL,
    created_at timestamptz NOT NULL
);
CREATE INDEX idx_worker_skill_history ON worker_skill_verification_history(worker_skill_id, created_at DESC);

CREATE TABLE skill_endorsements (
    id uuid PRIMARY KEY,
    worker_skill_id uuid NOT NULL REFERENCES worker_skills(id) ON DELETE CASCADE,
    endorser_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    relationship varchar(32) NOT NULL
        CHECK (relationship IN ('COWORKER', 'SUPERVISOR', 'EMPLOYER', 'CLIENT', 'OTHER')),
    comment varchar(500),
    created_at timestamptz NOT NULL,
    UNIQUE (worker_skill_id, endorser_user_id)
);

UPDATE atlas_schema_metadata SET schema_version = 5 WHERE id = 1;
