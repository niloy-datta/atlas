package com.atlas.messaging.infrastructure;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.OptionalLong;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class ConsumerEventRepository {
    private final JdbcTemplate jdbc;

    public ConsumerEventRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public boolean tryClaim(String consumerName, UUID eventId, String eventType,
                            UUID aggregateId, Long sequenceNo, Instant processedAt) {
        return jdbc.update("""
                INSERT INTO consumer_processed_events
                    (consumer_name, event_id, event_type, aggregate_id, sequence_no,
                     result, processed_at)
                VALUES (?, ?, ?, ?, ?, 'CLAIMED', ?)
                ON CONFLICT (consumer_name, event_id) DO NOTHING
                """, consumerName, eventId, eventType, aggregateId, sequenceNo,
                Timestamp.from(processedAt)) == 1;
    }

    public OptionalLong lastSequence(String consumerName, UUID aggregateId) {
        Long value = jdbc.query("""
                SELECT last_sequence
                  FROM consumer_aggregate_offsets
                 WHERE consumer_name = ? AND aggregate_id = ?
                """, rs -> rs.next() ? rs.getLong(1) : null, consumerName, aggregateId);
        return value == null ? OptionalLong.empty() : OptionalLong.of(value);
    }

    public void updateOffset(String consumerName, UUID aggregateId, long sequenceNo,
                             UUID eventId, Instant now) {
        jdbc.update("""
                INSERT INTO consumer_aggregate_offsets
                    (consumer_name, aggregate_id, last_sequence, last_event_id, updated_at)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT (consumer_name, aggregate_id) DO UPDATE SET
                    last_sequence = EXCLUDED.last_sequence,
                    last_event_id = EXCLUDED.last_event_id,
                    updated_at = EXCLUDED.updated_at
                WHERE consumer_aggregate_offsets.last_sequence < EXCLUDED.last_sequence
                """, consumerName, aggregateId, sequenceNo, eventId, Timestamp.from(now));
    }

    public void updateResult(String consumerName, UUID eventId, String result, Instant now) {
        jdbc.update("""
                UPDATE consumer_processed_events
                   SET result = ?, processed_at = ?
                 WHERE consumer_name = ? AND event_id = ?
                """, result, Timestamp.from(now), consumerName, eventId);
    }

    public void deadLetter(UUID id, String consumerName, UUID eventId, String eventType,
                           String payload, String error, Instant now) {
        jdbc.update("""
                INSERT INTO consumer_dead_letters
                    (id, consumer_name, event_id, event_type, payload, error, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """, id, consumerName, eventId, eventType, payload, error, Timestamp.from(now));
    }

    public int processedCount(String consumerName, UUID eventId) {
        Integer count = jdbc.queryForObject("""
                SELECT count(*) FROM consumer_processed_events
                 WHERE consumer_name = ? AND event_id = ?
                """, Integer.class, consumerName, eventId);
        return count == null ? 0 : count;
    }

    public int deadLetterCount(String consumerName, UUID eventId) {
        Integer count = jdbc.queryForObject("""
                SELECT count(*) FROM consumer_dead_letters
                 WHERE consumer_name = ? AND event_id = ?
                """, Integer.class, consumerName, eventId);
        return count == null ? 0 : count;
    }
}
