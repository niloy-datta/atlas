package com.atlas.organization.domain;

import com.atlas.shared.error.ApiProblemException;
import org.springframework.http.HttpStatus;

public enum OrganizationVerificationStatus {
    UNVERIFIED,
    PENDING,
    VERIFIED,
    SUSPENDED;

    public void requireTransitionTo(OrganizationVerificationStatus target) {
        boolean allowed = switch (this) {
            case UNVERIFIED -> target == PENDING;
            case PENDING -> target == VERIFIED || target == UNVERIFIED || target == SUSPENDED;
            case VERIFIED -> target == SUSPENDED;
            case SUSPENDED -> target == VERIFIED;
        };
        if (!allowed) {
            throw new ApiProblemException(HttpStatus.CONFLICT, "ORGANIZATION_VERIFICATION_TRANSITION_INVALID",
                    "Verification transition rejected", "The requested organization verification transition is not allowed.");
        }
    }
}
