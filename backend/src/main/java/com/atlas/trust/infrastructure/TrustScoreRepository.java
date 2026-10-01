package com.atlas.trust.infrastructure;

import com.atlas.trust.domain.TrustScoreCalculator.Facts;
import com.atlas.trust.domain.TrustScoreCalculator.Score;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class TrustScoreRepository {
    private final JdbcTemplate jdbc;

    public TrustScoreRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Facts facts(UUID workerUserId) {
        return jdbc.queryForObject("""
                SELECT
                    COALESCE((SELECT count(*) FROM work_ledger_entries
                              WHERE worker_user_id = ? AND event_type = 'SHIFT_COMPLETED'), 0)::int AS completed,
                    COALESCE((SELECT count(*) FROM work_ledger_entries
                              WHERE worker_user_id = ? AND event_type = 'RESERVATION_CANCELLED'), 0)::int AS cancelled,
                    COALESCE((SELECT count(*) FROM worker_skills
                              WHERE worker_user_id = ? AND verification_status = 'VERIFIED'), 0)::int AS verified,
                    COALESCE((SELECT completion_score FROM worker_profiles
                              WHERE user_id = ?), 0)::int AS completion
                """, (rs, n) -> new Facts(
                rs.getInt("completed"),
                rs.getInt("cancelled"),
                rs.getInt("verified"),
                rs.getInt("completion")),
                workerUserId, workerUserId, workerUserId, workerUserId);
    }

    public boolean workerExists(UUID workerUserId) {
        Integer count = jdbc.queryForObject(
                "SELECT count(*) FROM worker_profiles WHERE user_id = ?",
                Integer.class, workerUserId);
        return count != null && count > 0;
    }

    public void snapshot(UUID id, UUID workerUserId, Facts facts, Score score,
                         String componentsJson, Instant computedAt) {
        jdbc.update("""
                INSERT INTO worker_trust_score_snapshots
                    (id, worker_user_id, algorithm_version, score,
                     completed_shifts, cancelled_reservations, verified_skills,
                     profile_completion, components, computed_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?::jsonb, ?)
                """, id, workerUserId, score.algorithmVersion(), score.total(),
                facts.completedShifts(), facts.cancelledReservations(), facts.verifiedSkills(),
                facts.profileCompletion(), componentsJson, Timestamp.from(computedAt));
    }
}
