package com.atlas.shift.infrastructure;

import com.atlas.shift.domain.ShiftCredentialRequirement;
import com.atlas.shift.domain.ShiftDetailView;
import com.atlas.shift.domain.ShiftRow;
import com.atlas.shift.domain.ShiftSkillRequirement;
import com.atlas.shift.domain.ShiftStatus;
import com.atlas.shift.domain.ShiftSummaryView;
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
public class ShiftRepository {
    private final JdbcTemplate jdbc;

    public ShiftRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void insert(ShiftRow shift) {
        Double lon = shift.longitude();
        Double lat = shift.latitude();
        if (lon != null && lat != null) {
            jdbc.update("""
                    INSERT INTO shifts
                        (id, job_id, organization_id, title, description,
                         start_time, end_time, timezone, capacity, hourly_rate_pence, currency,
                         status, location_name, formatted_address, location,
                         version, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                            ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography,
                            0, ?, ?)
                    """,
                    shift.id(), shift.jobId(), shift.organizationId(), shift.title(), shift.description(),
                    Timestamp.from(shift.startTime()), Timestamp.from(shift.endTime()), shift.timezone(),
                    shift.capacity(), shift.hourlyRatePence(), shift.currency(),
                    shift.status().name(), shift.locationName(), shift.formattedAddress(),
                    lon, lat,
                    Timestamp.from(shift.createdAt()), Timestamp.from(shift.updatedAt()));
        } else {
            jdbc.update("""
                    INSERT INTO shifts
                        (id, job_id, organization_id, title, description,
                         start_time, end_time, timezone, capacity, hourly_rate_pence, currency,
                         status, location_name, formatted_address, location,
                         version, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL,
                            0, ?, ?)
                    """,
                    shift.id(), shift.jobId(), shift.organizationId(), shift.title(), shift.description(),
                    Timestamp.from(shift.startTime()), Timestamp.from(shift.endTime()), shift.timezone(),
                    shift.capacity(), shift.hourlyRatePence(), shift.currency(),
                    shift.status().name(), shift.locationName(), shift.formattedAddress(),
                    Timestamp.from(shift.createdAt()), Timestamp.from(shift.updatedAt()));
        }
    }

    public int updateDraft(ShiftRow shift, long expectedVersion, Instant now) {
        Double lon = shift.longitude();
        Double lat = shift.latitude();
        if (lon != null && lat != null) {
            return jdbc.update("""
                    UPDATE shifts
                       SET title = ?, description = ?, job_id = ?,
                           start_time = ?, end_time = ?, timezone = ?,
                           capacity = ?, hourly_rate_pence = ?, currency = ?,
                           location_name = ?, formatted_address = ?,
                           location = ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography,
                           version = version + 1, updated_at = ?
                     WHERE id = ? AND organization_id = ? AND status = 'DRAFT' AND version = ?
                    """,
                    shift.title(), shift.description(), shift.jobId(),
                    Timestamp.from(shift.startTime()), Timestamp.from(shift.endTime()), shift.timezone(),
                    shift.capacity(), shift.hourlyRatePence(), shift.currency(),
                    shift.locationName(), shift.formattedAddress(),
                    lon, lat,
                    Timestamp.from(now), shift.id(), shift.organizationId(), expectedVersion);
        } else {
            return jdbc.update("""
                    UPDATE shifts
                       SET title = ?, description = ?, job_id = ?,
                           start_time = ?, end_time = ?, timezone = ?,
                           capacity = ?, hourly_rate_pence = ?, currency = ?,
                           location_name = ?, formatted_address = ?,
                           location = NULL,
                           version = version + 1, updated_at = ?
                     WHERE id = ? AND organization_id = ? AND status = 'DRAFT' AND version = ?
                    """,
                    shift.title(), shift.description(), shift.jobId(),
                    Timestamp.from(shift.startTime()), Timestamp.from(shift.endTime()), shift.timezone(),
                    shift.capacity(), shift.hourlyRatePence(), shift.currency(),
                    shift.locationName(), shift.formattedAddress(),
                    Timestamp.from(now), shift.id(), shift.organizationId(), expectedVersion);
        }
    }

    public int updateStatus(UUID shiftId, UUID organizationId, ShiftStatus newStatus, long expectedVersion, Instant now) {
        return jdbc.update("""
                UPDATE shifts
                   SET status = ?, version = version + 1, updated_at = ?
                 WHERE id = ? AND organization_id = ? AND version = ?
                """,
                newStatus.name(), Timestamp.from(now), shiftId, organizationId, expectedVersion);
    }

