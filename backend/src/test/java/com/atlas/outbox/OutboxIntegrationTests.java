package com.atlas.outbox;

import static org.assertj.core.api.Assertions.assertThat;

import com.atlas.TestcontainersConfiguration;
import com.atlas.workledger.application.WorkLedgerService;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
class OutboxIntegrationTests {
    private final WorkLedgerService ledger;
    private final JdbcTemplate jdbc;
    private final TransactionTemplate transactions;

    @Autowired
    OutboxIntegrationTests(WorkLedgerService ledger, JdbcTemplate jdbc,
                           TransactionTemplate transactions) {
        this.ledger = ledger;
        this.jdbc = jdbc;
        this.transactions = transactions;
    }

    @Test
    void committedDomainMutationCreatesPendingOutboxEvent() {
        Fixture f = fixture();
        var entry = ledger.record(f.workerId(), f.organizationId(), f.shiftId(),
                f.reservationId(), "RESERVATION_CONFIRMED");

        Integer events = jdbc.queryForObject("""
                SELECT count(*) FROM outbox_events
                 WHERE aggregate_type = 'WORK_LEDGER'
                   AND aggregate_id = ?
                   AND event_type = 'workledger.reservation_confirmed.v1'
                   AND published_at IS NULL
                """, Integer.class, entry.id());

        assertThat(events).isEqualTo(1);
    }

    @Test
    void rollbackRemovesDomainMutationAndOutboxEventTogether() {
        Fixture f = fixture();

        transactions.executeWithoutResult(status -> {
            ledger.record(f.workerId(), f.organizationId(), f.shiftId(),
                    f.reservationId(), "RESERVATION_CONFIRMED");

            assertThat(countLedger(f.workerId())).isEqualTo(1);
            assertThat(countOutboxForWorker(f.workerId())).isEqualTo(1);
            status.setRollbackOnly();
        });

        assertThat(countLedger(f.workerId())).isZero();
        assertThat(countOutboxForWorker(f.workerId())).isZero();
    }

    private int countLedger(UUID workerId) {
        Integer count = jdbc.queryForObject("""
                SELECT count(*) FROM work_ledger_entries WHERE worker_user_id = ?
                """, Integer.class, workerId);
        return count == null ? 0 : count;
    }

    private int countOutboxForWorker(UUID workerId) {
        Integer count = jdbc.queryForObject("""
                SELECT count(*) FROM outbox_events
                 WHERE payload ->> 'workerUserId' = ?
                """, Integer.class, workerId.toString());
        return count == null ? 0 : count;
    }

    private Fixture fixture() {
        UUID userId = UUID.randomUUID();
        UUID profileId = UUID.randomUUID();
        UUID orgId = UUID.randomUUID();
        UUID shiftId = UUID.randomUUID();
        UUID reservationId = UUID.randomUUID();
        String email = "outbox-" + UUID.randomUUID() + "@example.test";

        jdbc.update("""
                INSERT INTO users
                    (id, email_normalized, email_display, password_hash, enabled,
                     firebase_uid, created_at, updated_at)
                VALUES (?, ?, ?, NULL, true, ?, now(), now())
                """, userId, email, email, "outbox-" + UUID.randomUUID());

        jdbc.update("""
                INSERT INTO worker_profiles
                    (id, user_id, public_handle, full_name, headline, bio, experience_years,
                     visibility, completion_score, completion_version, version, created_at, updated_at)
                VALUES (?, ?, ?, 'Outbox Worker', 'Worker', 'Outbox test', 2,
                        'PRIVATE', 50, 1, 0, now(), now())
                """, profileId, userId, "outbox-" + profileId.toString().substring(0, 8));

        jdbc.update("""
                INSERT INTO organizations
                    (id, name, slug, description, verification_status, version, created_at, updated_at)
                VALUES (?, 'Outbox Employer', ?, 'Test', 'UNVERIFIED', 0, now(), now())
                """, orgId, "outbox-org-" + UUID.randomUUID().toString().substring(0, 8));

        jdbc.update("""
                INSERT INTO shifts
                    (id, job_id, organization_id, title, description, start_time, end_time,
                     timezone, capacity, hourly_rate_pence, currency, status,
                     location_name, formatted_address, location, version, created_at, updated_at)
                VALUES (?, NULL, ?, 'Outbox Shift', 'Test',
                        now(), now() + interval '8 hours',
                        'UTC', 1, 2000, 'USD', 'PUBLISHED',
                        'Test', 'Test', NULL, 0, now(), now())
                """, shiftId, orgId);

        jdbc.update("""
                INSERT INTO shift_reservations
                    (id, shift_id, organization_id, worker_user_id, status, version,
                     created_by_user_id, created_at, updated_at)
                VALUES (?, ?, ?, ?, 'CONFIRMED', 0, ?, now(), now())
                """, reservationId, shiftId, orgId, userId, userId);

        return new Fixture(userId, orgId, shiftId, reservationId);
    }

    private record Fixture(UUID workerId, UUID organizationId,
                           UUID shiftId, UUID reservationId) { }
}
