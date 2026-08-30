CREATE TABLE worker_profiles (
    id uuid PRIMARY KEY,
    user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    public_handle varchar(40) UNIQUE,
    full_name varchar(120),
    headline varchar(160),
    bio varchar(2000),
    experience_years smallint CHECK (experience_years BETWEEN 0 AND 80),
    visibility varchar(16) NOT NULL CHECK (visibility IN ('PRIVATE', 'PUBLIC')),
    completion_score smallint NOT NULL CHECK (completion_score BETWEEN 0 AND 100),
    completion_version integer NOT NULL CHECK (completion_version > 0),
    version bigint NOT NULL CHECK (version >= 0),
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    CONSTRAINT worker_profiles_handle_format CHECK (
        public_handle IS NULL OR public_handle ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$'
    )
);

CREATE TABLE worker_locations (
    worker_profile_id uuid PRIMARY KEY REFERENCES worker_profiles(id) ON DELETE CASCADE,
    search_point geography(Point, 4326) NOT NULL,
    city varchar(120),
    region varchar(120),
    country_code char(2) NOT NULL CHECK (country_code ~ '^[A-Z]{2}$'),
    updated_at timestamptz NOT NULL
);
CREATE INDEX idx_worker_locations_search_point ON worker_locations USING gist(search_point);

CREATE TABLE worker_preferences (
    worker_profile_id uuid PRIMARY KEY REFERENCES worker_profiles(id) ON DELETE CASCADE,
    open_to_work boolean NOT NULL,
    max_distance_km integer CHECK (max_distance_km BETWEEN 1 AND 100),
    preferred_job_types jsonb NOT NULL DEFAULT '[]'::jsonb,
    updated_at timestamptz NOT NULL,
    CONSTRAINT worker_preferences_job_types_array CHECK (jsonb_typeof(preferred_job_types) = 'array')
);

CREATE TABLE worker_privacy_settings (
    worker_profile_id uuid PRIMARY KEY REFERENCES worker_profiles(id) ON DELETE CASCADE,
    show_coarse_location boolean NOT NULL,
    show_experience boolean NOT NULL,
    updated_at timestamptz NOT NULL
);

UPDATE atlas_schema_metadata SET schema_version = 3 WHERE id = 1;