    public Optional<ShiftRow> findShiftRow(UUID shiftId) {
        return jdbc.query("""
                SELECT id, job_id, organization_id, title, description,
                       start_time, end_time, timezone, capacity, hourly_rate_pence, currency,
                       status, location_name, formatted_address,
                       ST_Y(location::geometry) AS latitude,
                       ST_X(location::geometry) AS longitude,
                       version, created_at, updated_at
                  FROM shifts
                 WHERE id = ?
                """, (rs, rowNum) -> mapShiftRow(rs), shiftId).stream().findFirst();
    }

    public Optional<ShiftDetailView> findDetailById(UUID shiftId) {
        Optional<ShiftDetailView> base = jdbc.query("""
                SELECT s.id, s.job_id, j.title AS job_title,
                       s.organization_id, o.name AS organization_name, o.slug AS organization_slug,
                       o.verification_status AS organization_verification_status,
                       s.title, s.description, s.start_time, s.end_time, s.timezone,
                       s.capacity, s.hourly_rate_pence, s.currency, s.status,
                       s.location_name, s.formatted_address,
                       ST_Y(s.location::geometry) AS latitude,
                       ST_X(s.location::geometry) AS longitude,
                       s.version, s.created_at, s.updated_at
                  FROM shifts s
                  JOIN organizations o ON o.id = s.organization_id
             LEFT JOIN jobs j ON j.id = s.job_id
                 WHERE s.id = ?
                """, (rs, rowNum) -> new ShiftDetailView(
                rs.getObject("id", UUID.class),
                rs.getObject("job_id", UUID.class),
                rs.getString("job_title"),
                rs.getObject("organization_id", UUID.class),
                rs.getString("organization_name"),
                rs.getString("organization_slug"),
                rs.getString("organization_verification_status"),
                rs.getString("title"),
                rs.getString("description"),
                rs.getTimestamp("start_time").toInstant(),
                rs.getTimestamp("end_time").toInstant(),
                rs.getString("timezone"),
                rs.getInt("capacity"),
                rs.getLong("hourly_rate_pence"),
                rs.getString("currency"),
                ShiftStatus.valueOf(rs.getString("status")),
                rs.getString("location_name"),
                rs.getString("formatted_address"),
                rs.getObject("latitude") != null ? rs.getDouble("latitude") : null,
                rs.getObject("longitude") != null ? rs.getDouble("longitude") : null,
                List.of(),
                List.of(),
                rs.getLong("version"),
                rs.getTimestamp("created_at").toInstant(),
                rs.getTimestamp("updated_at").toInstant()
        ), shiftId).stream().findFirst();

        if (base.isEmpty()) {
            return Optional.empty();
        }

        List<ShiftSkillRequirement> skills = listRequiredSkills(shiftId);
        List<ShiftCredentialRequirement> credentials = listRequiredCredentials(shiftId);

        ShiftDetailView d = base.get();
        return Optional.of(new ShiftDetailView(
                d.id(), d.jobId(), d.jobTitle(), d.organizationId(), d.organizationName(), d.organizationSlug(),
                d.organizationVerificationStatus(), d.title(), d.description(),
                d.startTime(), d.endTime(), d.timezone(), d.capacity(), d.hourlyRatePence(),
                d.currency(), d.status(), d.locationName(), d.formattedAddress(),
                d.latitude(), d.longitude(), skills, credentials, d.version(), d.createdAt(), d.updatedAt()
        ));
    }

    public void addRequiredSkill(UUID id, UUID shiftId, UUID skillId, SkillProficiency minProficiency, boolean required, Instant now) {
        jdbc.update("""
                INSERT INTO shift_required_skills (id, shift_id, skill_id, minimum_proficiency, required, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT (shift_id, skill_id) DO UPDATE SET
                    minimum_proficiency = EXCLUDED.minimum_proficiency,
                    required = EXCLUDED.required
                """, id, shiftId, skillId, minProficiency.name(), required, Timestamp.from(now));
    }

    public int removeRequiredSkill(UUID shiftId, UUID skillId) {
        return jdbc.update("DELETE FROM shift_required_skills WHERE shift_id = ? AND skill_id = ?", shiftId, skillId);
    }

