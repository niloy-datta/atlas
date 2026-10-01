CREATE TABLE work_ledger_entries (
    id uuid PRIMARY KEY,
    sequence_no bigint GENERATED ALWAYS AS IDENTITY UNIQUE,
    worker_user_id uuid NOT NULL REFERENCES worker_profiles(user_id) ON DELETE RESTRICT,
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    shift_id uuid REFERENCES shifts(id) ON DELETE RESTRICT,
    reservation_id uuid REFERENCES shift_reservations(id) ON DELETE RESTRICT,
    event_type varchar(40) NOT NULL CHECK (
        event_type IN ('RESERVATION_CONFIRMED', 'RESERVATION_CANCELLED', 'SHIFT_COMPLETED')
    ),
    occurred_at timestamptz NOT NULL,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL
);

CREATE INDEX idx_work_ledger_worker_sequence
    ON work_ledger_entries(worker_user_id, sequence_no DESC);

CREATE INDEX idx_work_ledger_org_shift
    ON work_ledger_entries(organization_id, shift_id, sequence_no);

CREATE FUNCTION reject_work_ledger_mutation() RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'work_ledger_entries is append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_work_ledger_append_only
BEFORE UPDATE OR DELETE ON work_ledger_entries
FOR EACH ROW EXECUTE FUNCTION reject_work_ledger_mutation();

UPDATE atlas_schema_metadata SET schema_version = 17 WHERE id = 1;
