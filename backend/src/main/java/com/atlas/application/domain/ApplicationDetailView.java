package com.atlas.application.domain;

import java.time.Instant;
import java.util.UUID;

public record ApplicationDetailView(
        UUID id,
        UUID organizationId,
        ApplicationTargetType targetType,
        UUID targetId,
        String targetTitle,
        UUID workerId,
        String workerName,
        ApplicationStatus status,
        String coverNote,
        Long proposedRatePence,
        long version,
        Instant createdAt,
        Instant updatedAt
) {}
