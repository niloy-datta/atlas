ALTER TABLE outbox_events ADD COLUMN sequence_no bigint;

CREATE INDEX idx_outbox_events_aggregate_sequence
    ON outbox_events(aggregate_type, aggregate_id, sequence_no)
    WHERE sequence_no IS NOT NULL;

CREATE TABLE consumer_processed_events (
    consumer_name varchar(120) NOT NULL,
    event_id uuid NOT NULL,
    event_type varchar(160) NOT NULL,
    aggregate_id uuid NOT NULL,
    sequence_no bigint,
    result varchar(32) NOT NULL,
    processed_at timestamptz NOT NULL,
    PRIMARY KEY (consumer_name, event_id)
);

CREATE TABLE consumer_aggregate_offsets (
    consumer_name varchar(120) NOT NULL,
    aggregate_id uuid NOT NULL,
    last_sequence bigint NOT NULL,
    last_event_id uuid NOT NULL,
    updated_at timestamptz NOT NULL,
    PRIMARY KEY (consumer_name, aggregate_id)
);

CREATE TABLE consumer_dead_letters (
    id uuid PRIMARY KEY,
    consumer_name varchar(120) NOT NULL,
    event_id uuid NOT NULL,
    event_type varchar(160),
    payload text,
    error varchar(2000) NOT NULL,
    created_at timestamptz NOT NULL
);

CREATE INDEX idx_consumer_dead_letters_consumer_created
    ON consumer_dead_letters(consumer_name, created_at DESC);

UPDATE atlas_schema_metadata SET schema_version = 20 WHERE id = 1;
