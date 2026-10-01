CREATE TABLE worker_availability_rules (
    id uuid PRIMARY KEY,
    worker_user_id uuid NOT NULL REFERENCES worker_profiles(user_id) ON DELETE CASCADE,
    day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
    start_local time NOT NULL,
    end_local time NOT NULL,
    timezone varchar(64) NOT NULL,
    valid_from date,
    valid_until date,
    version bigint NOT NULL DEFAULT 0 CHECK (version >= 0),
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    CONSTRAINT chk_worker_availability_interval CHECK (end_local > start_local),
    CONSTRAINT chk_worker_availability_validity CHECK (
        valid_from IS NULL OR valid_until IS NULL OR valid_until >= valid_from
    ),
    CONSTRAINT uq_worker_availability_rule
        UNIQUE (worker_user_id, day_of_week, start_local, end_local, timezone)
);

CREATE INDEX idx_worker_availability_rules_worker_day
    ON worker_availability_rules(worker_user_id, day_of_week);

CREATE TABLE worker_availability_overrides (
    id uuid PRIMARY KEY,
    worker_user_id uuid NOT NULL REFERENCES worker_profiles(user_id) ON DELETE CASCADE,
    override_date date NOT NULL,
    override_type varchar(16) NOT NULL CHECK (override_type IN ('AVAILABLE', 'UNAVAILABLE')),
    start_local time,
    end_local time,
    timezone varchar(64) NOT NULL,
    note varchar(500),
    created_at timestamptz NOT NULL,
    CONSTRAINT chk_worker_availability_override_shape CHECK (
        (override_type = 'UNAVAILABLE' AND start_local IS NULL AND end_local IS NULL)
        OR
        (override_type = 'AVAILABLE' AND start_local IS NOT NULL AND end_local IS NOT NULL AND end_local > start_local)
    )
);

CREATE INDEX idx_worker_availability_overrides_worker_date
    ON worker_availability_overrides(worker_user_id, override_date);

CREATE UNIQUE INDEX uq_worker_unavailable_override
    ON worker_availability_overrides(worker_user_id, override_date)
    WHERE override_type = 'UNAVAILABLE';

CREATE UNIQUE INDEX uq_worker_available_override
    ON worker_availability_overrides(worker_user_id, override_date, start_local, end_local, timezone)
    WHERE override_type = 'AVAILABLE';

UPDATE atlas_schema_metadata SET schema_version = 13 WHERE id = 1;
