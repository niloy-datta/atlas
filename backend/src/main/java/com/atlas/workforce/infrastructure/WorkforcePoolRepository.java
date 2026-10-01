package com.atlas.workforce.infrastructure;

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
public class WorkforcePoolRepository {
    private final JdbcTemplate jdbc;

    public WorkforcePoolRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void insert(PoolRow pool) {
        jdbc.update("""
                INSERT INTO workforce_pools
                    (id, organization_id, name, description, version, created_by_user_id, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, pool.id(), pool.organizationId(), pool.name(), pool.description(), pool.version(),
                pool.createdByUserId(), Timestamp.from(pool.createdAt()), Timestamp.from(pool.updatedAt()));
    }

    public List<PoolRow> list(UUID organizationId) {
        return jdbc.query("""
                SELECT id, organization_id, name, description, version, created_by_user_id, created_at, updated_at
                  FROM workforce_pools
                 WHERE organization_id = ?
                 ORDER BY created_at DESC, id
                """, (rs, rowNum) -> mapPool(rs), organizationId);
    }

    public Optional<PoolRow> find(UUID organizationId, UUID poolId) {
        return jdbc.query("""
                SELECT id, organization_id, name, description, version, created_by_user_id, created_at, updated_at
                  FROM workforce_pools
                 WHERE organization_id = ? AND id = ?
                """, (rs, rowNum) -> mapPool(rs), organizationId, poolId).stream().findFirst();
    }

    public int update(UUID organizationId, UUID poolId, long expectedVersion,
                      String name, String description, Instant now) {
        return jdbc.update("""
                UPDATE workforce_pools
                   SET name = ?, description = ?, version = version + 1, updated_at = ?
                 WHERE organization_id = ? AND id = ? AND version = ?
                """, name, description, Timestamp.from(now), organizationId, poolId, expectedVersion);
    }

    public int delete(UUID organizationId, UUID poolId) {
        return jdbc.update("""
                DELETE FROM workforce_pools
                 WHERE organization_id = ? AND id = ?
                """, organizationId, poolId);
    }

    public Optional<WorkerRow> findWorker(UUID workerUserId) {
        return jdbc.query("""
                SELECT p.user_id, p.id AS worker_profile_id, p.full_name, p.public_handle,
                       p.headline, p.visibility
                  FROM worker_profiles p
                 WHERE p.user_id = ?
                """, (rs, rowNum) -> new WorkerRow(
                rs.getObject("user_id", UUID.class),
                rs.getObject("worker_profile_id", UUID.class),
                rs.getString("full_name"),
                rs.getString("public_handle"),
                rs.getString("headline"),
                rs.getString("visibility")), workerUserId).stream().findFirst();
    }

    public void addMember(UUID organizationId, UUID poolId, UUID workerUserId,
                          UUID addedByUserId, String note, Instant now) {
        jdbc.update("""
                INSERT INTO workforce_pool_members
                    (pool_id, organization_id, worker_user_id, added_by_user_id, note, added_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """, poolId, organizationId, workerUserId, addedByUserId, note, Timestamp.from(now));
    }

    public List<MemberRow> members(UUID organizationId, UUID poolId) {
        return jdbc.query("""
                SELECT m.worker_user_id, p.id AS worker_profile_id, p.full_name, p.public_handle,
                       p.headline, p.visibility, m.note, m.added_by_user_id, m.added_at
                  FROM workforce_pool_members m
                  JOIN worker_profiles p ON p.user_id = m.worker_user_id
                 WHERE m.organization_id = ? AND m.pool_id = ?
                 ORDER BY m.added_at DESC, m.worker_user_id
                """, (rs, rowNum) -> new MemberRow(
                rs.getObject("worker_user_id", UUID.class),
                rs.getObject("worker_profile_id", UUID.class),
                rs.getString("full_name"),
                rs.getString("public_handle"),
                rs.getString("headline"),
                rs.getString("visibility"),
                rs.getString("note"),
                rs.getObject("added_by_user_id", UUID.class),
                rs.getTimestamp("added_at").toInstant()), organizationId, poolId);
    }

    public int removeMember(UUID organizationId, UUID poolId, UUID workerUserId) {
        return jdbc.update("""
                DELETE FROM workforce_pool_members
                 WHERE organization_id = ? AND pool_id = ? AND worker_user_id = ?
                """, organizationId, poolId, workerUserId);
    }

    private static PoolRow mapPool(ResultSet rs) throws SQLException {
        return new PoolRow(
                rs.getObject("id", UUID.class),
                rs.getObject("organization_id", UUID.class),
                rs.getString("name"),
                rs.getString("description"),
                rs.getLong("version"),
                rs.getObject("created_by_user_id", UUID.class),
                rs.getTimestamp("created_at").toInstant(),
                rs.getTimestamp("updated_at").toInstant());
    }

    public record PoolRow(UUID id, UUID organizationId, String name, String description,
                          long version, UUID createdByUserId, Instant createdAt, Instant updatedAt) { }

    public record WorkerRow(UUID workerUserId, UUID workerProfileId, String fullName,
                            String publicHandle, String headline, String visibility) { }

    public record MemberRow(UUID workerUserId, UUID workerProfileId, String fullName,
                            String publicHandle, String headline, String visibility,
                            String note, UUID addedByUserId, Instant addedAt) { }
}
