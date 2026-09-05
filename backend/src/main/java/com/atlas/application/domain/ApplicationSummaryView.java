package com.atlas.application.domain;

import java.time.Instant;
import java.util.UUID;

public record ApplicationSummaryView(
        UUID id,
        UUID organizationId,
        ApplicationTargetType targetType,
        UUID targetId,
        String targetTitle,
        UUID workerId,
        String workerName,
        ApplicationStatus status,
        Long proposedRatePence,
        long version,
        Instant createdAt,
        Instant updatedAt
) {}
