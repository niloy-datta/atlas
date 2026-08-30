package com.atlas.skill.application;

import com.atlas.shared.error.ApiProblemException;
import com.atlas.skill.domain.EndorsementRelationship;
import com.atlas.skill.domain.SkillEvidenceType;
import com.atlas.skill.domain.SkillProficiency;
import com.atlas.skill.domain.SkillVerificationStatus;
import com.atlas.skill.infrastructure.SkillRepository;
import com.atlas.skill.infrastructure.SkillRepository.CategoryRow;
import com.atlas.skill.infrastructure.SkillRepository.EndorsementRow;
import com.atlas.skill.infrastructure.SkillRepository.EvidenceRow;
import com.atlas.skill.infrastructure.SkillRepository.SkillRow;
import com.atlas.skill.infrastructure.SkillRepository.WorkerSkillRow;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SkillService {
    private final SkillRepository skills;
    private final Clock clock;

    public SkillService(SkillRepository skills, Clock clock) {
        this.skills = skills;
        this.clock = clock;
    }

    @Transactional
    public CategoryRow createCategory(String name, String slug, String description) {
        try {
            return skills.createCategory(clean(name), normalizeSlug(slug), clean(description), Instant.now(clock));
        } catch (DataIntegrityViolationException exception) {
            throw conflict("SKILL_CATEGORY_CONFLICT", "Skill category conflict",
                    "A skill category with that name or slug already exists.");
        }
    }

    @Transactional
    public SkillRow createSkill(UUID categoryId, String name, String slug, String description) {
        if (!skills.activeCategoryExists(categoryId)) throw categoryNotFound();
        try {
            return skills.createSkill(categoryId, clean(name), normalizeSlug(slug), clean(description), Instant.now(clock));
        } catch (DataIntegrityViolationException exception) {
            throw conflict("SKILL_CATALOGUE_CONFLICT", "Skill catalogue conflict",
                    "A skill with that name or slug already exists.");
        }
    }

    @Transactional
    public SkillRow setSkillActive(UUID skillId, boolean active) {
        if (skills.setSkillActive(skillId, active, Instant.now(clock)) == 0) throw skillNotFound();
        return skills.findSkill(skillId).orElseThrow(SkillService::skillNotFound);
    }

    @Transactional(readOnly = true)
    public List<CategoryRow> categories() {
        return skills.activeCategories();
    }

    @Transactional(readOnly = true)
    public List<SkillRow> search(String query, UUID categoryId, int limit) {
        return skills.search(query, categoryId, Math.min(Math.max(limit, 1), 100));
    }

    @Transactional
    public WorkerSkillView declare(UUID workerId, UUID skillId, SkillProficiency proficiency) {
        SkillRow skill = skills.findSkill(skillId).filter(SkillRow::active).orElseThrow(SkillService::skillNotFound);
        try {
            WorkerSkillRow row = skills.addWorkerSkill(workerId, skill.id(), proficiency, Instant.now(clock));
            return view(row);
        } catch (DataIntegrityViolationException exception) {
            throw conflict("WORKER_SKILL_ALREADY_EXISTS", "Worker skill already exists",
                    "This skill is already attached to the worker.");
        }
    }

    @Transactional(readOnly = true)
    public List<WorkerSkillView> workerSkills(UUID workerId) {
        return skills.workerSkills(workerId).stream().map(this::view).toList();
    }

    @Transactional
    public WorkerSkillView updateProficiency(UUID workerId, UUID workerSkillId, long expectedVersion,
                                             SkillProficiency proficiency) {
        WorkerSkillRow current = requireOwned(workerSkillId, workerId);
        if (skills.updateProficiency(workerSkillId, workerId, expectedVersion, proficiency, Instant.now(clock)) == 0) {
            if (current.version() != expectedVersion) throw versionConflict();
            throw workerSkillNotFound();
        }
        return view(skills.findWorkerSkill(workerSkillId).orElseThrow(SkillService::workerSkillNotFound));
    }

    @Transactional
    public void remove(UUID workerId, UUID workerSkillId) {
        WorkerSkillRow current = requireOwned(workerSkillId, workerId);
        if (current.verificationStatus() == SkillVerificationStatus.VERIFIED) {
            throw conflict("VERIFIED_SKILL_REMOVAL_DENIED", "Verified skill cannot be removed",
                    "Request platform revocation before removing a verified skill.");
        }
        skills.deleteWorkerSkill(workerSkillId, workerId);
    }

    @Transactional
    public WorkerSkillView submitEvidence(UUID workerId, UUID workerSkillId, SkillEvidenceType type,
                                          String evidenceReference) {
        WorkerSkillRow current = skills.findWorkerSkillForUpdate(workerSkillId)
                .filter(row -> row.workerUserId().equals(workerId)).orElseThrow(SkillService::workerSkillNotFound);
        current.verificationStatus().requireWorkerEvidenceSubmission();
        Instant now = Instant.now(clock);
        EvidenceRow evidence = skills.addEvidence(workerSkillId, workerId, type, clean(evidenceReference), now);
        skills.updateVerificationStatus(workerSkillId, SkillVerificationStatus.EVIDENCE_SUBMITTED, now);
        skills.addHistory(workerSkillId, current.verificationStatus(), SkillVerificationStatus.EVIDENCE_SUBMITTED,
                workerId, evidence.id(), "Worker submitted verification evidence", now);
        return view(skills.findWorkerSkill(workerSkillId).orElseThrow(SkillService::workerSkillNotFound));
    }

    @Transactional
    public WorkerSkillView transitionVerification(UUID platformAdminId, UUID workerSkillId,
                                                  SkillVerificationStatus target, String reason) {
        WorkerSkillRow current = skills.findWorkerSkillForUpdate(workerSkillId)
                .orElseThrow(SkillService::workerSkillNotFound);
        current.verificationStatus().requireAdminTransitionTo(target);
        Instant now = Instant.now(clock);
        UUID evidenceId = null;
        if (target == SkillVerificationStatus.VERIFIED || target == SkillVerificationStatus.REJECTED) {
            evidenceId = skills.latestSubmittedEvidence(workerSkillId)
                    .orElseThrow(() -> conflict("SKILL_EVIDENCE_REQUIRED", "Skill evidence required",
                            "Submitted evidence is required for this verification decision."));
            skills.reviewEvidence(evidenceId, platformAdminId, target == SkillVerificationStatus.VERIFIED,
                    clean(reason), now);
        }
        skills.updateVerificationStatus(workerSkillId, target, now);
        skills.addHistory(workerSkillId, current.verificationStatus(), target, platformAdminId, evidenceId,
                clean(reason), now);
        return view(skills.findWorkerSkill(workerSkillId).orElseThrow(SkillService::workerSkillNotFound));
    }

    @Transactional
    public EndorsementRow endorse(UUID actorId, UUID workerSkillId, EndorsementRelationship relationship,
                                  String comment) {
        WorkerSkillRow workerSkill = skills.findWorkerSkill(workerSkillId).orElseThrow(SkillService::workerSkillNotFound);
        if (workerSkill.workerUserId().equals(actorId)) {
            throw new ApiProblemException(HttpStatus.FORBIDDEN, "SKILL_SELF_ENDORSEMENT_DENIED",
                    "Self-endorsement denied", "Workers cannot endorse their own skills.");
        }
        if (workerSkill.verificationStatus() != SkillVerificationStatus.VERIFIED) {
            throw conflict("SKILL_ENDORSEMENT_REQUIRES_VERIFICATION", "Verified skill required",
                    "Only verified skills can receive endorsements.");
        }
        try {
            return skills.endorse(workerSkillId, actorId, relationship, clean(comment), Instant.now(clock));
        } catch (DataIntegrityViolationException exception) {
            throw conflict("SKILL_ENDORSEMENT_ALREADY_EXISTS", "Skill endorsement already exists",
                    "This account has already endorsed the skill.");
        }
    }

    private WorkerSkillView view(WorkerSkillRow row) {
        return new WorkerSkillView(row.id(), row.skillId(), row.skillName(), row.proficiency(),
                row.verificationStatus(), row.version(), skills.evidence(row.id()), row.endorsementCount(),
                row.createdAt(), row.updatedAt());
    }

    private WorkerSkillRow requireOwned(UUID workerSkillId, UUID workerId) {
        return skills.findWorkerSkill(workerSkillId).filter(row -> row.workerUserId().equals(workerId))
                .orElseThrow(SkillService::workerSkillNotFound);
    }

    private static String normalizeSlug(String value) { return value.trim().toLowerCase(Locale.ROOT); }
    private static String clean(String value) {
        if (value == null) return null;
        String result = value.trim();
        return result.isEmpty() ? null : result;
    }
    private static ApiProblemException categoryNotFound() {
        return new ApiProblemException(HttpStatus.NOT_FOUND, "SKILL_CATEGORY_NOT_FOUND",
                "Skill category not found", "The requested active skill category does not exist.");
    }
    private static ApiProblemException skillNotFound() {
        return new ApiProblemException(HttpStatus.NOT_FOUND, "SKILL_NOT_FOUND",
                "Skill not found", "The requested active skill does not exist.");
    }
    private static ApiProblemException workerSkillNotFound() {
        return new ApiProblemException(HttpStatus.NOT_FOUND, "WORKER_SKILL_NOT_FOUND",
                "Worker skill not found", "The requested worker skill does not exist or is not accessible.");
    }
    private static ApiProblemException versionConflict() {
        return conflict("WORKER_SKILL_VERSION_CONFLICT", "Worker skill update conflict",
                "The worker skill changed since it was read.");
    }
    private static ApiProblemException conflict(String code, String title, String detail) {
        return new ApiProblemException(HttpStatus.CONFLICT, code, title, detail);
    }

    public record WorkerSkillView(UUID id, UUID skillId, String skillName, SkillProficiency proficiency,
                                  SkillVerificationStatus verificationStatus, long version,
                                  List<EvidenceRow> evidence, int endorsementCount,
                                  Instant createdAt, Instant updatedAt) { }
}
