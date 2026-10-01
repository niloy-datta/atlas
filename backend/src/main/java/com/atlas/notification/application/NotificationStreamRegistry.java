package com.atlas.notification.application;

import com.atlas.notification.infrastructure.NotificationRepository;
import com.atlas.notification.infrastructure.NotificationRepository.NotificationRow;
import java.io.IOException;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Component
public class NotificationStreamRegistry {
    private static final long STREAM_TIMEOUT_MS = 30L * 60L * 1000L;
    private final NotificationRepository notifications;
    private final ConcurrentHashMap<UUID, CopyOnWriteArrayList<SseEmitter>> emitters =
            new ConcurrentHashMap<>();

    public NotificationStreamRegistry(NotificationRepository notifications) {
        this.notifications = notifications;
    }

    public SseEmitter subscribe(UUID userId, long afterSequence) {
        SseEmitter emitter = new SseEmitter(STREAM_TIMEOUT_MS);
        CopyOnWriteArrayList<SseEmitter> userEmitters =
                emitters.computeIfAbsent(userId, ignored -> new CopyOnWriteArrayList<>());
        userEmitters.add(emitter);

        Runnable cleanup = () -> {
            userEmitters.remove(emitter);
            if (userEmitters.isEmpty()) emitters.remove(userId, userEmitters);
        };
        emitter.onCompletion(cleanup);
        emitter.onTimeout(cleanup);
        emitter.onError(ignored -> cleanup.run());

        for (NotificationRow row : notifications.after(userId, afterSequence, 200)) {
            if (!send(emitter, row)) break;
        }
        return emitter;
    }

    public void publish(NotificationRow row) {
        CopyOnWriteArrayList<SseEmitter> userEmitters = emitters.get(row.userId());
        if (userEmitters == null) return;

        for (SseEmitter emitter : userEmitters) {
            if (!send(emitter, row)) userEmitters.remove(emitter);
        }
    }

    private static boolean send(SseEmitter emitter, NotificationRow row) {
        try {
            emitter.send(SseEmitter.event()
                    .id(Long.toString(row.sequenceNo()))
                    .name("notification")
                    .data(row));
            return true;
        } catch (IOException | IllegalStateException exception) {
            emitter.complete();
            return false;
        }
    }
}