    public List<ShiftSkillRequirement> listRequiredSkills(UUID shiftId) {
        return jdbc.query("""
                SELECT rs.id, rs.shift_id, rs.skill_id, s.name AS skill_name, c.name AS category_name,
                       rs.minimum_proficiency, rs.required, rs.created_at
                  FROM shift_required_skills rs
                  JOIN skills s ON s.id = rs.skill_id
                  JOIN skill_categories c ON c.id = s.category_id
                 WHERE rs.shift_id = ?
                 ORDER BY rs.created_at
                """, (rs, rowNum) -> new ShiftSkillRequirement(
                rs.getObject("id", UUID.class),
                rs.getObject("shift_id", UUID.class),
                rs.getObject("skill_id", UUID.class),
                rs.getString("skill_name"),
                rs.getString("category_name"),
                SkillProficiency.valueOf(rs.getString("minimum_proficiency")),
                rs.getBoolean("required"),
                rs.getTimestamp("created_at").toInstant()
        ), shiftId);
    }

    public void addRequiredCredential(UUID id, UUID shiftId, String credentialType, String title, String issuer, boolean required, Instant now) {
        jdbc.update("""
                INSERT INTO shift_required_credentials (id, shift_id, credential_type, title, issuer, required, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT (shift_id, title) DO UPDATE SET
                    credential_type = EXCLUDED.credential_type,
                    issuer = EXCLUDED.issuer,
                    required = EXCLUDED.required
                """, id, shiftId, credentialType, title, issuer, required, Timestamp.from(now));
    }

    public int removeRequiredCredential(UUID shiftId, UUID credentialRequirementId) {
        return jdbc.update("DELETE FROM shift_required_credentials WHERE shift_id = ? AND id = ?",
                shiftId, credentialRequirementId);
    }

    public List<ShiftCredentialRequirement> listRequiredCredentials(UUID shiftId) {
        return jdbc.query("""
                SELECT id, shift_id, credential_type, title, issuer, required, created_at
                  FROM shift_required_credentials
                 WHERE shift_id = ?
                 ORDER BY created_at
                """, (rs, rowNum) -> new ShiftCredentialRequirement(
                rs.getObject("id", UUID.class),
                rs.getObject("shift_id", UUID.class),
                rs.getString("credential_type"),
                rs.getString("title"),
                rs.getString("issuer"),
                rs.getBoolean("required"),
                rs.getTimestamp("created_at").toInstant()
        ), shiftId);
    }

    public void copyRequirementsFromJob(UUID jobId, UUID shiftId, Instant now) {
        jdbc.update("""
                INSERT INTO shift_required_skills (id, shift_id, skill_id, minimum_proficiency, required, created_at)
                SELECT gen_random_uuid(), ?, skill_id, minimum_proficiency, required, ?
                  FROM job_required_skills
                 WHERE job_id = ?
                ON CONFLICT (shift_id, skill_id) DO NOTHING
                """, shiftId, Timestamp.from(now), jobId);

        jdbc.update("""
                INSERT INTO shift_required_credentials (id, shift_id, credential_type, title, issuer, required, created_at)
                SELECT gen_random_uuid(), ?, credential_type, title, issuer, required, ?
                  FROM job_required_credentials
                 WHERE job_id = ?
                ON CONFLICT (shift_id, title) DO NOTHING
                """, shiftId, Timestamp.from(now), jobId);
    }

    public List<ShiftSummaryView> listOrganizationShifts(UUID organizationId, String statusFilter, UUID jobId,
                                                         Instant from, Instant to, int limit, int offset) {
        StringBuilder sql = new StringBuilder("""
                SELECT s.id, s.job_id, j.title AS job_title,
                       s.organization_id, o.name AS organization_name, o.slug AS organization_slug,
                       o.verification_status AS organization_verification_status,
                       s.title, s.start_time, s.end_time, s.timezone,
                       s.capacity, s.hourly_rate_pence, s.currency, s.status,
                       s.location_name, s.formatted_address,
                       ST_Y(s.location::geometry) AS latitude,
                       ST_X(s.location::geometry) AS longitude,
                       s.created_at,
                       (SELECT count(*) FROM shift_required_skills WHERE shift_id = s.id)::int AS skills_count,
                       (SELECT count(*) FROM shift_required_credentials WHERE shift_id = s.id)::int AS creds_count
                  FROM shifts s
                  JOIN organizations o ON o.id = s.organization_id
             LEFT JOIN jobs j ON j.id = s.job_id
                 WHERE s.organization_id = ?
                """);
        List<Object> params = new ArrayList<>();
        params.add(organizationId);

        if (statusFilter != null && !statusFilter.isBlank()) {
            sql.append(" AND s.status = ?");
            params.add(statusFilter.toUpperCase());
        }
        if (jobId != null) {
            sql.append(" AND s.job_id = ?");
            params.add(jobId);
        }
        if (from != null) {
            sql.append(" AND s.end_time >= ?");
            params.add(Timestamp.from(from));
        }
        if (to != null) {
            sql.append(" AND s.start_time <= ?");
            params.add(Timestamp.from(to));
        }

        sql.append(" ORDER BY s.start_time ASC LIMIT ? OFFSET ?");
        params.add(limit);
        params.add(offset);

        return jdbc.query(sql.toString(), (rs, rowNum) -> mapShiftSummary(rs, null), params.toArray());
    }

