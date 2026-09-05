package com.atlas.job.infrastructure;

import com.atlas.job.domain.JobCredentialRequirement;
import com.atlas.job.domain.JobDetailView;
import com.atlas.job.domain.JobRow;
import com.atlas.job.domain.JobSkillRequirement;
import com.atlas.job.domain.JobStatus;
import com.atlas.job.domain.JobSummaryView;
import com.atlas.job.domain.JobType;
import com.atlas.skill.domain.SkillProficiency;
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
public class JobRepository {
    private final JdbcTemplate jdbc;

    public JobRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void insert(JobRow job) {
        Double lon = job.longitude();
        Double lat = job.latitude();
        if (lon != null && lat != null) {
            jdbc.update("""
                    INSERT INTO jobs
                        (id, organization_id, title, description, job_type, status,
                         location_name, formatted_address, location,
                         budget_min_pence, budget_max_pence, currency, version, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?,
                            ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography,
                            ?, ?, ?, 0, ?, ?)
                    """,
                    job.id(), job.organizationId(), job.title(), job.description(),
                    job.jobType().name(), job.status().name(),
                    job.locationName(), job.formattedAddress(),
                    lon, lat,
                    job.budgetMinPence(), job.budgetMaxPence(), job.currency(),
                    Timestamp.from(job.createdAt()), Timestamp.from(job.updatedAt()));
        } else {
            jdbc.update("""
                    INSERT INTO jobs
                        (id, organization_id, title, description, job_type, status,
                         location_name, formatted_address, location,
                         budget_min_pence, budget_max_pence, currency, version, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, 0, ?, ?)
                    """,
                    job.id(), job.organizationId(), job.title(), job.description(),
                    job.jobType().name(), job.status().name(),
                    job.locationName(), job.formattedAddress(),
                    job.budgetMinPence(), job.budgetMaxPence(), job.currency(),
                    Timestamp.from(job.createdAt()), Timestamp.from(job.updatedAt()));
        }
    }

    public int updateDraft(JobRow job, long expectedVersion, Instant now) {
        Double lon = job.longitude();
        Double lat = job.latitude();
        if (lon != null && lat != null) {
            return jdbc.update("""
                    UPDATE jobs
                       SET title = ?, description = ?, job_type = ?,
                           location_name = ?, formatted_address = ?,
                           location = ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography,
                           budget_min_pence = ?, budget_max_pence = ?, currency = ?,
                           version = version + 1, updated_at = ?
                     WHERE id = ? AND organization_id = ? AND status = 'DRAFT' AND version = ?
                    """,
                    job.title(), job.description(), job.jobType().name(),
                    job.locationName(), job.formattedAddress(),
                    lon, lat,
                    job.budgetMinPence(), job.budgetMaxPence(), job.currency(),
                    Timestamp.from(now), job.id(), job.organizationId(), expectedVersion);
        } else {
            return jdbc.update("""
                    UPDATE jobs
                       SET title = ?, description = ?, job_type = ?,
                           location_name = ?, formatted_address = ?,
                           location = NULL,
                           budget_min_pence = ?, budget_max_pence = ?, currency = ?,
                           version = version + 1, updated_at = ?
                     WHERE id = ? AND organization_id = ? AND status = 'DRAFT' AND version = ?
                    """,
                    job.title(), job.description(), job.jobType().name(),
                    job.locationName(), job.formattedAddress(),
                    job.budgetMinPence(), job.budgetMaxPence(), job.currency(),
                    Timestamp.from(now), job.id(), job.organizationId(), expectedVersion);
        }
    }

    public int updateStatus(UUID jobId, UUID organizationId, JobStatus newStatus, long expectedVersion, Instant now) {
        return jdbc.update("""
                UPDATE jobs
                   SET status = ?, version = version + 1, updated_at = ?
                 WHERE id = ? AND organization_id = ? AND version = ?
                """,
                newStatus.name(), Timestamp.from(now), jobId, organizationId, expectedVersion);
    }

    public Optional<JobRow> findJobRow(UUID jobId) {
        return jdbc.query("""
                SELECT id, organization_id, title, description, job_type, status,
                       location_name, formatted_address,
                       ST_Y(location::geometry) AS latitude,
                       ST_X(location::geometry) AS longitude,
                       budget_min_pence, budget_max_pence, currency, version, created_at, updated_at
                  FROM jobs
                 WHERE id = ?
                """, (rs, rowNum) -> mapJobRow(rs), jobId).stream().findFirst();
    }

