package com.atlas.shared.idempotency;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class IdempotencyRepository {
    private final JdbcTemplate jdbc;

    public IdempotencyRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public boolean tryClaim(UUID id, UUID actorUserId, String operation, String key,
                            String requestHash, Instant now, Instant expiresAt) {
        return jdbc.update("""
                INSERT INTO idempotency_records
                    (id, actor_user_id, operation, idempotency_key, request_hash,
                     state, response_body, created_at, updated_at, expires_at)
                VALUES (?, ?, ?, ?, ?, 'IN_PROGRESS', NULL, ?, ?, ?)
                ON CONFLICT (actor_user_id, operation, idempotency_key) DO NOTHING
                """, id, actorUserId, operation, key, requestHash,
                Timestamp.from(now), Timestamp.from(now), Timestamp.from(expiresAt)) == 1;
    }

    public Optional<RecordRow> findForUpdate(UUID actorUserId, String operation, String key) {
        return jdbc.query("""
                SELECT id, actor_user_id, operation, idempotency_key, request_hash,
                       state, response_body::text AS response_body, created_at, updated_at, expires_at
                  FROM idempotency_records
                 WHERE actor_user_id = ? AND operation = ? AND idempotency_key = ?
                 FOR UPDATE
                """, (rs, n) -> new RecordRow(
                rs.getObject("id", UUID.class),
                rs.getObject("actor_user_id", UUID.class),
                rs.getString("operation"),
                rs.getString("idempotency_key"),
                rs.getString("request_hash"),
                rs.getString("state"),
                rs.getString("response_body"),
                rs.getTimestamp("created_at").toInstant(),
                rs.getTimestamp("updated_at").toInstant(),
                rs.getTimestamp("expires_at").toInstant()),
                actorUserId, operation, key).stream().findFirst();
    }

    public void complete(UUID id, String responseJson, Instant now) {
        jdbc.update("""
                UPDATE idempotency_records
                   SET state = 'COMPLETED', response_body = ?::jsonb, updated_at = ?
                 WHERE id = ? AND state = 'IN_PROGRESS'
                """, responseJson, Timestamp.from(now), id);
    }

    public record RecordRow(UUID id, UUID actorUserId, String operation, String key,
                            String requestHash, String state, String responseBody,
                            Instant createdAt, Instant updatedAt, Instant expiresAt) { }
}
