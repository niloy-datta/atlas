CREATE TABLE credentials (
    id uuid PRIMARY KEY,
    worker_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    credential_type varchar(24) NOT NULL
        CHECK (credential_type IN ('CERTIFICATE', 'LICENSE', 'PERMIT', 'OTHER')),
    title varchar(160) NOT NULL,
    issuer varchar(160) NOT NULL,
    credential_number varchar(160),
    issued_on date,
    expires_on date,
    visibility varchar(24) NOT NULL CHECK (visibility IN ('PRIVATE', 'PUBLIC_SUMMARY')),
    verification_status varchar(16) NOT NULL
        CHECK (verification_status IN ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED', 'REVOKED')),
    version bigint NOT NULL CHECK (version >= 0),
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    CONSTRAINT credentials_date_order CHECK (expires_on IS NULL OR issued_on IS NULL OR expires_on >= issued_on)
);
CREATE INDEX idx_credentials_worker ON credentials(worker_user_id, created_at, id);
CREATE INDEX idx_credentials_public ON credentials(worker_user_id, id)
    WHERE visibility = 'PUBLIC_SUMMARY' AND verification_status = 'VERIFIED';

CREATE TABLE credential_document_objects (
    id uuid PRIMARY KEY,
    credential_id uuid NOT NULL REFERENCES credentials(id) ON DELETE CASCADE,
    object_key varchar(240) NOT NULL UNIQUE,
    original_filename varchar(240) NOT NULL,
    declared_mime_type varchar(100) NOT NULL,
    detected_mime_type varchar(100),
    declared_size_bytes bigint NOT NULL CHECK (declared_size_bytes > 0),
    actual_size_bytes bigint,
    upload_status varchar(16) NOT NULL
        CHECK (upload_status IN ('INITIATED', 'UPLOADED', 'REJECTED', 'DELETED')),
    malware_status varchar(16) NOT NULL
        CHECK (malware_status IN ('PENDING', 'CLEAN', 'INFECTED', 'ERROR')),
    upload_expires_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL,
    completed_at timestamptz
);
CREATE INDEX idx_credential_documents_credential ON credential_document_objects(credential_id, created_at, id);

CREATE TABLE credential_sharing_grants (
    id uuid PRIMARY KEY,
    credential_id uuid NOT NULL REFERENCES credentials(id) ON DELETE CASCADE,
    granted_to_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    granted_by_user_id uuid NOT NULL REFERENCES users(id),
    expires_at timestamptz NOT NULL,
    revoked_at timestamptz,
    created_at timestamptz NOT NULL,
    CONSTRAINT credential_sharing_not_self CHECK (granted_to_user_id <> granted_by_user_id)
);
CREATE UNIQUE INDEX uq_active_credential_share
    ON credential_sharing_grants(credential_id, granted_to_user_id) WHERE revoked_at IS NULL;
CREATE INDEX idx_credential_shares_grantee ON credential_sharing_grants(granted_to_user_id, expires_at)
    WHERE revoked_at IS NULL;

CREATE TABLE credential_verification_history (
    id uuid PRIMARY KEY,
    credential_id uuid NOT NULL REFERENCES credentials(id) ON DELETE CASCADE,
    from_status varchar(16),
    to_status varchar(16) NOT NULL,
    actor_user_id uuid NOT NULL REFERENCES users(id),
    reason varchar(1000) NOT NULL,
    created_at timestamptz NOT NULL
);
CREATE INDEX idx_credential_history ON credential_verification_history(credential_id, created_at DESC);

UPDATE atlas_schema_metadata SET schema_version = 6 WHERE id = 1;
