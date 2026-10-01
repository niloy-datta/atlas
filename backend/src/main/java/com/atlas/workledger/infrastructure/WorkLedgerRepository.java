package com.atlas.workledger.infrastructure;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class WorkLedgerRepository {
    private final JdbcTemplate jdbc;

    public WorkLedgerRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public LedgerEntry append(UUID id, UUID workerUserId, UUID organizationId,
                              UUID shiftId, UUID reservationId, String eventType,
                              Instant occurredAt, String metadataJson, Instant createdAt) {
        return jdbc.queryForObject("""
                INSERT INTO work_ledger_entries
                    (id, worker_user_id, organization_id, shift_id, reservation_id,
                     event_type, occurred_at, metadata, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?::jsonb, ?)
                RETURNING id, sequence_no, worker_user_id, organization_id, shift_id,
                          reservation_id, event_type, occurred_at, metadata::text, created_at
                """, (rs, n) -> map(rs),
                id, workerUserId, organizationId, shiftId, reservationId, eventType,
                Timestamp.from(occurredAt), metadataJson, Timestamp.from(createdAt));
    }

    public List<LedgerEntry> listForWorker(UUID workerUserId, int limit) {
        return jdbc.query("""
                SELECT id, sequence_no, worker_user_id, organization_id, shift_id,
                       reservation_id, event_type, occurred_at, metadata::text, created_at
                  FROM work_ledger_entries
                 WHERE worker_user_id = ?
                 ORDER BY sequence_no DESC
                 LIMIT ?
                """, (rs, n) -> map(rs), workerUserId, limit);
    }

    public WorkerProjection projection(UUID workerUserId) {
        return jdbc.queryForObject("""
                SELECT
                    count(*) FILTER (WHERE event_type = 'RESERVATION_CONFIRMED')::int AS confirmed,
                    count(*) FILTER (WHERE event_type = 'RESERVATION_CANCELLED')::int AS cancelled,
                    count(*) FILTER (WHERE event_type = 'SHIFT_COMPLETED')::int AS completed,
                    max(occurred_at) AS last_activity
                  FROM work_ledger_entries
                 WHERE worker_user_id = ?
                """, (rs, n) -> new WorkerProjection(
                rs.getInt("confirmed"),
                rs.getInt("cancelled"),
                rs.getInt("completed"),
                rs.getTimestamp("last_activity") == null ? null : rs.getTimestamp("last_activity").toInstant()),
                workerUserId);
    }

    private static LedgerEntry map(ResultSet rs) throws SQLException {
        return new LedgerEntry(
                rs.getObject("id", UUID.class),
                rs.getLong("sequence_no"),
                rs.getObject("worker_user_id", UUID.class),
                rs.getObject("organization_id", UUID.class),
                rs.getObject("shift_id", UUID.class),
                rs.getObject("reservation_id", UUID.class),
                rs.getString("event_type"),
                rs.getTimestamp("occurred_at").toInstant(),
                rs.getString("metadata"),
                rs.getTimestamp("created_at").toInstant());
    }

    public record LedgerEntry(UUID id, long sequenceNo, UUID workerUserId, UUID organizationId,
                              UUID shiftId, UUID reservationId, String eventType,
                              Instant occurredAt, String metadata, Instant createdAt) { }

    public record WorkerProjection(int confirmedReservations, int cancelledReservations,
                                   int completedShifts, Instant lastActivityAt) { }
}
