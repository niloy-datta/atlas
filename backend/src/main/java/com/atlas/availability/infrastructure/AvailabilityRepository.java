package com.atlas.availability.infrastructure;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class AvailabilityRepository {
    private final JdbcTemplate jdbc;

    public AvailabilityRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public boolean workerExists(UUID workerUserId) {
        Integer count = jdbc.queryForObject(
                "SELECT count(*) FROM worker_profiles WHERE user_id = ?", Integer.class, workerUserId);
        return count != null && count > 0;
    }

    public void insertRule(RuleRow row) {
        jdbc.update("""
                INSERT INTO worker_availability_rules
                    (id, worker_user_id, day_of_week, start_local, end_local, timezone,
                     valid_from, valid_until, version, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, row.id(), row.workerUserId(), row.dayOfWeek(), row.startLocal(), row.endLocal(),
                row.timezone(), row.validFrom(), row.validUntil(), row.version(),
                Timestamp.from(row.createdAt()), Timestamp.from(row.updatedAt()));
    }

    public List<RuleRow> rules(UUID workerUserId) {
        return jdbc.query("""
                SELECT id, worker_user_id, day_of_week, start_local, end_local, timezone,
                       valid_from, valid_until, version, created_at, updated_at
                  FROM worker_availability_rules
                 WHERE worker_user_id = ?
                 ORDER BY day_of_week, start_local, id
                """, (rs, n) -> mapRule(rs), workerUserId);
    }

    public Optional<RuleRow> findRule(UUID workerUserId, UUID ruleId) {
        return jdbc.query("""
                SELECT id, worker_user_id, day_of_week, start_local, end_local, timezone,
                       valid_from, valid_until, version, created_at, updated_at
                  FROM worker_availability_rules
                 WHERE worker_user_id = ? AND id = ?
                """, (rs, n) -> mapRule(rs), workerUserId, ruleId).stream().findFirst();
    }

    public int updateRule(UUID workerUserId, UUID ruleId, long version, int dayOfWeek,
                          LocalTime startLocal, LocalTime endLocal, String timezone,
                          LocalDate validFrom, LocalDate validUntil, Instant now) {
        return jdbc.update("""
                UPDATE worker_availability_rules
                   SET day_of_week = ?, start_local = ?, end_local = ?, timezone = ?,
                       valid_from = ?, valid_until = ?, version = version + 1, updated_at = ?
                 WHERE worker_user_id = ? AND id = ? AND version = ?
                """, dayOfWeek, startLocal, endLocal, timezone, validFrom, validUntil,
                Timestamp.from(now), workerUserId, ruleId, version);
    }

    public int deleteRule(UUID workerUserId, UUID ruleId) {
        return jdbc.update("""
                DELETE FROM worker_availability_rules
                 WHERE worker_user_id = ? AND id = ?
                """, workerUserId, ruleId);
    }

    public List<RuleRow> rulesForDate(UUID workerUserId, LocalDate date) {
        return jdbc.query("""
                SELECT id, worker_user_id, day_of_week, start_local, end_local, timezone,
                       valid_from, valid_until, version, created_at, updated_at
                  FROM worker_availability_rules
                 WHERE worker_user_id = ?
                   AND day_of_week = ?
                   AND (valid_from IS NULL OR valid_from <= ?)
                   AND (valid_until IS NULL OR valid_until >= ?)
                 ORDER BY start_local, id
                """, (rs, n) -> mapRule(rs), workerUserId, date.getDayOfWeek().getValue(), date, date);
    }

    public void insertOverride(OverrideRow row) {
        jdbc.update("""
                INSERT INTO worker_availability_overrides
                    (id, worker_user_id, override_date, override_type, start_local, end_local,
                     timezone, note, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, row.id(), row.workerUserId(), row.date(), row.type(), row.startLocal(),
                row.endLocal(), row.timezone(), row.note(), Timestamp.from(row.createdAt()));
    }

    public List<OverrideRow> overrides(UUID workerUserId, LocalDate from, LocalDate until) {
        return jdbc.query("""
                SELECT id, worker_user_id, override_date, override_type, start_local, end_local,
                       timezone, note, created_at
                  FROM worker_availability_overrides
                 WHERE worker_user_id = ? AND override_date BETWEEN ? AND ?
                 ORDER BY override_date, start_local NULLS FIRST, id
                """, (rs, n) -> mapOverride(rs), workerUserId, from, until);
    }

    public List<OverrideRow> overridesForDate(UUID workerUserId, LocalDate date) {
        return jdbc.query("""
                SELECT id, worker_user_id, override_date, override_type, start_local, end_local,
                       timezone, note, created_at
                  FROM worker_availability_overrides
                 WHERE worker_user_id = ? AND override_date = ?
                 ORDER BY start_local NULLS FIRST, id
                """, (rs, n) -> mapOverride(rs), workerUserId, date);
    }

    public int deleteOverride(UUID workerUserId, UUID overrideId) {
        return jdbc.update("""
                DELETE FROM worker_availability_overrides
                 WHERE worker_user_id = ? AND id = ?
                """, workerUserId, overrideId);
    }

    private static RuleRow mapRule(ResultSet rs) throws SQLException {
        return new RuleRow(
                rs.getObject("id", UUID.class),
                rs.getObject("worker_user_id", UUID.class),
                rs.getInt("day_of_week"),
                rs.getObject("start_local", LocalTime.class),
                rs.getObject("end_local", LocalTime.class),
                rs.getString("timezone"),
                rs.getObject("valid_from", LocalDate.class),
                rs.getObject("valid_until", LocalDate.class),
                rs.getLong("version"),
                rs.getTimestamp("created_at").toInstant(),
                rs.getTimestamp("updated_at").toInstant());
    }

    private static OverrideRow mapOverride(ResultSet rs) throws SQLException {
        return new OverrideRow(
                rs.getObject("id", UUID.class),
                rs.getObject("worker_user_id", UUID.class),
                rs.getObject("override_date", LocalDate.class),
                rs.getString("override_type"),
                rs.getObject("start_local", LocalTime.class),
                rs.getObject("end_local", LocalTime.class),
                rs.getString("timezone"),
                rs.getString("note"),
                rs.getTimestamp("created_at").toInstant());
    }

    public record RuleRow(UUID id, UUID workerUserId, int dayOfWeek, LocalTime startLocal,
                          LocalTime endLocal, String timezone, LocalDate validFrom,
                          LocalDate validUntil, long version, Instant createdAt, Instant updatedAt) { }

    public record OverrideRow(UUID id, UUID workerUserId, LocalDate date, String type,
                              LocalTime startLocal, LocalTime endLocal, String timezone,
                              String note, Instant createdAt) { }
}