    public Optional<JobDetailView> findDetailById(UUID jobId) {
        Optional<JobDetailView> base = jdbc.query("""
                SELECT j.id, j.organization_id, o.name AS organization_name, o.slug AS organization_slug,
                       o.verification_status AS organization_verification_status,
                       j.title, j.description, j.job_type, j.status,
                       j.location_name, j.formatted_address,
                       ST_Y(j.location::geometry) AS latitude,
                       ST_X(j.location::geometry) AS longitude,
                       j.budget_min_pence, j.budget_max_pence, j.currency,
                       j.version, j.created_at, j.updated_at
                  FROM jobs j
                  JOIN organizations o ON o.id = j.organization_id
                 WHERE j.id = ?
                """, (rs, rowNum) -> new JobDetailView(
                rs.getObject("id", UUID.class),
                rs.getObject("organization_id", UUID.class),
                rs.getString("organization_name"),
                rs.getString("organization_slug"),
                rs.getString("organization_verification_status"),
                rs.getString("title"),
                rs.getString("description"),
                JobType.valueOf(rs.getString("job_type")),
                JobStatus.valueOf(rs.getString("status")),
                rs.getString("location_name"),
                rs.getString("formatted_address"),
                rs.getObject("latitude") != null ? rs.getDouble("latitude") : null,
                rs.getObject("longitude") != null ? rs.getDouble("longitude") : null,
                rs.getObject("budget_min_pence") != null ? rs.getLong("budget_min_pence") : null,
                rs.getObject("budget_max_pence") != null ? rs.getLong("budget_max_pence") : null,
                rs.getString("currency"),
                List.of(),
                List.of(),
                rs.getLong("version"),
                rs.getTimestamp("created_at").toInstant(),
                rs.getTimestamp("updated_at").toInstant()
        ), jobId).stream().findFirst();

        if (base.isEmpty()) {
            return Optional.empty();
        }

        List<JobSkillRequirement> skills = listRequiredSkills(jobId);
        List<JobCredentialRequirement> credentials = listRequiredCredentials(jobId);

        JobDetailView d = base.get();
        return Optional.of(new JobDetailView(
                d.id(), d.organizationId(), d.organizationName(), d.organizationSlug(),
                d.organizationVerificationStatus(), d.title(), d.description(),
                d.jobType(), d.status(), d.locationName(), d.formattedAddress(),
                d.latitude(), d.longitude(), d.budgetMinPence(), d.budgetMaxPence(),
                d.currency(), skills, credentials, d.version(), d.createdAt(), d.updatedAt()
        ));
    }

    public void addRequiredSkill(UUID id, UUID jobId, UUID skillId, SkillProficiency minProficiency, boolean required, Instant now) {
        jdbc.update("""
                INSERT INTO job_required_skills (id, job_id, skill_id, minimum_proficiency, required, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT (job_id, skill_id) DO UPDATE SET
                    minimum_proficiency = EXCLUDED.minimum_proficiency,
                    required = EXCLUDED.required
                """, id, jobId, skillId, minProficiency.name(), required, Timestamp.from(now));
    }

    public int removeRequiredSkill(UUID jobId, UUID skillId) {
        return jdbc.update("DELETE FROM job_required_skills WHERE job_id = ? AND skill_id = ?", jobId, skillId);
    }

    public List<JobSkillRequirement> listRequiredSkills(UUID jobId) {
        return jdbc.query("""
                SELECT rs.id, rs.job_id, rs.skill_id, s.name AS skill_name, c.name AS category_name,
                       rs.minimum_proficiency, rs.required, rs.created_at
                  FROM job_required_skills rs
                  JOIN skills s ON s.id = rs.skill_id
                  JOIN skill_categories c ON c.id = s.category_id
                 WHERE rs.job_id = ?
                 ORDER BY rs.created_at
                """, (rs, rowNum) -> new JobSkillRequirement(
                rs.getObject("id", UUID.class),
                rs.getObject("job_id", UUID.class),
                rs.getObject("skill_id", UUID.class),
                rs.getString("skill_name"),
                rs.getString("category_name"),
                SkillProficiency.valueOf(rs.getString("minimum_proficiency")),
                rs.getBoolean("required"),
                rs.getTimestamp("created_at").toInstant()
        ), jobId);
    }

    public void addRequiredCredential(UUID id, UUID jobId, String credentialType, String title, String issuer, boolean required, Instant now) {
        jdbc.update("""
                INSERT INTO job_required_credentials (id, job_id, credential_type, title, issuer, required, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT (job_id, title) DO UPDATE SET
                    credential_type = EXCLUDED.credential_type,
                    issuer = EXCLUDED.issuer,
                    required = EXCLUDED.required
                """, id, jobId, credentialType, title, issuer, required, Timestamp.from(now));
    }

