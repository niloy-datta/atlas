package com.atlas.invitation.domain;

import java.time.Instant;
import java.util.UUID;

public record InvitationDetailView(
        UUID id,
        UUID organizationId,
        InvitationTargetType targetType,
        UUID targetId,
        String targetTitle,
        UUID workerId,
        String workerName,
        UUID senderId,
        InvitationStatus status,
        Long offeredRatePence,
        String message,
        Instant expiresAt,
        long version,
        Instant createdAt,
        Instant updatedAt
) {}
