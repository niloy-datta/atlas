CREATE TABLE shifts (
    id uuid PRIMARY KEY,
    job_id uuid REFERENCES jobs(id) ON DELETE SET NULL,
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title varchar(160) NOT NULL,
    description varchar(4000),
    start_time timestamptz NOT NULL,
    end_time timestamptz NOT NULL,
    timezone varchar(64) NOT NULL DEFAULT 'UTC',
    capacity int NOT NULL CHECK (capacity > 0),
    hourly_rate_pence bigint NOT NULL CHECK (hourly_rate_pence > 0),
    currency varchar(3) NOT NULL DEFAULT 'GBP' CHECK (currency ~ '^[A-Z]{3}$'),
    status varchar(32) NOT NULL CHECK (status IN ('DRAFT', 'PUBLISHED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    location_name varchar(160),
    formatted_address varchar(255),
    location geography(Point, 4326),
    version bigint NOT NULL CHECK (version >= 0),
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    CONSTRAINT chk_shifts_time_interval CHECK (end_time > start_time)
);

CREATE INDEX idx_shifts_organization ON shifts(organization_id, status);
CREATE INDEX idx_shifts_job ON shifts(job_id);
CREATE INDEX idx_shifts_status_interval ON shifts(status, start_time, end_time);
CREATE INDEX idx_shifts_location ON shifts USING gist(location);

CREATE TABLE shift_required_skills (
    id uuid PRIMARY KEY,
    shift_id uuid NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
    skill_id uuid NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    minimum_proficiency varchar(32) NOT NULL CHECK (minimum_proficiency IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT')),
    required boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL,
    UNIQUE (shift_id, skill_id)
);

CREATE INDEX idx_shift_required_skills_shift ON shift_required_skills(shift_id);

CREATE TABLE shift_required_credentials (
    id uuid PRIMARY KEY,
    shift_id uuid NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
    credential_type varchar(24) NOT NULL CHECK (credential_type IN ('CERTIFICATE', 'LICENSE', 'PERMIT', 'OTHER')),
    title varchar(160) NOT NULL,
    issuer varchar(160),
    required boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL,
    UNIQUE (shift_id, title)
);

CREATE INDEX idx_shift_required_creds_shift ON shift_required_credentials(shift_id);

