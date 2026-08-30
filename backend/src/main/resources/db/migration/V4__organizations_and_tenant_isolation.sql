CREATE TABLE organizations (
    id uuid PRIMARY KEY,
    name varchar(160) NOT NULL,
    slug varchar(80) NOT NULL UNIQUE,
    description varchar(2000),
    verification_status varchar(16) NOT NULL
        CHECK (verification_status IN ('UNVERIFIED', 'PENDING', 'VERIFIED', 'SUSPENDED')),
    version bigint NOT NULL CHECK (version >= 0),
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    CONSTRAINT organizations_slug_format CHECK (slug ~ '^[a-z0-9][a-z0-9-]{1,78}[a-z0-9]$')
);

CREATE TABLE organization_members (
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role varchar(24) NOT NULL
        CHECK (role IN ('OWNER', 'ADMIN', 'HIRING_MANAGER', 'RECRUITER', 'VIEWER')),
    joined_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    PRIMARY KEY (organization_id, user_id)
);
CREATE INDEX idx_organization_members_user ON organization_members(user_id, organization_id);

CREATE TABLE organization_locations (
    id uuid PRIMARY KEY,
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name varchar(120) NOT NULL,
    search_point geography(Point, 4326) NOT NULL,
    address_line varchar(240),
    city varchar(120),
    region varchar(120),
    country_code char(2) NOT NULL CHECK (country_code ~ '^[A-Z]{2}$'),
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    UNIQUE (organization_id, name)
);
CREATE INDEX idx_organization_locations_org ON organization_locations(organization_id, active);
CREATE INDEX idx_organization_locations_point ON organization_locations USING gist(search_point);

CREATE TABLE organization_invitations (
    id uuid PRIMARY KEY,
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email_normalized varchar(320) NOT NULL,
    role varchar(24) NOT NULL
        CHECK (role IN ('ADMIN', 'HIRING_MANAGER', 'RECRUITER', 'VIEWER')),
    status varchar(16) NOT NULL CHECK (status IN ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED')),
    invited_by_user_id uuid NOT NULL REFERENCES users(id),
    expires_at timestamptz NOT NULL,
    accepted_by_user_id uuid REFERENCES users(id),
    accepted_at timestamptz,
    created_at timestamptz NOT NULL
);
CREATE UNIQUE INDEX uq_organization_pending_invitation
    ON organization_invitations(organization_id, email_normalized)
    WHERE status = 'PENDING';

CREATE TABLE organization_verification_history (
    id uuid PRIMARY KEY,
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    from_status varchar(16) NOT NULL,
    to_status varchar(16) NOT NULL,
    actor_user_id uuid NOT NULL REFERENCES users(id),
    reason varchar(1000) NOT NULL,
    created_at timestamptz NOT NULL
);
CREATE INDEX idx_organization_verification_history_org
    ON organization_verification_history(organization_id, created_at DESC);

CREATE FUNCTION atlas_require_organization_owner() RETURNS trigger AS $$
DECLARE
    scoped_organization_id uuid;
BEGIN
    scoped_organization_id := COALESCE(NEW.organization_id, OLD.organization_id);
    IF EXISTS (SELECT 1 FROM organizations WHERE id = scoped_organization_id)
       AND NOT EXISTS (
           SELECT 1 FROM organization_members
            WHERE organization_id = scoped_organization_id AND role = 'OWNER'
       ) THEN
        RAISE EXCEPTION 'organization % must retain at least one owner', scoped_organization_id
            USING ERRCODE = '23514';
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER organization_requires_owner
AFTER INSERT OR UPDATE OR DELETE ON organization_members
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION atlas_require_organization_owner();

UPDATE atlas_schema_metadata SET schema_version = 4 WHERE id = 1;
