package com.atlas.shared.idempotency;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.atlas.TestcontainersConfiguration;
import com.atlas.organization.application.OrganizationService;
import com.atlas.reservation.application.ReservationService;
import com.atlas.reservation.infrastructure.ReservationRepository.ReservationRow;
import com.atlas.shared.error.ApiProblemException;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
class IdempotencyIntegrationTests {
    private final IdempotencyService idempotency;
    private final ReservationService reservations;
    private final JdbcTemplate jdbc;

    @Autowired
    IdempotencyIntegrationTests(IdempotencyService idempotency,
                                ReservationService reservations,
                                JdbcTemplate jdbc) {
        this.idempotency = idempotency;
        this.reservations = reservations;
        this.jdbc = jdbc;
    }

    @Test
    void sequentialRetryReplaysOriginalMutation() {
        Fixture fixture = fixture(2);
        Request payload = new Request(fixture.workerId());
        String operation = operation(fixture);

        var first = idempotency.execute(fixture.actorId(), operation, "same-key", payload,
                ReservationRow.class,
                () -> reservations.reserve(fixture.organizationId(), fixture.shiftId(),
                        fixture.actorId(), fixture.workerId()));
        var second = idempotency.execute(fixture.actorId(), operation, "same-key", payload,
                ReservationRow.class,
                () -> reservations.reserve(fixture.organizationId(), fixture.shiftId(),
                        fixture.actorId(), fixture.workerId()));

        assertThat(first.replayed()).isFalse();
        assertThat(second.replayed()).isTrue();
        assertThat(second.value().id()).isEqualTo(first.value().id());
        assertThat(activeReservations(fixture.shiftId())).isEqualTo(1);
    }

    @Test
    void sameKeyWithDifferentPayloadIsRejected() {
        Fixture fixture = fixture(2);
        UUID otherWorker = createWorker();

        idempotency.execute(fixture.actorId(), operation(fixture), "payload-key",
                new Request(fixture.workerId()), ReservationRow.class,
                () -> reservations.reserve(fixture.organizationId(), fixture.shiftId(),
                        fixture.actorId(), fixture.workerId()));

        assertThatThrownBy(() -> idempotency.execute(
                fixture.actorId(), operation(fixture), "payload-key",
                new Request(otherWorker), ReservationRow.class,
                () -> reservations.reserve(fixture.organizationId(), fixture.shiftId(),
                        fixture.actorId(), otherWorker)))
                .isInstanceOf(ApiProblemException.class)
                .hasMessageContaining("different request payload");

        assertThat(activeReservations(fixture.shiftId())).isEqualTo(1);
    }

    @Test
    void concurrentRetryExecutesMutationOnce() throws Exception {
        Fixture fixture = fixture(2);
        Request payload = new Request(fixture.workerId());
        String operation = operation(fixture);
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        ExecutorService executor = Executors.newFixedThreadPool(2);

        java.util.concurrent.Callable<IdempotencyService.Result<ReservationRow>> call = () -> {
            ready.countDown();
            start.await();
            return idempotency.execute(fixture.actorId(), operation, "concurrent-key", payload,
                    ReservationRow.class,
                    () -> reservations.reserve(fixture.organizationId(), fixture.shiftId(),
                            fixture.actorId(), fixture.workerId()));
        };

        Future<IdempotencyService.Result<ReservationRow>> a = executor.submit(call);
        Future<IdempotencyService.Result<ReservationRow>> b = executor.submit(call);
        ready.await();
        start.countDown();

        var ra = a.get();
        var rb = b.get();
        executor.shutdownNow();

        assertThat(ra.value().id()).isEqualTo(rb.value().id());
        assertThat(ra.replayed() ^ rb.replayed()).isTrue();
        assertThat(activeReservations(fixture.shiftId())).isEqualTo(1);
    }

    private Fixture fixture(int capacity) {
        UUID actorId = createUser("EMPLOYER_MEMBER");
        UUID orgId = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO organizations
                    (id, name, slug, description, verification_status, version, created_at, updated_at)
                VALUES (?, 'Idempotency Employer', ?, 'Test', 'UNVERIFIED', 0, now(), now())
                """, orgId, "idem-" + UUID.randomUUID().toString().substring(0, 8));
        jdbc.update("""
                INSERT INTO organization_members
                    (organization_id, user_id, role, joined_at, updated_at)
                VALUES (?, ?, 'OWNER', now(), now())
                """, orgId, actorId);

        UUID shiftId = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO shifts
                    (id, job_id, organization_id, title, description, start_time, end_time,
                     timezone, capacity, hourly_rate_pence, currency, status,
                     location_name, formatted_address, location, version, created_at, updated_at)
                VALUES (?, NULL, ?, 'Idempotency Shift', 'Test',
                        now() + interval '1 day', now() + interval '9 hours' + interval '1 day',
                        'Asia/Dhaka', ?, 50000, 'BDT', 'PUBLISHED',
                        'Dhaka', 'Dhaka, Bangladesh', NULL, 0, now(), now())
                """, shiftId, orgId, capacity);

        return new Fixture(actorId, orgId, shiftId, createWorker());
    }

    private UUID createWorker() {
        UUID userId = createUser("WORKER");
        UUID profileId = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO worker_profiles
                    (id, user_id, public_handle, full_name, headline, bio, experience_years,
                     visibility, completion_score, completion_version, version, created_at, updated_at)
                VALUES (?, ?, ?, 'Idempotency Worker', 'Worker', 'Test', 2,
                        'PRIVATE', 50, 1, 0, now(), now())
                """, profileId, userId, "idem-worker-" + profileId.toString().substring(0, 8));
        return userId;
    }

    private UUID createUser(String role) {
        UUID userId = UUID.randomUUID();
        String email = "idem-" + UUID.randomUUID() + "@example.test";
        jdbc.update("""
                INSERT INTO users
                    (id, email_normalized, email_display, password_hash, enabled,
                     firebase_uid, created_at, updated_at)
                VALUES (?, ?, ?, NULL, true, ?, now(), now())
                """, userId, email, email, "idem-" + UUID.randomUUID());
        jdbc.update("INSERT INTO user_roles (user_id, role) VALUES (?, ?)", userId, role);
        return userId;
    }

    private int activeReservations(UUID shiftId) {
        Integer count = jdbc.queryForObject("""
                SELECT count(*) FROM shift_reservations
                 WHERE shift_id = ? AND status = 'CONFIRMED'
                """, Integer.class, shiftId);
        return count == null ? 0 : count;
    }

    private static String operation(Fixture fixture) {
        return "reserve-shift:" + fixture.organizationId() + ":" + fixture.shiftId();
    }

    private record Request(UUID workerId) { }
    private record Fixture(UUID actorId, UUID organizationId, UUID shiftId, UUID workerId) { }
}
