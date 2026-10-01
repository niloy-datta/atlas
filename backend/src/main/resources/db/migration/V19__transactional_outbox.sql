CREATE TABLE outbox_events (
    id uuid PRIMARY KEY,
    aggregate_type varchar(80) NOT NULL,
    aggregate_id uuid NOT NULL,
    event_type varchar(160) NOT NULL,
    payload jsonb NOT NULL,
    occurred_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL,
    published_at timestamptz,
    attempts int NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    last_error varchar(2000)
);

CREATE INDEX idx_outbox_events_pending
    ON outbox_events(created_at, id)
    WHERE published_at IS NULL;

CREATE INDEX idx_outbox_events_aggregate
    ON outbox_events(aggregate_type, aggregate_id, created_at);

UPDATE atlas_schema_metadata SET schema_version = 19 WHERE id = 1;