    public long countOrganizationShifts(UUID organizationId, String statusFilter, UUID jobId, Instant from, Instant to) {
        StringBuilder sql = new StringBuilder("SELECT count(*) FROM shifts WHERE organization_id = ?");
        List<Object> params = new ArrayList<>();
        params.add(organizationId);

        if (statusFilter != null && !statusFilter.isBlank()) {
            sql.append(" AND status = ?");
            params.add(statusFilter.toUpperCase());
        }
        if (jobId != null) {
            sql.append(" AND job_id = ?");
            params.add(jobId);
        }
        if (from != null) {
            sql.append(" AND end_time >= ?");
            params.add(Timestamp.from(from));
        }
        if (to != null) {
            sql.append(" AND start_time <= ?");
            params.add(Timestamp.from(to));
        }

        Long count = jdbc.queryForObject(sql.toString(), Long.class, params.toArray());
        return count != null ? count : 0L;
    }

    public List<ShiftSummaryView> searchPublicShifts(String query, Double lat, Double lon, Double radiusKm,
                                                     Instant from, Instant to, Long minHourlyRatePence,
                                                     int limit, int offset) {
        boolean hasLocation = lat != null && lon != null && radiusKm != null && radiusKm > 0;
        double radiusMeters = hasLocation ? radiusKm * 1000.0 : 0.0;

        StringBuilder sql = new StringBuilder("""
                SELECT s.id, s.job_id, j.title AS job_title,
                       s.organization_id, o.name AS organization_name, o.slug AS organization_slug,
                       o.verification_status AS organization_verification_status,
                       s.title, s.start_time, s.end_time, s.timezone,
                       s.capacity, s.hourly_rate_pence, s.currency, s.status,
                       s.location_name, s.formatted_address,
                       ST_Y(s.location::geometry) AS latitude,
                       ST_X(s.location::geometry) AS longitude,
                       s.created_at,
                       (SELECT count(*) FROM shift_required_skills WHERE shift_id = s.id)::int AS skills_count,
                       (SELECT count(*) FROM shift_required_credentials WHERE shift_id = s.id)::int AS creds_count
                """);

        if (hasLocation) {
            sql.append(", ST_Distance(s.location, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography) AS distance_meters");
        } else {
            sql.append(", NULL AS distance_meters");
        }

        sql.append("""
                  FROM shifts s
                  JOIN organizations o ON o.id = s.organization_id
             LEFT JOIN jobs j ON j.id = s.job_id
                 WHERE s.status = 'PUBLISHED'
                """);

        List<Object> params = new ArrayList<>();
        if (hasLocation) {
            params.add(lon);
            params.add(lat);
        }

        if (query != null && !query.isBlank()) {
            sql.append(" AND (s.title ILIKE ? OR s.description ILIKE ? OR s.location_name ILIKE ? OR s.formatted_address ILIKE ?)");
            String q = "%" + query.trim() + "%";
            params.add(q);
            params.add(q);
            params.add(q);
            params.add(q);
        }

        if (from != null) {
            sql.append(" AND s.end_time >= ?");
            params.add(Timestamp.from(from));
        }
        if (to != null) {
            sql.append(" AND s.start_time <= ?");
            params.add(Timestamp.from(to));
        }
        if (minHourlyRatePence != null && minHourlyRatePence > 0) {
            sql.append(" AND s.hourly_rate_pence >= ?");
            params.add(minHourlyRatePence);
        }

        if (hasLocation) {
            sql.append(" AND s.location IS NOT NULL AND ST_DWithin(s.location, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography, ?)");
            params.add(lon);
            params.add(lat);
            params.add(radiusMeters);
            sql.append(" ORDER BY distance_meters ASC, s.start_time ASC");
        } else {
            sql.append(" ORDER BY s.start_time ASC");
        }

        sql.append(" LIMIT ? OFFSET ?");
        params.add(limit);
        params.add(offset);

        return jdbc.query(sql.toString(), (rs, rowNum) -> {
            Double dist = rs.getObject("distance_meters") != null ? rs.getDouble("distance_meters") : null;
            return mapShiftSummary(rs, dist);
        }, params.toArray());
    }

