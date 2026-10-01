package com.atlas.outbox.infrastructure;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class OutboxRepository {
    private final JdbcTemplate jdbc;

    public OutboxRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void append(OutboxEvent event) {
        jdbc.update("""
                INSERT INTO outbox_events
                    (id, aggregate_type, aggregate_id, sequence_no, event_type, payload,
                     occurred_at, created_at, published_at, attempts, last_error)
                VALUES (?, ?, ?, ?, ?, ?::jsonb, ?, ?, NULL, 0, NULL)
                """, event.id(), event.aggregateType(), event.aggregateId(), event.sequenceNo(),
                event.eventType(), event.payload(),
                Timestamp.from(event.occurredAt()), Timestamp.from(event.createdAt()));
    }

    public List<OutboxEvent> pending(int limit) {
        return jdbc.query("""
                SELECT id, aggregate_type, aggregate_id, sequence_no, event_type, payload::text,
                       occurred_at, created_at, published_at, attempts, last_error
                  FROM outbox_events
                 WHERE published_at IS NULL
                 ORDER BY created_at, id
                 LIMIT ?
                """, (rs, n) -> map(rs), limit);
    }

    public int markPublished(UUID id, Instant publishedAt) {
        return jdbc.update("""
                UPDATE outbox_events
                   SET published_at = ?, attempts = attempts + 1, last_error = NULL
                 WHERE id = ? AND published_at IS NULL
                """, Timestamp.from(publishedAt), id);
    }

    public int markFailed(UUID id, String error) {
        return jdbc.update("""
                UPDATE outbox_events
                   SET attempts = attempts + 1, last_error = ?
                 WHERE id = ? AND published_at IS NULL
                """, error, id);
    }

    public long pendingCount() {
        Long count = jdbc.queryForObject(
                "SELECT count(*) FROM outbox_events WHERE published_at IS NULL",
                Long.class);
        return count == null ? 0L : count;
    }

    private static OutboxEvent map(ResultSet rs) throws SQLException {
        Timestamp published = rs.getTimestamp("published_at");
        Number sequence = (Number) rs.getObject("sequence_no");
        return new OutboxEvent(
                rs.getObject("id", UUID.class),
                rs.getString("aggregate_type"),
                rs.getObject("aggregate_id", UUID.class),
                sequence == null ? null : sequence.longValue(),
                rs.getString("event_type"),
                rs.getString("payload"),
                rs.getTimestamp("occurred_at").toInstant(),
                rs.getTimestamp("created_at").toInstant(),
                published == null ? null : published.toInstant(),
                rs.getInt("attempts"),
                rs.getString("last_error"));
    }

    public record OutboxEvent(UUID id, String aggregateType, UUID aggregateId,
                              Long sequenceNo, String eventType, String payload,
                              Instant occurredAt, Instant createdAt, Instant publishedAt,
                              int attempts, String lastError) { }
}
