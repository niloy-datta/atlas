package com.atlas.reservation.infrastructure;

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
public class ReservationRepository {
    private final JdbcTemplate jdbc;

    public ReservationRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<LockedShift> lockShift(UUID organizationId, UUID shiftId) {
        return jdbc.query("""
                SELECT id, organization_id, capacity, status
                  FROM shifts
                 WHERE organization_id = ? AND id = ?
                 FOR UPDATE
                """, (rs, n) -> new LockedShift(
                rs.getObject("id", UUID.class),
                rs.getObject("organization_id", UUID.class),
                rs.getInt("capacity"),
                rs.getString("status")), organizationId, shiftId).stream().findFirst();
    }

    public int activeCount(UUID shiftId) {
        Integer count = jdbc.queryForObject("""
                SELECT count(*) FROM shift_reservations
                 WHERE shift_id = ? AND status = 'CONFIRMED'
                """, Integer.class, shiftId);
        return count == null ? 0 : count;
    }

    public boolean activeExists(UUID shiftId, UUID workerUserId) {
        Integer count = jdbc.queryForObject("""
                SELECT count(*) FROM shift_reservations
                 WHERE shift_id = ? AND worker_user_id = ? AND status = 'CONFIRMED'
                """, Integer.class, shiftId, workerUserId);
        return count != null && count > 0;
    }

    public boolean workerExists(UUID workerUserId) {
        Integer count = jdbc.queryForObject("""
                SELECT count(*) FROM worker_profiles WHERE user_id = ?
                """, Integer.class, workerUserId);
        return count != null && count > 0;
    }

    public void insert(ReservationRow row) {
        jdbc.update("""
                INSERT INTO shift_reservations
                    (id, shift_id, organization_id, worker_user_id, status, version,
                     created_by_user_id, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, row.id(), row.shiftId(), row.organizationId(), row.workerUserId(),
                row.status(), row.version(), row.createdByUserId(),
                Timestamp.from(row.createdAt()), Timestamp.from(row.updatedAt()));
    }

    public List<ReservationRow> list(UUID organizationId, UUID shiftId) {
        return jdbc.query("""
                SELECT id, shift_id, organization_id, worker_user_id, status, version,
                       created_by_user_id, created_at, updated_at
                  FROM shift_reservations
                 WHERE organization_id = ? AND shift_id = ?
                 ORDER BY created_at, id
                """, (rs, n) -> map(rs), organizationId, shiftId);
    }

    public Optional<ReservationRow> find(UUID organizationId, UUID shiftId, UUID reservationId) {
        return jdbc.query("""
                SELECT id, shift_id, organization_id, worker_user_id, status, version,
                       created_by_user_id, created_at, updated_at
                  FROM shift_reservations
                 WHERE organization_id = ? AND id = ?
                """, (rs, n) -> map(rs), organizationId, reservationId).stream().findFirst();
    }

    public int cancel(UUID organizationId, UUID shiftId, UUID reservationId, long version, Instant now) {
        return jdbc.update("""
                UPDATE shift_reservations
                   SET status = 'CANCELLED', version = version + 1, updated_at = ?
                 WHERE organization_id = ? AND id = ? AND status = 'CONFIRMED' AND version = ?
                """, Timestamp.from(now), organizationId, reservationId, version);
    }

    private static ReservationRow map(ResultSet rs) throws SQLException {
        return new ReservationRow(
                rs.getObject("id", UUID.class),
                rs.getObject("shift_id", UUID.class),
                rs.getObject("organization_id", UUID.class),
                rs.getObject("worker_user_id", UUID.class),
                rs.getString("status"),
                rs.getLong("version"),
                rs.getObject("created_by_user_id", UUID.class),
                rs.getTimestamp("created_at").toInstant(),
                rs.getTimestamp("updated_at").toInstant());
    }

    public record LockedShift(UUID id, UUID organizationId, int capacity, String status) { }

    public record ReservationRow(UUID id, UUID shiftId, UUID organizationId, UUID workerUserId,
                                 String status, long version, UUID createdByUserId,
                                 Instant createdAt, Instant updatedAt) { }
}
