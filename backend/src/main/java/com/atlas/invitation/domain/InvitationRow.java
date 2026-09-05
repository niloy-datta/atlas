package com.atlas.invitation.domain;

import java.time.Instant;
import java.util.UUID;

public record InvitationRow(
        UUID id,
        UUID organizationId,
        UUID jobId,
        UUID shiftId,
        UUID workerId,
        UUID senderId,
        InvitationStatus status,
        Long offeredRatePence,
        String message,
        Instant expiresAt,
        long version,
        Instant createdAt,
        Instant updatedAt
) {
    public InvitationTargetType targetType() {
        return jobId != null ? InvitationTargetType.JOB : InvitationTargetType.SHIFT;
    }

    public UUID targetId() {
        return jobId != null ? jobId : shiftId;
    }
}