    public int removeRequiredCredential(UUID jobId, UUID credentialRequirementId) {
        return jdbc.update("DELETE FROM job_required_credentials WHERE job_id = ? AND id = ?",
                jobId, credentialRequirementId);
    }

    public List<JobCredentialRequirement> listRequiredCredentials(UUID jobId) {
        return jdbc.query("""
                SELECT id, job_id, credential_type, title, issuer, required, created_at
                  FROM job_required_credentials
                 WHERE job_id = ?
                 ORDER BY created_at
                """, (rs, rowNum) -> new JobCredentialRequirement(
                rs.getObject("id", UUID.class),
                rs.getObject("job_id", UUID.class),
                rs.getString("credential_type"),
                rs.getString("title"),
                rs.getString("issuer"),
                rs.getBoolean("required"),
                rs.getTimestamp("created_at").toInstant()
        ), jobId);
    }

    public List<JobSummaryView> listOrganizationJobs(UUID organizationId, String statusFilter, int limit, int offset) {
        StringBuilder sql = new StringBuilder("""
                SELECT j.id, j.organization_id, o.name AS organization_name, o.slug AS organization_slug,
                       o.verification_status AS organization_verification_status,
                       j.title, j.job_type, j.status, j.location_name, j.formatted_address,
                       ST_Y(j.location::geometry) AS latitude,
                       ST_X(j.location::geometry) AS longitude,
                       j.budget_min_pence, j.budget_max_pence, j.currency,
                       j.created_at,
                       (SELECT count(*) FROM job_required_skills WHERE job_id = j.id)::int AS skills_count,
                       (SELECT count(*) FROM job_required_credentials WHERE job_id = j.id)::int AS creds_count
                  FROM jobs j
                  JOIN organizations o ON o.id = j.organization_id
                 WHERE j.organization_id = ?
                """);
        List<Object> params = new ArrayList<>();
        params.add(organizationId);

        if (statusFilter != null && !statusFilter.isBlank()) {
            sql.append(" AND j.status = ?");
            params.add(statusFilter.toUpperCase());
        }

        sql.append(" ORDER BY j.created_at DESC LIMIT ? OFFSET ?");
        params.add(limit);
        params.add(offset);

        return jdbc.query(sql.toString(), (rs, rowNum) -> mapJobSummary(rs, null), params.toArray());
    }

    public long countOrganizationJobs(UUID organizationId, String statusFilter) {
        StringBuilder sql = new StringBuilder("SELECT count(*) FROM jobs WHERE organization_id = ?");
        List<Object> params = new ArrayList<>();
        params.add(organizationId);

        if (statusFilter != null && !statusFilter.isBlank()) {
            sql.append(" AND status = ?");
            params.add(statusFilter.toUpperCase());
        }

        Long count = jdbc.queryForObject(sql.toString(), Long.class, params.toArray());
        return count != null ? count : 0L;
    }

    public List<JobSummaryView> searchPublicJobs(String query, Double lat, Double lon, Double radiusKm, String jobType, int limit, int offset) {
        boolean hasLocation = lat != null && lon != null && radiusKm != null && radiusKm > 0;
        double radiusMeters = hasLocation ? radiusKm * 1000.0 : 0.0;

        StringBuilder sql = new StringBuilder("""
                SELECT j.id, j.organization_id, o.name AS organization_name, o.slug AS organization_slug,
                       o.verification_status AS organization_verification_status,
                       j.title, j.job_type, j.status, j.location_name, j.formatted_address,
                       ST_Y(j.location::geometry) AS latitude,
                       ST_X(j.location::geometry) AS longitude,
                       j.budget_min_pence, j.budget_max_pence, j.currency,
                       j.created_at,
                       (SELECT count(*) FROM job_required_skills WHERE job_id = j.id)::int AS skills_count,
                       (SELECT count(*) FROM job_required_credentials WHERE job_id = j.id)::int AS creds_count
                """);

        if (hasLocation) {
            sql.append(", ST_Distance(j.location, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography) AS distance_meters");
        } else {
            sql.append(", NULL AS distance_meters");
        }

        sql.append("""
                  FROM jobs j
                  JOIN organizations o ON o.id = j.organization_id
                 WHERE j.status = 'PUBLISHED'
                """);

        List<Object> params = new ArrayList<>();
        if (hasLocation) {
            params.add(lon);
            params.add(lat);
        }

        if (query != null && !query.isBlank()) {
            sql.append(" AND (j.title ILIKE ? OR j.description ILIKE ? OR j.location_name ILIKE ? OR j.formatted_address ILIKE ?)");
            String q = "%" + query.trim() + "%";
            params.add(q);
            params.add(q);
            params.add(q);
            params.add(q);
        }

        if (jobType != null && !jobType.isBlank()) {
            sql.append(" AND j.job_type = ?");
            params.add(jobType.toUpperCase());
        }

        if (hasLocation) {
            sql.append(" AND j.location IS NOT NULL AND ST_DWithin(j.location, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography, ?)");
            params.add(lon);
            params.add(lat);
            params.add(radiusMeters);
            sql.append(" ORDER BY distance_meters ASC, j.created_at DESC");
        } else {
            sql.append(" ORDER BY j.created_at DESC");
        }

        sql.append(" LIMIT ? OFFSET ?");
        params.add(limit);
        params.add(offset);

        return jdbc.query(sql.toString(), (rs, rowNum) -> {
            Double dist = rs.getObject("distance_meters") != null ? rs.getDouble("distance_meters") : null;
            return mapJobSummary(rs, dist);
        }, params.toArray());
    }

