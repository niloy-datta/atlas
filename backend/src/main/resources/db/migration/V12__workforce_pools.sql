CREATE TABLE workforce_pools (
    id uuid PRIMARY KEY,
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name varchar(120) NOT NULL,
    description varchar(1000),
    version bigint NOT NULL DEFAULT 0 CHECK (version >= 0),
    created_by_user_id uuid NOT NULL REFERENCES users(id),
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    CONSTRAINT uq_workforce_pool_id_organization UNIQUE (id, organization_id),
    CONSTRAINT uq_workforce_pool_name UNIQUE (organization_id, name),
    CONSTRAINT chk_workforce_pool_name_not_blank CHECK (btrim(name) <> '')
);

CREATE INDEX idx_workforce_pools_organization
    ON workforce_pools(organization_id, created_at DESC);

CREATE TABLE workforce_pool_members (
    pool_id uuid NOT NULL,
    organization_id uuid NOT NULL,
    worker_user_id uuid NOT NULL,
    added_by_user_id uuid NOT NULL REFERENCES users(id),
    note varchar(500),
    added_at timestamptz NOT NULL,
    PRIMARY KEY (pool_id, worker_user_id),
    CONSTRAINT fk_workforce_pool_member_pool_org
        FOREIGN KEY (pool_id, organization_id)
        REFERENCES workforce_pools(id, organization_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_workforce_pool_member_worker_profile
        FOREIGN KEY (worker_user_id)
        REFERENCES worker_profiles(user_id)
        ON DELETE CASCADE
);

CREATE INDEX idx_workforce_pool_members_org_worker
    ON workforce_pool_members(organization_id, worker_user_id);

UPDATE atlas_schema_metadata SET schema_version = 12 WHERE id = 1;
