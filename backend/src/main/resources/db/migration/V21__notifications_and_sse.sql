CREATE TABLE notifications (
    id uuid PRIMARY KEY,
    sequence_no bigint GENERATED ALWAYS AS IDENTITY UNIQUE,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source_event_id uuid NOT NULL,
    event_type varchar(160) NOT NULL,
    title varchar(200) NOT NULL,
    body varchar(1000) NOT NULL,
    read_at timestamptz,
    created_at timestamptz NOT NULL,
    CONSTRAINT uq_notifications_user_source UNIQUE (user_id, source_event_id)
);

CREATE INDEX idx_notifications_user_sequence
    ON notifications(user_id, sequence_no DESC);

CREATE INDEX idx_notifications_user_unread
    ON notifications(user_id, sequence_no DESC)
    WHERE read_at IS NULL;

UPDATE atlas_schema_metadata SET schema_version = 21 WHERE id = 1;