    public long countPublicShifts(String query, Double lat, Double lon, Double radiusKm,
                                  Instant from, Instant to, Long minHourlyRatePence) {
        boolean hasLocation = lat != null && lon != null && radiusKm != null && radiusKm > 0;
        double radiusMeters = hasLocation ? radiusKm * 1000.0 : 0.0;

        StringBuilder sql = new StringBuilder("SELECT count(*) FROM shifts s WHERE s.status = 'PUBLISHED'");
        List<Object> params = new ArrayList<>();

        if (query != null && !query.isBlank()) {
            sql.append(" AND (s.title ILIKE ? OR s.description ILIKE ? OR s.location_name ILIKE ? OR s.formatted_address ILIKE ?)");
            String q = "%" + query.trim() + "%";
            params.add(q);
            params.add(q);
            params.add(q);
            params.add(q);
        }

        if (from != null) {
            sql.append(" AND s.end_time >= ?");
            params.add(Timestamp.from(from));
        }
        if (to != null) {
            sql.append(" AND s.start_time <= ?");
            params.add(Timestamp.from(to));
        }
        if (minHourlyRatePence != null && minHourlyRatePence > 0) {
            sql.append(" AND s.hourly_rate_pence >= ?");
            params.add(minHourlyRatePence);
        }

        if (hasLocation) {
            sql.append(" AND s.location IS NOT NULL AND ST_DWithin(s.location, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography, ?)");
            params.add(lon);
            params.add(lat);
            params.add(radiusMeters);
        }

        Long count = jdbc.queryForObject(sql.toString(), Long.class, params.toArray());
        return count != null ? count : 0L;
    }

    private ShiftRow mapShiftRow(ResultSet rs) throws SQLException {
        return new ShiftRow(
                rs.getObject("id", UUID.class),
                rs.getObject("job_id", UUID.class),
                rs.getObject("organization_id", UUID.class),
                rs.getString("title"),
                rs.getString("description"),
                rs.getTimestamp("start_time").toInstant(),
                rs.getTimestamp("end_time").toInstant(),
                rs.getString("timezone"),
                rs.getInt("capacity"),
                rs.getLong("hourly_rate_pence"),
                rs.getString("currency"),
                ShiftStatus.valueOf(rs.getString("status")),
                rs.getString("location_name"),
                rs.getString("formatted_address"),
                rs.getObject("latitude") != null ? rs.getDouble("latitude") : null,
                rs.getObject("longitude") != null ? rs.getDouble("longitude") : null,
                rs.getLong("version"),
                rs.getTimestamp("created_at").toInstant(),
                rs.getTimestamp("updated_at").toInstant()
        );
    }

    private ShiftSummaryView mapShiftSummary(ResultSet rs, Double distanceMeters) throws SQLException {
        return new ShiftSummaryView(
                rs.getObject("id", UUID.class),
                rs.getObject("job_id", UUID.class),
                rs.getString("job_title"),
                rs.getObject("organization_id", UUID.class),
                rs.getString("organization_name"),
                rs.getString("organization_slug"),
                rs.getString("organization_verification_status"),
                rs.getString("title"),
                rs.getTimestamp("start_time").toInstant(),
                rs.getTimestamp("end_time").toInstant(),
                rs.getString("timezone"),
                rs.getInt("capacity"),
                rs.getLong("hourly_rate_pence"),
                rs.getString("currency"),
                ShiftStatus.valueOf(rs.getString("status")),
                rs.getString("location_name"),
                rs.getString("formatted_address"),
                rs.getObject("latitude") != null ? rs.getDouble("latitude") : null,
                rs.getObject("longitude") != null ? rs.getDouble("longitude") : null,
                rs.getInt("skills_count"),
                rs.getInt("creds_count"),
                distanceMeters,
                rs.getTimestamp("created_at").toInstant()
        );
    }
}

