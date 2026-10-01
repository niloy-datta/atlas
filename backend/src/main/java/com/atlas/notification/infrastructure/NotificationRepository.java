package com.atlas.notification.infrastructure;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class NotificationRepository {
    private final JdbcTemplate jdbc;

    public NotificationRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<NotificationRow> insertIfAbsent(UUID id, UUID userId, UUID sourceEventId,
                                                     String eventType, String title, String body,
                                                     Instant createdAt) {
        return jdbc.query("""
                INSERT INTO notifications
                    (id, user_id, source_event_id, event_type, title, body, read_at, created_at)
                VALUES (?, ?, ?, ?, ?, ?, NULL, ?)
                ON CONFLICT (user_id, source_event_id) DO NOTHING
                RETURNING id, sequence_no, user_id, source_event_id, event_type,
                          title, body, read_at, created_at
                """, (rs, n) -> map(rs),
                id, userId, sourceEventId, eventType, title, body,
                Timestamp.from(createdAt)).stream().findFirst();
    }

    public List<NotificationRow> list(UUID userId, int limit) {
        return jdbc.query("""
                SELECT id, sequence_no, user_id, source_event_id, event_type,
                       title, body, read_at, created_at
                  FROM notifications
                 WHERE user_id = ?
                 ORDER BY sequence_no DESC
                 LIMIT ?
                """, (rs, n) -> map(rs), userId, limit);
    }

    public List<NotificationRow> after(UUID userId, long afterSequence, int limit) {
        return jdbc.query("""
                SELECT id, sequence_no, user_id, source_event_id, event_type,
                       title, body, read_at, created_at
                  FROM notifications
                 WHERE user_id = ? AND sequence_no > ?
                 ORDER BY sequence_no
                 LIMIT ?
                """, (rs, n) -> map(rs), userId, afterSequence, limit);
    }

    public int markRead(UUID userId, UUID notificationId, Instant readAt) {
        return jdbc.update("""
                UPDATE notifications
                   SET read_at = COALESCE(read_at, ?)
                 WHERE user_id = ? AND id = ?
                """, Timestamp.from(readAt), userId, notificationId);
    }

    public long unreadCount(UUID userId) {
        Long count = jdbc.queryForObject("""
                SELECT count(*) FROM notifications
                 WHERE user_id = ? AND read_at IS NULL
                """, Long.class, userId);
        return count == null ? 0 : count;
    }

    private static NotificationRow map(ResultSet rs) throws SQLException {
        Timestamp read = rs.getTimestamp("read_at");
        return new NotificationRow(
                rs.getObject("id", UUID.class),
                rs.getLong("sequence_no"),
                rs.getObject("user_id", UUID.class),
                rs.getObject("source_event_id", UUID.class),
                rs.getString("event_type"),
                rs.getString("title"),
                rs.getString("body"),
                read == null ? null : read.toInstant(),
                rs.getTimestamp("created_at").toInstant());
    }

    public record NotificationRow(UUID id, long sequenceNo, UUID userId,
                                  UUID sourceEventId, String eventType,
                                  String title, String body, Instant readAt,
                                  Instant createdAt) { }
}
