package com.atlas.skill.infrastructure;

import com.atlas.skill.domain.EndorsementRelationship;
import com.atlas.skill.domain.SkillEvidenceType;
import com.atlas.skill.domain.SkillProficiency;
import com.atlas.skill.domain.SkillVerificationStatus;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class SkillRepository {
    private final JdbcTemplate jdbc;

    public SkillRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public CategoryRow createCategory(String name, String slug, String description, Instant now) {
        CategoryRow row = new CategoryRow(UUID.randomUUID(), name, slug, description, true, now);
        jdbc.update("""
                INSERT INTO skill_categories (id, name, slug, description, active, created_at, updated_at)
                VALUES (?, ?, ?, ?, true, ?, ?)
                """, row.id(), row.name(), row.slug(), row.description(), Timestamp.from(now), Timestamp.from(now));
        return row;
    }

    public SkillRow createSkill(UUID categoryId, String name, String slug, String description, Instant now) {
        SkillRow row = new SkillRow(UUID.randomUUID(), categoryId, null, name, slug, description, true, now);
        jdbc.update("""
                INSERT INTO skills (id, category_id, name, slug, description, active, created_at, updated_at)
                SELECT ?, c.id, ?, ?, ?, true, ?, ? FROM skill_categories c
                 WHERE c.id = ? AND c.active = true
                """, row.id(), name, slug, description, Timestamp.from(now), Timestamp.from(now), categoryId);
        return findSkill(row.id()).orElse(row);
    }

    public List<CategoryRow> activeCategories() {
        return jdbc.query("""
                SELECT id, name, slug, description, active, created_at
                  FROM skill_categories WHERE active = true ORDER BY name, id
                """, (rs, n) -> new CategoryRow(rs.getObject("id", UUID.class), rs.getString("name"),
                rs.getString("slug"), rs.getString("description"), rs.getBoolean("active"),
                rs.getTimestamp("created_at").toInstant()));
    }

    public boolean activeCategoryExists(UUID categoryId) {
        return Boolean.TRUE.equals(jdbc.queryForObject(
                "SELECT EXISTS (SELECT 1 FROM skill_categories WHERE id = ? AND active = true)",
                Boolean.class, categoryId));
    }

    public int setSkillActive(UUID skillId, boolean active, Instant now) {
        return jdbc.update("UPDATE skills SET active = ?, updated_at = ? WHERE id = ?",
                active, Timestamp.from(now), skillId);
    }

    public List<SkillRow> search(String query, UUID categoryId, int limit) {
        String normalized = query == null ? "" : query.trim();
        return jdbc.query("""
                SELECT s.id, s.category_id, c.name AS category_name, s.name, s.slug, s.description,
                       s.active, s.created_at
                  FROM skills s JOIN skill_categories c ON c.id = s.category_id
                 WHERE s.active = true AND c.active = true
                   AND (? = '' OR s.name ILIKE '%' || ? || '%' OR s.description ILIKE '%' || ? || '%')
                   AND (?::uuid IS NULL OR s.category_id = ?::uuid)
                 ORDER BY s.name, s.id LIMIT ?
                """, (rs, n) -> skill(rs), normalized, normalized, normalized, categoryId, categoryId, limit);
    }

    public Optional<SkillRow> findSkill(UUID skillId) {
        return jdbc.query("""
                SELECT s.id, s.category_id, c.name AS category_name, s.name, s.slug, s.description,
                       s.active, s.created_at
                  FROM skills s JOIN skill_categories c ON c.id = s.category_id WHERE s.id = ?
                """, (rs, n) -> skill(rs), skillId).stream().findFirst();
    }

    public WorkerSkillRow addWorkerSkill(UUID workerUserId, UUID skillId, SkillProficiency proficiency, Instant now) {
        WorkerSkillRow row = new WorkerSkillRow(UUID.randomUUID(), workerUserId, skillId, null, proficiency,
                SkillVerificationStatus.SELF_DECLARED, 0, now, now, 0);
        jdbc.update("""
                INSERT INTO worker_skills
                    (id, worker_user_id, skill_id, proficiency, verification_status, version, created_at, updated_at)
                VALUES (?, ?, ?, ?, 'SELF_DECLARED', 0, ?, ?)
                """, row.id(), workerUserId, skillId, proficiency.name(), Timestamp.from(now), Timestamp.from(now));
        addHistory(row.id(), null, SkillVerificationStatus.SELF_DECLARED, workerUserId, null,
                "Worker self-declared skill", now);
        return requireWorkerSkill(row.id());
    }

    public List<WorkerSkillRow> workerSkills(UUID workerUserId) {
        return jdbc.query(workerSkillSelect() + " WHERE ws.worker_user_id = ? ORDER BY s.name, ws.id",
                (rs, n) -> workerSkill(rs), workerUserId);
    }

    public Optional<WorkerSkillRow> findWorkerSkill(UUID workerSkillId) {
        return jdbc.query(workerSkillSelect() + " WHERE ws.id = ?", (rs, n) -> workerSkill(rs), workerSkillId)
                .stream().findFirst();
    }

    public Optional<WorkerSkillRow> findWorkerSkillForUpdate(UUID workerSkillId) {
        return jdbc.query("""
                SELECT ws.id, ws.worker_user_id, ws.skill_id, s.name AS skill_name, ws.proficiency,
                       ws.verification_status, ws.version, ws.created_at, ws.updated_at,
                       (SELECT count(*) FROM skill_endorsements e WHERE e.worker_skill_id = ws.id) AS endorsement_count
                  FROM worker_skills ws JOIN skills s ON s.id = ws.skill_id
                 WHERE ws.id = ? FOR UPDATE OF ws
                """, (rs, n) -> workerSkill(rs), workerSkillId).stream().findFirst();
    }

    public int updateProficiency(UUID workerSkillId, UUID workerUserId, long expectedVersion,
                                 SkillProficiency proficiency, Instant now) {
        return jdbc.update("""
                UPDATE worker_skills SET proficiency = ?, version = version + 1, updated_at = ?
                 WHERE id = ? AND worker_user_id = ? AND version = ?
                """, proficiency.name(), Timestamp.from(now), workerSkillId, workerUserId, expectedVersion);
    }

    public int deleteWorkerSkill(UUID workerSkillId, UUID workerUserId) {
        return jdbc.update("""
                DELETE FROM worker_skills WHERE id = ? AND worker_user_id = ? AND verification_status <> 'VERIFIED'
                """, workerSkillId, workerUserId);
    }

    public EvidenceRow addEvidence(UUID workerSkillId, UUID submittedBy, SkillEvidenceType type,
                                   String reference, Instant now) {
        EvidenceRow row = new EvidenceRow(UUID.randomUUID(), type, reference, "SUBMITTED", now, null, null);
        jdbc.update("""
                INSERT INTO skill_verification_evidence
                    (id, worker_skill_id, evidence_type, evidence_reference, status,
                     submitted_by_user_id, created_at)
                VALUES (?, ?, ?, ?, 'SUBMITTED', ?, ?)
                """, row.id(), workerSkillId, type.name(), reference, submittedBy, Timestamp.from(now));
        return row;
    }

    public List<EvidenceRow> evidence(UUID workerSkillId) {
        return jdbc.query("""
                SELECT id, evidence_type, evidence_reference, status, created_at, reviewed_at, review_reason
                  FROM skill_verification_evidence WHERE worker_skill_id = ? ORDER BY created_at DESC, id
                """, (rs, n) -> new EvidenceRow(rs.getObject("id", UUID.class),
                SkillEvidenceType.valueOf(rs.getString("evidence_type")), rs.getString("evidence_reference"),
                rs.getString("status"), rs.getTimestamp("created_at").toInstant(),
                rs.getTimestamp("reviewed_at") == null ? null : rs.getTimestamp("reviewed_at").toInstant(),
                rs.getString("review_reason")), workerSkillId);
    }

    public void updateVerificationStatus(UUID workerSkillId, SkillVerificationStatus status, Instant now) {
        jdbc.update("""
                UPDATE worker_skills SET verification_status = ?, version = version + 1, updated_at = ? WHERE id = ?
                """, status.name(), Timestamp.from(now), workerSkillId);
    }

    public Optional<UUID> latestSubmittedEvidence(UUID workerSkillId) {
        return jdbc.query("""
                SELECT id FROM skill_verification_evidence
                 WHERE worker_skill_id = ? AND status = 'SUBMITTED'
                 ORDER BY created_at DESC, id LIMIT 1
                """, (rs, n) -> rs.getObject("id", UUID.class), workerSkillId).stream().findFirst();
    }

    public void reviewEvidence(UUID evidenceId, UUID reviewer, boolean accepted, String reason, Instant now) {
        jdbc.update("""
                UPDATE skill_verification_evidence
                   SET status = ?, reviewed_by_user_id = ?, review_reason = ?, reviewed_at = ?
                 WHERE id = ?
                """, accepted ? "ACCEPTED" : "REJECTED", reviewer, reason, Timestamp.from(now), evidenceId);
    }

    public void addHistory(UUID workerSkillId, SkillVerificationStatus from, SkillVerificationStatus to,
                           UUID actorId, UUID evidenceId, String reason, Instant now) {
        jdbc.update("""
                INSERT INTO worker_skill_verification_history
                    (id, worker_skill_id, from_status, to_status, actor_user_id, evidence_id, reason, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, UUID.randomUUID(), workerSkillId, from == null ? null : from.name(), to.name(),
                actorId, evidenceId, reason, Timestamp.from(now));
    }

    public EndorsementRow endorse(UUID workerSkillId, UUID endorserId, EndorsementRelationship relationship,
                                  String comment, Instant now) {
        EndorsementRow row = new EndorsementRow(UUID.randomUUID(), endorserId, relationship, comment, now);
        jdbc.update("""
                INSERT INTO skill_endorsements
                    (id, worker_skill_id, endorser_user_id, relationship, comment, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """, row.id(), workerSkillId, endorserId, relationship.name(), comment, Timestamp.from(now));
        return row;
    }

    private WorkerSkillRow requireWorkerSkill(UUID workerSkillId) {
        return findWorkerSkill(workerSkillId).orElseThrow();
    }

    private static String workerSkillSelect() {
        return """
                SELECT ws.id, ws.worker_user_id, ws.skill_id, s.name AS skill_name, ws.proficiency,
                       ws.verification_status, ws.version, ws.created_at, ws.updated_at,
                       (SELECT count(*) FROM skill_endorsements e WHERE e.worker_skill_id = ws.id) AS endorsement_count
                  FROM worker_skills ws JOIN skills s ON s.id = ws.skill_id
                """;
    }

    private static SkillRow skill(java.sql.ResultSet rs) throws java.sql.SQLException {
        return new SkillRow(rs.getObject("id", UUID.class), rs.getObject("category_id", UUID.class),
                rs.getString("category_name"), rs.getString("name"), rs.getString("slug"),
                rs.getString("description"), rs.getBoolean("active"), rs.getTimestamp("created_at").toInstant());
    }

    private static WorkerSkillRow workerSkill(java.sql.ResultSet rs) throws java.sql.SQLException {
        return new WorkerSkillRow(rs.getObject("id", UUID.class), rs.getObject("worker_user_id", UUID.class),
                rs.getObject("skill_id", UUID.class), rs.getString("skill_name"),
                SkillProficiency.valueOf(rs.getString("proficiency")),
                SkillVerificationStatus.valueOf(rs.getString("verification_status")), rs.getLong("version"),
                rs.getTimestamp("created_at").toInstant(), rs.getTimestamp("updated_at").toInstant(),
                rs.getInt("endorsement_count"));
    }

    public record CategoryRow(UUID id, String name, String slug, String description, boolean active, Instant createdAt) { }
    public record SkillRow(UUID id, UUID categoryId, String categoryName, String name, String slug,
                           String description, boolean active, Instant createdAt) { }
    public record WorkerSkillRow(UUID id, UUID workerUserId, UUID skillId, String skillName,
                                 SkillProficiency proficiency, SkillVerificationStatus verificationStatus,
                                 long version, Instant createdAt, Instant updatedAt, int endorsementCount) { }
    public record EvidenceRow(UUID id, SkillEvidenceType evidenceType, String evidenceReference, String status,
                              Instant createdAt, Instant reviewedAt, String reviewReason) { }
    public record EndorsementRow(UUID id, UUID endorserUserId, EndorsementRelationship relationship,
                                 String comment, Instant createdAt) { }
}
