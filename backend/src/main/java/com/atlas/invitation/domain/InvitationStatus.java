package com.atlas.invitation.domain;

import java.util.Map;
import java.util.Set;

public enum InvitationStatus {
    PENDING,
    ACCEPTED,
    DECLINED,
    EXPIRED,
    CANCELLED;

    private static final Map<InvitationStatus, Set<InvitationStatus>> ALLOWED = Map.of(
            PENDING, Set.of(ACCEPTED, DECLINED, EXPIRED, CANCELLED),
            ACCEPTED, Set.of(),
            DECLINED, Set.of(),
            EXPIRED, Set.of(),
            CANCELLED, Set.of()
    );

    public boolean canTransitionTo(InvitationStatus next) {
        return ALLOWED.getOrDefault(this, Set.of()).contains(next);
    }
}
