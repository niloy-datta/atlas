package com.atlas.job.domain;

import java.util.Map;
import java.util.Set;

public enum JobStatus {
    DRAFT,
    PUBLISHED,
    PAUSED,
    CLOSED,
    CANCELLED,
    COMPLETED;

    private static final Map<JobStatus, Set<JobStatus>> ALLOWED_TRANSITIONS = Map.of(
            DRAFT, Set.of(PUBLISHED, CANCELLED),
            PUBLISHED, Set.of(PAUSED, CLOSED, CANCELLED, COMPLETED),
            PAUSED, Set.of(PUBLISHED, CLOSED, CANCELLED),
            CLOSED, Set.of(CANCELLED),
            CANCELLED, Set.of(),
            COMPLETED, Set.of()
    );

    public boolean canTransitionTo(JobStatus next) {
        return ALLOWED_TRANSITIONS.getOrDefault(this, Set.of()).contains(next);
    }
}
