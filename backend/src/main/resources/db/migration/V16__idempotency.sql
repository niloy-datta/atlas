CREATE TABLE idempotency_records (
    id uuid PRIMARY KEY,
    actor_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    operation varchar(160) NOT NULL,
    idempotency_key varchar(160) NOT NULL,
    request_hash char(64) NOT NULL,
    state varchar(16) NOT NULL CHECK (state IN ('IN_PROGRESS', 'COMPLETED')),
    response_body jsonb,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    expires_at timestamptz NOT NULL,
    CONSTRAINT uq_idempotency_actor_operation_key
        UNIQUE (actor_user_id, operation, idempotency_key),
    CONSTRAINT chk_idempotency_completed_response CHECK (
        (state = 'IN_PROGRESS' AND response_body IS NULL)
        OR (state = 'COMPLETED' AND response_body IS NOT NULL)
    )
);

CREATE INDEX idx_idempotency_expiry
    ON idempotency_records(expires_at);

UPDATE atlas_schema_metadata SET schema_version = 16 WHERE id = 1;
