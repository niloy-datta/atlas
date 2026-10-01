CREATE TABLE credential_scan_events (
    id uuid PRIMARY KEY,
    document_id uuid NOT NULL REFERENCES credential_document_objects(id) ON DELETE CASCADE,
    engine varchar(80) NOT NULL,
    result varchar(16) NOT NULL CHECK (result IN ('CLEAN', 'INFECTED', 'ERROR')),
    detail varchar(1000),
    scanned_bytes bigint NOT NULL CHECK (scanned_bytes >= 0),
    quarantined_object_key varchar(300),
    created_at timestamptz NOT NULL
);

CREATE INDEX idx_credential_scan_events_document
    ON credential_scan_events(document_id, created_at DESC);

UPDATE atlas_schema_metadata SET schema_version = 22 WHERE id = 1;
