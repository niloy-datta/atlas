package com.atlas.matching.infrastructure;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class MatchRepository {
    private final JdbcTemplate jdbc;

    public MatchRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<TargetRow> jobTarget(UUID organizationId, UUID jobId) {
        return jdbc.query("""
                SELECT id, organization_id, title, NULL::timestamptz AS starts_at,
                       NULL::timestamptz AS ends_at
                  FROM jobs
                 WHERE organization_id = ? AND id = ?
                """, (rs, n) -> new TargetRow(
                rs.getObject("id", UUID.class),
                rs.getObject("organization_id", UUID.class),
                rs.getString("title"),
                null, null), organizationId, jobId).stream().findFirst();
    }

    public Optional<TargetRow> shiftTarget(UUID organizationId, UUID shiftId) {
        return jdbc.query("""
                SELECT id, organization_id, title, start_time AS starts_at, end_time AS ends_at
                  FROM shifts
                 WHERE organization_id = ? AND id = ?
                """, (rs, n) -> new TargetRow(
                rs.getObject("id", UUID.class),
                rs.getObject("organization_id", UUID.class),
                rs.getString("title"),
                rs.getTimestamp("starts_at").toInstant(),
                rs.getTimestamp("ends_at").toInstant()), organizationId, shiftId).stream().findFirst();
    }

    public List<CandidateFacts> jobCandidates(UUID organizationId, UUID jobId) {
        return jdbc.query("""
                WITH target AS (
                    SELECT location
                      FROM jobs
                     WHERE organization_id = ? AND id = ?
                ),
                req AS (
                    SELECT skill_id, minimum_proficiency
                      FROM job_required_skills
                     WHERE job_id = ? AND required = true
                )
                SELECT p.user_id, p.full_name, p.public_handle, p.headline, p.completion_score,
                       pref.max_distance_km,
                       CASE WHEN wl.search_point IS NOT NULL AND t.location IS NOT NULL
                            THEN ST_Distance(wl.search_point, t.location)
                            ELSE NULL END AS distance_meters,
                       count(r.skill_id)::int AS required_count,
                       count(r.skill_id) FILTER (
                           WHERE ws.skill_id IS NOT NULL
                             AND proficiency_rank(ws.proficiency) >= proficiency_rank(r.minimum_proficiency)
                       )::int AS matched_count,
                       count(r.skill_id) FILTER (
                           WHERE ws.skill_id IS NOT NULL
                             AND proficiency_rank(ws.proficiency) >= proficiency_rank(r.minimum_proficiency)
                             AND ws.verification_status = 'VERIFIED'
                       )::int AS verified_count
                  FROM target t
                  CROSS JOIN worker_profiles p
                  JOIN worker_preferences pref ON pref.worker_profile_id = p.id AND pref.open_to_work = true
             LEFT JOIN worker_locations wl ON wl.worker_profile_id = p.id
             LEFT JOIN req r ON true
             LEFT JOIN worker_skills ws ON ws.worker_user_id = p.user_id AND ws.skill_id = r.skill_id
                 GROUP BY p.user_id, p.full_name, p.public_handle, p.headline, p.completion_score,
                          pref.max_distance_km, wl.search_point, t.location
                 ORDER BY p.completion_score DESC, p.user_id
                 LIMIT 200
                """, (rs, n) -> candidate(rs), organizationId, jobId, jobId);
    }

    public List<CandidateFacts> shiftCandidates(UUID organizationId, UUID shiftId) {
        return jdbc.query("""
                WITH target AS (
                    SELECT location
                      FROM shifts
                     WHERE organization_id = ? AND id = ?
                ),
                req AS (
                    SELECT skill_id, minimum_proficiency
                      FROM shift_required_skills
                     WHERE shift_id = ? AND required = true
                )
                SELECT p.user_id, p.full_name, p.public_handle, p.headline, p.completion_score,
                       pref.max_distance_km,
                       CASE WHEN wl.search_point IS NOT NULL AND t.location IS NOT NULL
                            THEN ST_Distance(wl.search_point, t.location)
                            ELSE NULL END AS distance_meters,
                       count(r.skill_id)::int AS required_count,
                       count(r.skill_id) FILTER (
                           WHERE ws.skill_id IS NOT NULL
                             AND proficiency_rank(ws.proficiency) >= proficiency_rank(r.minimum_proficiency)
                       )::int AS matched_count,
                       count(r.skill_id) FILTER (
                           WHERE ws.skill_id IS NOT NULL
                             AND proficiency_rank(ws.proficiency) >= proficiency_rank(r.minimum_proficiency)
                             AND ws.verification_status = 'VERIFIED'
                       )::int AS verified_count
                  FROM target t
                  CROSS JOIN worker_profiles p
                  JOIN worker_preferences pref ON pref.worker_profile_id = p.id AND pref.open_to_work = true
             LEFT JOIN worker_locations wl ON wl.worker_profile_id = p.id
             LEFT JOIN req r ON true
             LEFT JOIN worker_skills ws ON ws.worker_user_id = p.user_id AND ws.skill_id = r.skill_id
                 GROUP BY p.user_id, p.full_name, p.public_handle, p.headline, p.completion_score,
                          pref.max_distance_km, wl.search_point, t.location
                 ORDER BY p.completion_score DESC, p.user_id
                 LIMIT 200
                """, (rs, n) -> candidate(rs), organizationId, shiftId, shiftId);
    }

    public boolean availableForShift(UUID workerUserId, Instant startsAt, Instant endsAt) {
        Boolean available = jdbc.queryForObject("""
                SELECT
                    EXISTS (
                        SELECT 1
                          FROM worker_availability_overrides o
                         WHERE o.worker_user_id = ?
                           AND o.override_type = 'AVAILABLE'
                           AND o.override_date = (?::timestamptz AT TIME ZONE o.timezone)::date
                           AND o.start_local <= (?::timestamptz AT TIME ZONE o.timezone)::time
                           AND o.end_local >= (?::timestamptz AT TIME ZONE o.timezone)::time
                    )
                    OR (
                        NOT EXISTS (
                            SELECT 1
                              FROM worker_availability_overrides o
                             WHERE o.worker_user_id = ?
                               AND o.override_date = (?::timestamptz AT TIME ZONE o.timezone)::date
                        )
                        AND EXISTS (
                            SELECT 1
                              FROM worker_availability_rules r
                             WHERE r.worker_user_id = ?
                               AND r.day_of_week =
                                   EXTRACT(ISODOW FROM (?::timestamptz AT TIME ZONE r.timezone))::int
                               AND (r.valid_from IS NULL OR r.valid_from <=
                                   (?::timestamptz AT TIME ZONE r.timezone)::date)
                               AND (r.valid_until IS NULL OR r.valid_until >=
                                   (?::timestamptz AT TIME ZONE r.timezone)::date)
                               AND r.start_local <= (?::timestamptz AT TIME ZONE r.timezone)::time
                               AND r.end_local >= (?::timestamptz AT TIME ZONE r.timezone)::time
                        )
                    )
                """, Boolean.class,
                workerUserId, startsAt, startsAt, endsAt,
                workerUserId, startsAt,
                workerUserId, startsAt, startsAt, startsAt, startsAt, endsAt);
        return Boolean.TRUE.equals(available);
    }

    private static CandidateFacts candidate(java.sql.ResultSet rs) throws java.sql.SQLException {
        Number distance = (Number) rs.getObject("distance_meters");
        return new CandidateFacts(
                rs.getObject("user_id", UUID.class),
                rs.getString("full_name"),
                rs.getString("public_handle"),
                rs.getString("headline"),
                rs.getInt("completion_score"),
                (Integer) rs.getObject("max_distance_km"),
                distance == null ? null : distance.doubleValue(),
                rs.getInt("required_count"),
                rs.getInt("matched_count"),
                rs.getInt("verified_count"));
    }

    public record TargetRow(UUID id, UUID organizationId, String title, Instant startsAt, Instant endsAt) { }

    public record CandidateFacts(UUID workerUserId, String fullName, String publicHandle,
                                 String headline, int completionScore, Integer maxDistanceKm,
                                 Double distanceMeters, int requiredSkills,
                                 int matchedRequiredSkills, int verifiedMatchedSkills) { }
}
