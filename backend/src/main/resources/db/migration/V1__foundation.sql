CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE atlas_schema_metadata (
    id SMALLINT PRIMARY KEY,
    schema_version INTEGER NOT NULL CHECK (schema_version > 0),
    installed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT atlas_schema_metadata_singleton CHECK (id = 1)
);

INSERT INTO atlas_schema_metadata (id, schema_version) VALUES (1, 1);