    public long countPublicJobs(String query, Double lat, Double lon, Double radiusKm, String jobType) {
        boolean hasLocation = lat != null && lon != null && radiusKm != null && radiusKm > 0;
        double radiusMeters = hasLocation ? radiusKm * 1000.0 : 0.0;

        StringBuilder sql = new StringBuilder("SELECT count(*) FROM jobs j WHERE j.status = 'PUBLISHED'");
        List<Object> params = new ArrayList<>();

        if (query != null && !query.isBlank()) {
            sql.append(" AND (j.title ILIKE ? OR j.description ILIKE ? OR j.location_name ILIKE ? OR j.formatted_address ILIKE ?)");
            String q = "%" + query.trim() + "%";
            params.add(q);
            params.add(q);
            params.add(q);
            params.add(q);
        }

        if (jobType != null && !jobType.isBlank()) {
            sql.append(" AND j.job_type = ?");
            params.add(jobType.toUpperCase());
        }

        if (hasLocation) {
            sql.append(" AND j.location IS NOT NULL AND ST_DWithin(j.location, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography, ?)");
            params.add(lon);
            params.add(lat);
            params.add(radiusMeters);
        }

        Long count = jdbc.queryForObject(sql.toString(), Long.class, params.toArray());
        return count != null ? count : 0L;
    }

    private JobRow mapJobRow(ResultSet rs) throws SQLException {
        return new JobRow(
                rs.getObject("id", UUID.class),
                rs.getObject("organization_id", UUID.class),
                rs.getString("title"),
                rs.getString("description"),
                JobType.valueOf(rs.getString("job_type")),
                JobStatus.valueOf(rs.getString("status")),
                rs.getString("location_name"),
                rs.getString("formatted_address"),
                rs.getObject("latitude") != null ? rs.getDouble("latitude") : null,
                rs.getObject("longitude") != null ? rs.getDouble("longitude") : null,
                rs.getObject("budget_min_pence") != null ? rs.getLong("budget_min_pence") : null,
                rs.getObject("budget_max_pence") != null ? rs.getLong("budget_max_pence") : null,
                rs.getString("currency"),
                rs.getLong("version"),
                rs.getTimestamp("created_at").toInstant(),
                rs.getTimestamp("updated_at").toInstant()
        );
    }

    private JobSummaryView mapJobSummary(ResultSet rs, Double distanceMeters) throws SQLException {
        return new JobSummaryView(
                rs.getObject("id", UUID.class),
                rs.getObject("organization_id", UUID.class),
                rs.getString("organization_name"),
                rs.getString("organization_slug"),
                rs.getString("organization_verification_status"),
                rs.getString("title"),
                JobType.valueOf(rs.getString("job_type")),
                JobStatus.valueOf(rs.getString("status")),
                rs.getString("location_name"),
                rs.getString("formatted_address"),
                rs.getObject("latitude") != null ? rs.getDouble("latitude") : null,
                rs.getObject("longitude") != null ? rs.getDouble("longitude") : null,
                rs.getObject("budget_min_pence") != null ? rs.getLong("budget_min_pence") : null,
                rs.getObject("budget_max_pence") != null ? rs.getLong("budget_max_pence") : null,
                rs.getString("currency"),
                rs.getInt("skills_count"),
                rs.getInt("creds_count"),
                distanceMeters,
                rs.getTimestamp("created_at").toInstant()
        );
    }
}
