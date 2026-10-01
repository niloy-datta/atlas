package com.atlas.notification;

import static org.assertj.core.api.Assertions.assertThat;

import com.atlas.TestcontainersConfiguration;
import com.atlas.messaging.application.ConsumerEventProcessor;
import com.atlas.messaging.domain.DomainEventEnvelope;
import com.atlas.notification.application.NotificationEventHandler;
import com.atlas.notification.application.NotificationService;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
class NotificationIntegrationTests {
    private final ConsumerEventProcessor processor;
    private final NotificationEventHandler handler;
    private final NotificationService notifications;
    private final JdbcTemplate jdbc;

    @Autowired
    NotificationIntegrationTests(ConsumerEventProcessor processor,
                                 NotificationEventHandler handler,
                                 NotificationService notifications,
                                 JdbcTemplate jdbc) {
        this.processor = processor;
        this.handler = handler;
        this.notifications = notifications;
        this.jdbc = jdbc;
    }

    @Test
    void domainEventCreatesExactlyOneNotificationEvenWhenRedelivered() {
        UUID userId = createUser();
        UUID eventId = UUID.randomUUID();
        DomainEventEnvelope event = event(eventId, userId, 10L,
                "workledger.reservation_confirmed.v1");

        assertThat(processor.process("notification-test", event, handler::handle))
                .isEqualTo(ConsumerEventProcessor.Result.PROCESSED);
        assertThat(processor.process("notification-test", event, handler::handle))
                .isEqualTo(ConsumerEventProcessor.Result.DUPLICATE);

        var rows = notifications.list(userId, 20);
        assertThat(rows).hasSize(1);
        assertThat(rows.get(0).sourceEventId()).isEqualTo(eventId);
        assertThat(rows.get(0).title()).isEqualTo("Shift reserved");
        assertThat(notifications.unreadCount(userId)).isEqualTo(1);
    }

    @Test
    void notificationSourceUniquenessProtectsAgainstProjectionDoubleRun() {
        UUID userId = createUser();
        DomainEventEnvelope event = event(UUID.randomUUID(), userId, 20L,
                "workledger.shift_completed.v1");

        handler.handle(event);
        handler.handle(event);

        assertThat(notifications.list(userId, 20)).hasSize(1);
    }

    @Test
    void reconnectCursorReplaysOnlyMissedNotificationsAndReadStateIsDurable() {
        UUID userId = createUser();

        var first = notifications.create(userId, UUID.randomUUID(),
                "workledger.reservation_confirmed.v1", "First", "First body");
        var second = notifications.create(userId, UUID.randomUUID(),
                "workledger.shift_completed.v1", "Second", "Second body");
        var third = notifications.create(userId, UUID.randomUUID(),
                "workledger.reservation_cancelled.v1", "Third", "Third body");

        var replay = notifications.replayAfter(userId, first.sequenceNo());

        assertThat(replay)
                .extracting(row -> row.id())
                .containsExactly(second.id(), third.id());

        notifications.markRead(userId, second.id());
        assertThat(notifications.unreadCount(userId)).isEqualTo(2);

        Instant readAt = jdbc.queryForObject(
                "SELECT read_at FROM notifications WHERE id = ?",
                (rs, n) -> rs.getTimestamp(1).toInstant(), second.id());
        assertThat(readAt).isNotNull();
    }

    private UUID createUser() {
        UUID userId = UUID.randomUUID();
        String email = "notification-" + UUID.randomUUID() + "@example.test";
        jdbc.update("""
                INSERT INTO users
                    (id, email_normalized, email_display, password_hash, enabled,
                     firebase_uid, created_at, updated_at)
                VALUES (?, ?, ?, NULL, true, ?, now(), now())
                """, userId, email, email, "notification-" + UUID.randomUUID());
        return userId;
    }

    private static DomainEventEnvelope event(UUID eventId, UUID userId, long sequence,
                                             String eventType) {
        String payload = "{\"workerUserId\":\"" + userId + "\"}";
        return new DomainEventEnvelope(
                eventId,
                "WORK_LEDGER",
                userId,
                sequence,
                eventType,
                payload,
                Instant.parse("2026-10-01T12:00:00Z"));
    }
}
