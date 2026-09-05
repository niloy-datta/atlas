-- V11__harden_application_targets.sql

-- 1. Ensure composite candidate keys exist on jobs and shifts for tenant isolation
ALTER TABLE jobs
    ADD CONSTRAINT uq_jobs_id_organization
    UNIQUE (id, organization_id);

ALTER TABLE shifts
    ADD CONSTRAINT uq_shifts_id_organization
    UNIQUE (id, organization_id);

-- 2. Strictly enforce exactly one target for applications and invitations (XOR)
ALTER TABLE applications
    DROP CONSTRAINT chk_app_target;

ALTER TABLE applications
    ADD CONSTRAINT chk_app_target_exactly_one
    CHECK (num_nonnulls(job_id, shift_id) = 1);

ALTER TABLE invitations
    DROP CONSTRAINT chk_inv_target;

ALTER TABLE invitations
    ADD CONSTRAINT chk_inv_target_exactly_one
    CHECK (num_nonnulls(job_id, shift_id) = 1);

-- 3. Replace single-column FKs on applications with composite tenant-safe FKs
ALTER TABLE applications
    DROP CONSTRAINT applications_job_id_fkey,
    DROP CONSTRAINT applications_shift_id_fkey;

ALTER TABLE applications
    ADD CONSTRAINT fk_application_job_org
        FOREIGN KEY (job_id, organization_id)
        REFERENCES jobs (id, organization_id)
        ON DELETE RESTRICT,
    ADD CONSTRAINT fk_application_shift_org
        FOREIGN KEY (shift_id, organization_id)
        REFERENCES shifts (id, organization_id)
        ON DELETE RESTRICT;

-- 4. Replace single-column FKs on invitations with composite tenant-safe FKs
ALTER TABLE invitations
    DROP CONSTRAINT invitations_job_id_fkey,
    DROP CONSTRAINT invitations_shift_id_fkey;

ALTER TABLE invitations
    ADD CONSTRAINT fk_invitation_job_org
        FOREIGN KEY (job_id, organization_id)
        REFERENCES jobs (id, organization_id)
        ON DELETE RESTRICT,
    ADD CONSTRAINT fk_invitation_shift_org
        FOREIGN KEY (shift_id, organization_id)
        REFERENCES shifts (id, organization_id)
        ON DELETE RESTRICT;

-- 5. Add composite tenant foreign key on shifts -> jobs
ALTER TABLE shifts
    DROP CONSTRAINT shifts_job_id_fkey;

ALTER TABLE shifts
    ADD CONSTRAINT fk_shifts_job_org
        FOREIGN KEY (job_id, organization_id)
        REFERENCES jobs (id, organization_id)
        ON DELETE RESTRICT;
