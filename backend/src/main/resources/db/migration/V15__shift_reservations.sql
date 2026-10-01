CREATE TABLE shift_reservations (
    id uuid PRIMARY KEY,
    shift_id uuid NOT NULL,
    organization_id uuid NOT NULL,
    worker_user_id uuid NOT NULL,
    status varchar(16) NOT NULL CHECK (status IN ('CONFIRMED', 'CANCELLED')),
    version bigint NOT NULL DEFAULT 0 CHECK (version >= 0),
    created_by_user_id uuid NOT NULL REFERENCES users(id),
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    CONSTRAINT fk_shift_reservation_shift_org
        FOREIGN KEY (shift_id, organization_id)
        REFERENCES shifts(id, organization_id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_shift_reservation_worker
        FOREIGN KEY (worker_user_id)
        REFERENCES worker_profiles(user_id)
        ON DELETE RESTRICT
);

CREATE UNIQUE INDEX uq_shift_reservation_confirmed_worker
    ON shift_reservations(shift_id, worker_user_id)
    WHERE status = 'CONFIRMED';

CREATE INDEX idx_shift_reservations_org_shift
    ON shift_reservations(organization_id, shift_id, status);

CREATE INDEX idx_shift_reservations_worker
    ON shift_reservations(worker_user_id, created_at DESC);

UPDATE atlas_schema_metadata SET schema_version = 15 WHERE id = 1;
