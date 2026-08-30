package com.atlas.skill.domain;

import com.atlas.shared.error.ApiProblemException;
import org.springframework.http.HttpStatus;

public enum SkillVerificationStatus {
    SELF_DECLARED,
    EVIDENCE_SUBMITTED,
    VERIFIED,
    REJECTED,
    REVOKED;

    public void requireWorkerEvidenceSubmission() {
        if (this != SELF_DECLARED && this != REJECTED && this != REVOKED) {
            throw invalidTransition();
        }
    }

    public void requireAdminTransitionTo(SkillVerificationStatus target) {
        boolean allowed = switch (this) {
            case EVIDENCE_SUBMITTED -> target == VERIFIED || target == REJECTED;
            case VERIFIED -> target == REVOKED;
            default -> false;
        };
        if (!allowed) throw invalidTransition();
    }

    private static ApiProblemException invalidTransition() {
        return new ApiProblemException(HttpStatus.CONFLICT, "SKILL_VERIFICATION_TRANSITION_INVALID",
                "Skill verification transition rejected", "The requested skill verification transition is not allowed.");
    }
}
