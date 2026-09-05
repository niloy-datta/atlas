CREATE TABLE jobs (
    id uuid PRIMARY KEY,
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title varchar(160) NOT NULL,
    description varchar(4000) NOT NULL,
    job_type varchar(32) NOT NULL CHECK (job_type IN ('SHIFT', 'SERVICE', 'CONTRACT')),
    status varchar(32) NOT NULL CHECK (status IN ('DRAFT', 'PUBLISHED', 'PAUSED', 'CLOSED', 'CANCELLED', 'COMPLETED')),
    location_name varchar(160),
    formatted_address varchar(255),
    location geography(Point, 4326),
    budget_min_pence bigint CHECK (budget_min_pence IS NULL OR budget_min_pence >= 0),
    budget_max_pence bigint CHECK (budget_max_pence IS NULL OR budget_max_pence >= 0),
    currency varchar(3) NOT NULL DEFAULT 'GBP' CHECK (currency ~ '^[A-Z]{3}$'),
    version bigint NOT NULL CHECK (version >= 0),
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    CONSTRAINT chk_jobs_budget_order CHECK (
        budget_min_pence IS NULL OR budget_max_pence IS NULL OR budget_min_pence <= budget_max_pence
    )
);

CREATE INDEX idx_jobs_organization ON jobs(organization_id, status);
CREATE INDEX idx_jobs_status_created ON jobs(status, created_at DESC);
CREATE INDEX idx_jobs_location ON jobs USING gist(location);

CREATE TABLE job_required_skills (
    id uuid PRIMARY KEY,
    job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    skill_id uuid NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    minimum_proficiency varchar(32) NOT NULL CHECK (minimum_proficiency IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT')),
    required boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL,
    UNIQUE (job_id, skill_id)
);

CREATE INDEX idx_job_required_skills_job ON job_required_skills(job_id);

CREATE TABLE job_required_credentials (
    id uuid PRIMARY KEY,
    job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    credential_type varchar(24) NOT NULL CHECK (credential_type IN ('CERTIFICATE', 'LICENSE', 'PERMIT', 'OTHER')),
    title varchar(160) NOT NULL,
    issuer varchar(160),
    required boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL,
    UNIQUE (job_id, title)
);

CREATE INDEX idx_job_required_creds_job ON job_required_credentials(job_id);

