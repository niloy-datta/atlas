package com.atlas.invitation.infrastructure;

import com.atlas.invitation.domain.InvitationDetailView;
import com.atlas.invitation.domain.InvitationRow;
import com.atlas.invitation.domain.InvitationStatus;
import com.atlas.invitation.domain.InvitationSummaryView;
import com.atlas.invitation.domain.InvitationTargetType;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class InvitationRepository {
    private final JdbcTemplate jdbc;

    public InvitationRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void insert(InvitationRow row) {
        jdbc.update("""
                INSERT INTO invitations
                    (id, organization_id, job_id, shift_id, worker_id, sender_id,
                     status, offered_rate_pence, message, expires_at, version, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                row.id(), row.organizationId(), row.jobId(), row.shiftId(),
                row.workerId(), row.senderId(), row.status().name(), row.offeredRatePence(),
                row.message(), Timestamp.from(row.expiresAt()), row.version(),
                Timestamp.from(row.createdAt()), Timestamp.from(row.updatedAt()));
    }

    public Optional<InvitationRow> findById(UUID id) {
        List<InvitationRow> list = jdbc.query("""
                SELECT id, organization_id, job_id, shift_id, worker_id, sender_id,
                       status, offered_rate_pence, message, expires_at, version, created_at, updated_at
                FROM invitations
                WHERE id = ?
                """, (rs, rowNum) -> mapRow(rs), id);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    public Optional<InvitationDetailView> findDetailViewById(UUID id) {
        List<InvitationDetailView> list = jdbc.query("""
                SELECT i.id, i.organization_id, i.job_id, i.shift_id, i.worker_id, i.sender_id,
                       i.status, i.offered_rate_pence, i.message, i.expires_at, i.version, i.created_at, i.updated_at,
                       COALESCE(j.title, s.title, 'Opportunity') AS target_title,
                       COALESCE(w.display_name, u.display_name, 'Verified Worker') AS worker_name
                FROM invitations i
                LEFT JOIN jobs j ON i.job_id = j.id
                LEFT JOIN shifts s ON i.shift_id = s.id
                LEFT JOIN worker_profiles w ON i.worker_id = w.user_id
                LEFT JOIN users u ON i.worker_id = u.id
                WHERE i.id = ?
                """, (rs, rowNum) -> mapDetailView(rs), id);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    public boolean existsPendingByJobAndWorker(UUID jobId, UUID workerId) {
        Integer count = jdbc.queryForObject("""
                SELECT COUNT(*) FROM invitations
                WHERE job_id = ? AND worker_id = ? AND status = 'PENDING'
                """, Integer.class, jobId, workerId);
        return count != null && count > 0;
    }

    public boolean existsPendingByShiftAndWorker(UUID shiftId, UUID workerId) {
        Integer count = jdbc.queryForObject("""
                SELECT COUNT(*) FROM invitations
                WHERE shift_id = ? AND worker_id = ? AND status = 'PENDING'
                """, Integer.class, shiftId, workerId);
        return count != null && count > 0;
    }

    public List<InvitationSummaryView> findByWorker(UUID workerId, int limit, int offset) {
        return jdbc.query("""
                SELECT i.id, i.organization_id, i.job_id, i.shift_id, i.worker_id,
                       i.status, i.offered_rate_pence, i.expires_at, i.version, i.created_at, i.updated_at,
                       COALESCE(j.title, s.title, 'Opportunity') AS target_title,
                       COALESCE(w.display_name, u.display_name, 'Verified Worker') AS worker_name
                FROM invitations i
                LEFT JOIN jobs j ON i.job_id = j.id
                LEFT JOIN shifts s ON i.shift_id = s.id
                LEFT JOIN worker_profiles w ON i.worker_id = w.user_id
                LEFT JOIN users u ON i.worker_id = u.id
                WHERE i.worker_id = ?
                ORDER BY i.created_at DESC
                LIMIT ? OFFSET ?
                """, (rs, rowNum) -> mapSummaryView(rs), workerId, limit, offset);
    }

    public List<InvitationSummaryView> findByOrganization(UUID organizationId, InvitationStatus status, int limit, int offset) {
        String sql = """
                SELECT i.id, i.organization_id, i.job_id, i.shift_id, i.worker_id,
                       i.status, i.offered_rate_pence, i.expires_at, i.version, i.created_at, i.updated_at,
                       COALESCE(j.title, s.title, 'Opportunity') AS target_title,
                       COALESCE(w.display_name, u.display_name, 'Verified Worker') AS worker_name
                FROM invitations i
                LEFT JOIN jobs j ON i.job_id = j.id
                LEFT JOIN shifts s ON i.shift_id = s.id
                LEFT JOIN worker_profiles w ON i.worker_id = w.user_id
                LEFT JOIN users u ON i.worker_id = u.id
                WHERE i.organization_id = ?
                """ + (status != null ? " AND i.status = ? " : "") + """
                ORDER BY i.created_at DESC
                LIMIT ? OFFSET ?
                """;

        List<Object> params = new ArrayList<>();
        params.add(organizationId);
        if (status != null) {
            params.add(status.name());
        }
        params.add(limit);
        params.add(offset);

        return jdbc.query(sql, (rs, rowNum) -> mapSummaryView(rs), params.toArray());
    }

    public boolean transitionStatus(UUID id, InvitationStatus expectedStatus, InvitationStatus newStatus, long expectedVersion, Instant updatedAt) {
        int updated = jdbc.update("""
                UPDATE invitations
                SET status = ?, version = version + 1, updated_at = ?
                WHERE id = ? AND status = ? AND version = ?
                """, newStatus.name(), Timestamp.from(updatedAt), id, expectedStatus.name(), expectedVersion);
        return updated > 0;
    }

    public int expireStalePending(Instant now) {
        return jdbc.update("""
                UPDATE invitations
                SET status = 'EXPIRED', version = version + 1, updated_at = ?
                WHERE status = 'PENDING' AND expires_at <= ?
                """, Timestamp.from(now), Timestamp.from(now));
    }

    private InvitationRow mapRow(ResultSet rs) throws SQLException {
        UUID jobId = rs.getObject("job_id", UUID.class);
        UUID shiftId = rs.getObject("shift_id", UUID.class);
        return new InvitationRow(
                rs.getObject("id", UUID.class),
                rs.getObject("organization_id", UUID.class),
                jobId,
                shiftId,
                rs.getObject("worker_id", UUID.class),
                rs.getObject("sender_id", UUID.class),
                InvitationStatus.valueOf(rs.getString("status")),
                rs.getObject("offered_rate_pence", Long.class),
                rs.getString("message"),
                rs.getTimestamp("expires_at").toInstant(),
                rs.getLong("version"),
                rs.getTimestamp("created_at").toInstant(),
                rs.getTimestamp("updated_at").toInstant()
        );
    }

    private InvitationSummaryView mapSummaryView(ResultSet rs) throws SQLException {
        UUID jobId = rs.getObject("job_id", UUID.class);
        UUID shiftId = rs.getObject("shift_id", UUID.class);
        InvitationTargetType targetType = jobId != null ? InvitationTargetType.JOB : InvitationTargetType.SHIFT;
        UUID targetId = jobId != null ? jobId : shiftId;

        return new InvitationSummaryView(
                rs.getObject("id", UUID.class),
                rs.getObject("organization_id", UUID.class),
                targetType,
                targetId,
                rs.getString("target_title"),
                rs.getObject("worker_id", UUID.class),
                rs.getString("worker_name"),
                InvitationStatus.valueOf(rs.getString("status")),
                rs.getObject("offered_rate_pence", Long.class),
                rs.getTimestamp("expires_at").toInstant(),
                rs.getLong("version"),
                rs.getTimestamp("created_at").toInstant(),
                rs.getTimestamp("updated_at").toInstant()
        );
    }

    private InvitationDetailView mapDetailView(ResultSet rs) throws SQLException {
        UUID jobId = rs.getObject("job_id", UUID.class);
        UUID shiftId = rs.getObject("shift_id", UUID.class);
        InvitationTargetType targetType = jobId != null ? InvitationTargetType.JOB : InvitationTargetType.SHIFT;
        UUID targetId = jobId != null ? jobId : shiftId;

        return new InvitationDetailView(
                rs.getObject("id", UUID.class),
                rs.getObject("organization_id", UUID.class),
                targetType,
                targetId,
                rs.getString("target_title"),
                rs.getObject("worker_id", UUID.class),
                rs.getString("worker_name"),
                rs.getObject("sender_id", UUID.class),
                InvitationStatus.valueOf(rs.getString("status")),
                rs.getObject("offered_rate_pence", Long.class),
                rs.getString("message"),
                rs.getTimestamp("expires_at").toInstant(),
                rs.getLong("version"),
                rs.getTimestamp("created_at").toInstant(),
                rs.getTimestamp("updated_at").toInstant()
        );
    }
}
