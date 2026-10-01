package com.atlas.notification.application;

import com.atlas.messaging.domain.DomainEventEnvelope;
import java.util.UUID;
import org.springframework.stereotype.Component;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Component
public class NotificationEventHandler {
    private final NotificationService notifications;
    private final ObjectMapper json;

    public NotificationEventHandler(NotificationService notifications, ObjectMapper json) {
        this.notifications = notifications;
        this.json = json;
    }

    public void handle(DomainEventEnvelope event) {
        JsonNode payload;
        try {
            payload = json.readTree(event.payload());
        } catch (JacksonException exception) {
            return;
        }

        JsonNode worker = payload.get("workerUserId");
        if (worker == null || worker.asText().isBlank()) return;

        UUID userId;
        try {
            userId = UUID.fromString(worker.asText());
        } catch (IllegalArgumentException exception) {
            return;
        }

        Message message = message(event.eventType());
        if (message == null) return;

        notifications.create(userId, event.eventId(), event.eventType(),
                message.title(), message.body());
    }

    private static Message message(String eventType) {
        return switch (eventType) {
            case "workledger.reservation_confirmed.v1" ->
                    new Message("Shift reserved", "You have been confirmed for a workforce shift.");
            case "workledger.reservation_cancelled.v1" ->
                    new Message("Reservation cancelled", "A confirmed shift reservation was cancelled.");
            case "workledger.shift_completed.v1" ->
                    new Message("Shift completed", "Completed work was added to your WorkLedger.");
            default -> null;
        };
    }

    private record Message(String title, String body) { }
}
