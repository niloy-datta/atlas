package com.atlas.workledger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.atlas.TestcontainersConfiguration;
import com.atlas.workledger.application.WorkLedgerService;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
class WorkLedgerIntegrationTests {
    private final WorkLedgerService ledger;
    private final JdbcTemplate jdbc;

    @Autowired
    WorkLedgerIntegrationTests(WorkLedgerService ledger, JdbcTemplate jdbc) {
        this.ledger = ledger;
        this.jdbc = jdbc;
    }

    @Test
    void ledgerIsAppendOnlyAndProjectionIsDerivedFromHistory() {
        Fixture f = fixture();

        var confirmed = ledger.record(f.workerId(), f.organizationId(), f.shiftId(),
                f.reservationId(), "RESERVATION_CONFIRMED");
        ledger.record(f.workerId(), f.organizationId(), f.shiftId(),
                f.reservationId(), "RESERVATION_CANCELLED");
        ledger.record(f.workerId(), f.organizationId(), f.shiftId(),
                f.reservationId(), "SHIFT_COMPLETED");

        var history = ledger.list(f.workerId(), 20);
        var summary = ledger.projection(f.workerId());

        assertThat(history).hasSize(3);
        assertThat(history.get(0).sequenceNo()).isGreaterThan(history.get(1).sequenceNo());
        assertThat(summary.confirmedReservations()).isEqualTo(1);
        assertThat(summary.cancelledReservations()).isEqualTo(1);
        assertThat(summary.completedShifts()).isEqualTo(1);
        assertThat(summary.lastActivityAt()).isNotNull();

        assertThatThrownBy(() -> jdbc.update(
                "UPDATE work_ledger_entries SET event_type = 'SHIFT_COMPLETED' WHERE id = ?",
                confirmed.id()))
                .isInstanceOf(DataAccessException.class)
                .hasMessageContaining("append-only");

        assertThatThrownBy(() -> jdbc.update(
                "DELETE FROM work_ledger_entries WHERE id = ?", confirmed.id()))
                .isInstanceOf(DataAccessException.class)
                .hasMessageContaining("append-only");
    }

    private Fixture fixture() {
        UUID userId = UUID.randomUUID();
        UUID profileId = UUID.randomUUID();
        UUID orgId = UUID.randomUUID();
        UUID shiftId = UUID.randomUUID();
        UUID reservationId = UUID.randomUUID();
        String email = "ledger-" + UUID.randomUUID() + "@example.test";

        jdbc.update("""
                INSERT INTO users
                    (id, email_normalized, email_display, password_hash, enabled,
                     firebase_uid, created_at, updated_at)
                VALUES (?, ?, ?, NULL, true, ?, now(), now())
                """, userId, email, email, "ledger-" + UUID.randomUUID());

        jdbc.update("""
                INSERT INTO worker_profiles
                    (id, user_id, public_handle, full_name, headline, bio, experience_years,
                     visibility, completion_score, completion_version, version, created_at, updated_at)
                VALUES (?, ?, ?, 'Ledger Worker', 'Worker', 'Ledger test', 3,
                        'PRIVATE', 70, 1, 0, now(), now())
                """, profileId, userId, "ledger-" + profileId.toString().substring(0, 8));

        jdbc.update("""
                INSERT INTO organizations
                    (id, name, slug, description, verification_status, version, created_at, updated_at)
                VALUES (?, 'Ledger Employer', ?, 'Test', 'UNVERIFIED', 0, now(), now())
                """, orgId, "ledger-org-" + UUID.randomUUID().toString().substring(0, 8));

        jdbc.update("""
                INSERT INTO shifts
                    (id, job_id, organization_id, title, description, start_time, end_time,
                     timezone, capacity, hourly_rate_pence, currency, status,
                     location_name, formatted_address, location, version, created_at, updated_at)
                VALUES (?, NULL, ?, 'Ledger Shift', 'Test',
                        now() - interval '9 hours', now() - interval '1 hour',
                        'UTC', 1, 2000, 'USD', 'COMPLETED',
                        'Test', 'Test', NULL, 0, now(), now())
                """, shiftId, orgId);

        jdbc.update("""
                INSERT INTO shift_reservations
                    (id, shift_id, organization_id, worker_user_id, status, version,
                     created_by_user_id, created_at, updated_at)
                VALUES (?, ?, ?, ?, 'CANCELLED', 1, ?, now(), now())
                """, reservationId, shiftId, orgId, userId, userId);

        return new Fixture(userId, orgId, shiftId, reservationId);
    }

    private record Fixture(UUID workerId, UUID organizationId,
                           UUID shiftId, UUID reservationId) { }
}
