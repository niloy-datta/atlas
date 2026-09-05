package com.atlas.application.domain;

import java.util.Map;
import java.util.Set;

public enum ApplicationStatus {
    SUBMITTED,
    UNDER_REVIEW,
    SHORTLISTED,
    ACCEPTED,
    REJECTED,
    WITHDRAWN;

    private static final Map<ApplicationStatus, Set<ApplicationStatus>> ALLOWED = Map.of(
            SUBMITTED, Set.of(UNDER_REVIEW, WITHDRAWN),
            UNDER_REVIEW, Set.of(SHORTLISTED, ACCEPTED, REJECTED, WITHDRAWN),
            SHORTLISTED, Set.of(ACCEPTED, REJECTED, WITHDRAWN),
            ACCEPTED, Set.of(),
            REJECTED, Set.of(),
            WITHDRAWN, Set.of()
    );

    public boolean canTransitionTo(ApplicationStatus next) {
        return ALLOWED.getOrDefault(this, Set.of()).contains(next);
    }
}
