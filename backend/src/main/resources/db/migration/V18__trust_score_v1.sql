CREATE TABLE worker_trust_score_snapshots (
    id uuid PRIMARY KEY,
    worker_user_id uuid NOT NULL REFERENCES worker_profiles(user_id) ON DELETE CASCADE,
    algorithm_version varchar(32) NOT NULL,
    score smallint NOT NULL CHECK (score BETWEEN 0 AND 100),
    completed_shifts int NOT NULL CHECK (completed_shifts >= 0),
    cancelled_reservations int NOT NULL CHECK (cancelled_reservations >= 0),
    verified_skills int NOT NULL CHECK (verified_skills >= 0),
    profile_completion smallint NOT NULL CHECK (profile_completion BETWEEN 0 AND 100),
    components jsonb NOT NULL,
    computed_at timestamptz NOT NULL
);

CREATE INDEX idx_worker_trust_score_latest
    ON worker_trust_score_snapshots(worker_user_id, computed_at DESC);

UPDATE atlas_schema_metadata SET schema_version = 18 WHERE id = 1;
