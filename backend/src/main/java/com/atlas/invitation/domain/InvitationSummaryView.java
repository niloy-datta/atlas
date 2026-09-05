package com.atlas.invitation.domain;

import java.time.Instant;
import java.util.UUID;

public record InvitationSummaryView(
        UUID id,
        UUID organizationId,
        InvitationTargetType targetType,
        UUID targetId,
        String targetTitle,
        UUID workerId,
        String workerName,
        InvitationStatus status,
        Long offeredRatePence,
        Instant expiresAt,
        long version,
        Instant createdAt,
        Instant updatedAt
) {}
