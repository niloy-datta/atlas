package com.atlas.shift.domain;

import java.util.Map;
import java.util.Set;

public enum ShiftStatus {
    DRAFT,
    PUBLISHED,
    IN_PROGRESS,
    COMPLETED,
    CANCELLED;

    private static final Map<ShiftStatus, Set<ShiftStatus>> ALLOWED_TRANSITIONS = Map.of(
            DRAFT, Set.of(PUBLISHED, CANCELLED),
            PUBLISHED, Set.of(IN_PROGRESS, COMPLETED, CANCELLED),
            IN_PROGRESS, Set.of(COMPLETED, CANCELLED),
            COMPLETED, Set.of(),
            CANCELLED, Set.of()
    );

    public boolean canTransitionTo(ShiftStatus next) {
        return ALLOWED_TRANSITIONS.getOrDefault(this, Set.of()).contains(next);
    }
}

