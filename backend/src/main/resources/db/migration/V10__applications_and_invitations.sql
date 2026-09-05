CREATE TABLE applications (
    id uuid PRIMARY KEY,
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
    shift_id uuid REFERENCES shifts(id) ON DELETE CASCADE,
    worker_id uuid NOT NULL REFERENCES worker_profiles(user_id) ON DELETE CASCADE,
    status varchar(32) NOT NULL CHECK (status IN ('SUBMITTED', 'UNDER_REVIEW', 'SHORTLISTED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN')),
    cover_note varchar(2000),
    proposed_rate_pence bigint CHECK (proposed_rate_pence IS NULL OR proposed_rate_pence > 0),
    version bigint NOT NULL CHECK (version >= 0),
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    CONSTRAINT chk_app_target CHECK (job_id IS NOT NULL OR shift_id IS NOT NULL)
);

CREATE UNIQUE INDEX uq_app_job_worker ON applications(job_id, worker_id) WHERE job_id IS NOT NULL;
CREATE UNIQUE INDEX uq_app_shift_worker ON applications(shift_id, worker_id) WHERE shift_id IS NOT NULL;
CREATE INDEX idx_applications_worker ON applications(worker_id, status);
CREATE INDEX idx_applications_organization ON applications(organization_id, status);
CREATE INDEX idx_applications_job ON applications(job_id, status);
CREATE INDEX idx_applications_shift ON applications(shift_id, status);

CREATE TABLE invitations (
    id uuid PRIMARY KEY,
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
    shift_id uuid REFERENCES shifts(id) ON DELETE CASCADE,
    worker_id uuid NOT NULL REFERENCES worker_profiles(user_id) ON DELETE CASCADE,
    sender_id uuid NOT NULL REFERENCES users(id),
    status varchar(32) NOT NULL CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CANCELLED')),
    offered_rate_pence bigint CHECK (offered_rate_pence IS NULL OR offered_rate_pence > 0),
    message varchar(2000),
    expires_at timestamptz NOT NULL,
    version bigint NOT NULL CHECK (version >= 0),
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    CONSTRAINT chk_inv_target CHECK (job_id IS NOT NULL OR shift_id IS NOT NULL)
);

CREATE UNIQUE INDEX uq_inv_job_worker ON invitations(job_id, worker_id) WHERE job_id IS NOT NULL AND status = 'PENDING';
CREATE UNIQUE INDEX uq_inv_shift_worker ON invitations(shift_id, worker_id) WHERE shift_id IS NOT NULL AND status = 'PENDING';
CREATE INDEX idx_invitations_worker ON invitations(worker_id, status);
CREATE INDEX idx_invitations_organization ON invitations(organization_id, status);
CREATE INDEX idx_invitations_job ON invitations(job_id, status);
CREATE INDEX idx_invitations_shift ON invitations(shift_id, status);
