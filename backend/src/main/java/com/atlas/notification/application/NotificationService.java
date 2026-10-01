package com.atlas.notification.application;

import com.atlas.notification.infrastructure.NotificationRepository;
import com.atlas.notification.infrastructure.NotificationRepository.NotificationRow;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Service
public class NotificationService {
    private final NotificationRepository notifications;
    private final NotificationStreamRegistry streams;
    private final Clock clock;

    public NotificationService(NotificationRepository notifications,
                               NotificationStreamRegistry streams,
                               Clock clock) {
        this.notifications = notifications;
        this.streams = streams;
        this.clock = clock;
    }

    @Transactional
    public NotificationRow create(UUID userId, UUID sourceEventId, String eventType,
                                  String title, String body) {
        NotificationRow row = notifications.insertIfAbsent(
                UUID.randomUUID(), userId, sourceEventId, eventType,
                title, body, Instant.now(clock)).orElse(null);

        if (row != null) publishAfterCommit(row);
        return row;
    }

    @Transactional(readOnly = true)
    public List<NotificationRow> list(UUID userId, int limit) {
        return notifications.list(userId, Math.clamp(limit, 1, 200));
    }

    @Transactional(readOnly = true)
    public List<NotificationRow> replayAfter(UUID userId, long sequenceNo) {
        return notifications.after(userId, Math.max(0, sequenceNo), 200);
    }

    @Transactional
    public void markRead(UUID userId, UUID notificationId) {
        notifications.markRead(userId, notificationId, Instant.now(clock));
    }

    @Transactional(readOnly = true)
    public long unreadCount(UUID userId) {
        return notifications.unreadCount(userId);
    }

    public SseEmitter subscribe(UUID userId, long afterSequence) {
        return streams.subscribe(userId, Math.max(0, afterSequence));
    }

    private void publishAfterCommit(NotificationRow row) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    streams.publish(row);
                }
            });
        } else {
            streams.publish(row);
        }
    }
}
