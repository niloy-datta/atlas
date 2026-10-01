package com.atlas.notification.web;

import com.atlas.identity.domain.AtlasPrincipal;
import com.atlas.notification.application.NotificationService;
import com.atlas.notification.infrastructure.NotificationRepository.NotificationRow;
import java.util.List;
import java.util.UUID;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {
    private final NotificationService notifications;

    public NotificationController(NotificationService notifications) {
        this.notifications = notifications;
    }

    @GetMapping
    List<NotificationRow> list(@AuthenticationPrincipal AtlasPrincipal principal,
                               @RequestParam(defaultValue = "50") int limit) {
        return notifications.list(principal.requireUserId(), limit);
    }

    @GetMapping("/unread-count")
    UnreadCount unread(@AuthenticationPrincipal AtlasPrincipal principal) {
        return new UnreadCount(notifications.unreadCount(principal.requireUserId()));
    }

    @PostMapping("/{notificationId}/read")
    ResponseEntity<Void> markRead(@AuthenticationPrincipal AtlasPrincipal principal,
                                  @PathVariable UUID notificationId) {
        notifications.markRead(principal.requireUserId(), notificationId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    SseEmitter stream(@AuthenticationPrincipal AtlasPrincipal principal,
                      @RequestHeader(value = "Last-Event-ID", required = false) String lastEventId) {
        return notifications.subscribe(principal.requireUserId(), parseSequence(lastEventId));
    }

    private static long parseSequence(String value) {
        if (value == null || value.isBlank()) return 0;
        try {
            return Math.max(0, Long.parseLong(value));
        } catch (NumberFormatException exception) {
            return 0;
        }
    }

    public record UnreadCount(long count) { }
}
