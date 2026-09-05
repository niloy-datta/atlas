package com.atlas.application.infrastructure;

import com.atlas.application.domain.ApplicationDetailView;
import com.atlas.application.domain.ApplicationRow;
import com.atlas.application.domain.ApplicationStatus;
import com.atlas.application.domain.ApplicationSummaryView;
import com.atlas.application.domain.ApplicationTargetType;
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
public class ApplicationRepository {
    private final JdbcTemplate jdbc;

    public ApplicationRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void insert(ApplicationRow row) {
        jdbc.update("""
                INSERT INTO applications
                    (id, organization_id, job_id, shift_id, worker_id, status,
                     cover_note, proposed_rate_pence, version, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                row.id(), row.organizationId(), row.jobId(), row.shiftId(), row.workerId(),
                row.status().name(), row.coverNote(), row.proposedRatePence(),
                row.version(), Timestamp.from(row.createdAt()), Timestamp.from(row.updatedAt()));
    }

    public Optional<ApplicationRow> findById(UUID id) {
        List<ApplicationRow> list = jdbc.query("""
                SELECT id, organization_id, job_id, shift_id, worker_id, status,
                       cover_note, proposed_rate_pence, version, created_at, updated_at
                FROM applications
                WHERE id = ?
                """, (rs, rowNum) -> mapRow(rs), id);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    public Optional<ApplicationDetailView> findDetailViewById(UUID id) {
        List<ApplicationDetailView> list = jdbc.query("""
                SELECT a.id, a.organization_id, a.job_id, a.shift_id, a.worker_id, a.status,
                       a.cover_note, a.proposed_rate_pence, a.version, a.created_at, a.updated_at,
                       COALESCE(j.title, s.title, 'Opportunity') AS target_title,
                       COALESCE(w.display_name, u.display_name, 'Verified Worker') AS worker_name
                FROM applications a
                LEFT JOIN jobs j ON a.job_id = j.id
                LEFT JOIN shifts s ON a.shift_id = s.id
                LEFT JOIN worker_profiles w ON a.worker_id = w.user_id
                LEFT JOIN users u ON a.worker_id = u.id
                WHERE a.id = ?
                """, (rs, rowNum) -> mapDetailView(rs), id);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    public boolean existsByJobAndWorker(UUID jobId, UUID workerId) {
        Integer count = jdbc.queryForObject("""
                SELECT COUNT(*) FROM applications
                WHERE job_id = ? AND worker_id = ?
                """, Integer.class, jobId, workerId);
        return count != null && count > 0;
    }

    public boolean existsByShiftAndWorker(UUID shiftId, UUID workerId) {
        Integer count = jdbc.queryForObject("""
                SELECT COUNT(*) FROM applications
                WHERE shift_id = ? AND worker_id = ?
                """, Integer.class, shiftId, workerId);
        return count != null && count > 0;
    }

    public List<ApplicationSummaryView> findByWorker(UUID workerId, int limit, int offset) {
        return jdbc.query("""
                SELECT a.id, a.organization_id, a.job_id, a.shift_id, a.worker_id, a.status,
                       a.proposed_rate_pence, a.version, a.created_at, a.updated_at,
                       COALESCE(j.title, s.title, 'Opportunity') AS target_title,
                       COALESCE(w.display_name, u.display_name, 'Verified Worker') AS worker_name
                FROM applications a
                LEFT JOIN jobs j ON a.job_id = j.id
                LEFT JOIN shifts s ON a.shift_id = s.id
                LEFT JOIN worker_profiles w ON a.worker_id = w.user_id
                LEFT JOIN users u ON a.worker_id = u.id
                WHERE a.worker_id = ?
                ORDER BY a.created_at DESC
                LIMIT ? OFFSET ?
                """, (rs, rowNum) -> mapSummaryView(rs), workerId, limit, offset);
    }

    public List<ApplicationSummaryView> findByOrganization(UUID organizationId, ApplicationStatus status, int limit, int offset) {
        String sql = """
                SELECT a.id, a.organization_id, a.job_id, a.shift_id, a.worker_id, a.status,
                       a.proposed_rate_pence, a.version, a.created_at, a.updated_at,
                       COALESCE(j.title, s.title, 'Opportunity') AS target_title,
                       COALESCE(w.display_name, u.display_name, 'Verified Worker') AS worker_name
                FROM applications a
                LEFT JOIN jobs j ON a.job_id = j.id
                LEFT JOIN shifts s ON a.shift_id = s.id
                LEFT JOIN worker_profiles w ON a.worker_id = w.user_id
                LEFT JOIN users u ON a.worker_id = u.id
                WHERE a.organization_id = ?
                """ + (status != null ? " AND a.status = ? " : "") + """
                ORDER BY a.created_at DESC
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

    public List<ApplicationSummaryView> findByJob(UUID jobId, int limit, int offset) {
        return jdbc.query("""
                SELECT a.id, a.organization_id, a.job_id, a.shift_id, a.worker_id, a.status,
                       a.proposed_rate_pence, a.version, a.created_at, a.updated_at,
                       COALESCE(j.title, 'Job') AS target_title,
                       COALESCE(w.display_name, u.display_name, 'Verified Worker') AS worker_name
                FROM applications a
                LEFT JOIN jobs j ON a.job_id = j.id
                LEFT JOIN worker_profiles w ON a.worker_id = w.user_id
                LEFT JOIN users u ON a.worker_id = u.id
                WHERE a.job_id = ?
                ORDER BY a.created_at DESC
                LIMIT ? OFFSET ?
                """, (rs, rowNum) -> mapSummaryView(rs), jobId, limit, offset);
    }

    public List<ApplicationSummaryView> findByShift(UUID shiftId, int limit, int offset) {
        return jdbc.query("""
                SELECT a.id, a.organization_id, a.job_id, a.shift_id, a.worker_id, a.status,
                       a.proposed_rate_pence, a.version, a.created_at, a.updated_at,
                       COALESCE(s.title, 'Shift') AS target_title,
                       COALESCE(w.display_name, u.display_name, 'Verified Worker') AS worker_name
                FROM applications a
                LEFT JOIN shifts s ON a.shift_id = s.id
                LEFT JOIN worker_profiles w ON a.worker_id = w.user_id
                LEFT JOIN users u ON a.worker_id = u.id
                WHERE a.shift_id = ?
                ORDER BY a.created_at DESC
                LIMIT ? OFFSET ?
                """, (rs, rowNum) -> mapSummaryView(rs), shiftId, limit, offset);
    }

    public boolean transitionStatus(UUID id, ApplicationStatus expectedStatus, ApplicationStatus newStatus, long expectedVersion, Instant updatedAt) {
        int updated = jdbc.update("""
                UPDATE applications
                SET status = ?, version = version + 1, updated_at = ?
                WHERE id = ? AND status = ? AND version = ?
                """, newStatus.name(), Timestamp.from(updatedAt), id, expectedStatus.name(), expectedVersion);
        return updated > 0;
    }

    private ApplicationRow mapRow(ResultSet rs) throws SQLException {
        UUID jobId = rs.getObject("job_id", UUID.class);
        UUID shiftId = rs.getObject("shift_id", UUID.class);
        return new ApplicationRow(
                rs.getObject("id", UUID.class),
                rs.getObject("organization_id", UUID.class),
                jobId,
                shiftId,
                rs.getObject("worker_id", UUID.class),
                ApplicationStatus.valueOf(rs.getString("status")),
                rs.getString("cover_note"),
                rs.getObject("proposed_rate_pence", Long.class),
                rs.getLong("version"),
                rs.getTimestamp("created_at").toInstant(),
                rs.getTimestamp("updated_at").toInstant()
        );
    }

    private ApplicationSummaryView mapSummaryView(ResultSet rs) throws SQLException {
        UUID jobId = rs.getObject("job_id", UUID.class);
        UUID shiftId = rs.getObject("shift_id", UUID.class);
        ApplicationTargetType targetType = jobId != null ? ApplicationTargetType.JOB : ApplicationTargetType.SHIFT;
        UUID targetId = jobId != null ? jobId : shiftId;

        return new ApplicationSummaryView(
                rs.getObject("id", UUID.class),
                rs.getObject("organization_id", UUID.class),
                targetType,
                targetId,
                rs.getString("target_title"),
                rs.getObject("worker_id", UUID.class),
                rs.getString("worker_name"),
                ApplicationStatus.valueOf(rs.getString("status")),
                rs.getObject("proposed_rate_pence", Long.class),
                rs.getLong("version"),
                rs.getTimestamp("created_at").toInstant(),
                rs.getTimestamp("updated_at").toInstant()
        );
    }

    private ApplicationDetailView mapDetailView(ResultSet rs) throws SQLException {
        UUID jobId = rs.getObject("job_id", UUID.class);
        UUID shiftId = rs.getObject("shift_id", UUID.class);
        ApplicationTargetType targetType = jobId != null ? ApplicationTargetType.JOB : ApplicationTargetType.SHIFT;
        UUID targetId = jobId != null ? jobId : shiftId;

        return new ApplicationDetailView(
                rs.getObject("id", UUID.class),
                rs.getObject("organization_id", UUID.class),
                targetType,
                targetId,
                rs.getString("target_title"),
                rs.getObject("worker_id", UUID.class),
                rs.getString("worker_name"),
                ApplicationStatus.valueOf(rs.getString("status")),
                rs.getString("cover_note"),
                rs.getObject("proposed_rate_pence", Long.class),
                rs.getLong("version"),
                rs.getTimestamp("created_at").toInstant(),
                rs.getTimestamp("updated_at").toInstant()
        );
    }
}
