package com.atlas.credential.domain;

import com.atlas.shared.error.ApiProblemException;
import org.springframework.http.HttpStatus;

public enum CredentialVerificationStatus {
    UNVERIFIED,
    PENDING,
    VERIFIED,
    REJECTED,
    REVOKED;

    public void requireSubmission() {
        if (this != UNVERIFIED && this != REJECTED && this != REVOKED) throw invalid();
    }

    public void requireAdminTransitionTo(CredentialVerificationStatus target) {
        boolean allowed = switch (this) {
            case PENDING -> target == VERIFIED || target == REJECTED;
            case VERIFIED -> target == REVOKED;
            default -> false;
        };
        if (!allowed) throw invalid();
    }

    private static ApiProblemException invalid() {
        return new ApiProblemException(HttpStatus.CONFLICT, "CREDENTIAL_VERIFICATION_TRANSITION_INVALID",
                "Credential verification transition rejected",
                "The requested credential verification transition is not allowed.");
    }
}
