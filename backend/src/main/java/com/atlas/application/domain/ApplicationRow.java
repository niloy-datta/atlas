package com.atlas.application.domain;

import java.time.Instant;
import java.util.UUID;

public record ApplicationRow(
        UUID id,
        UUID organizationId,
        UUID jobId,
        UUID shiftId,
        UUID workerId,
        ApplicationStatus status,
        String coverNote,
        Long proposedRatePence,
        long version,
        Instant createdAt,
        Instant updatedAt
) {
    public ApplicationTargetType targetType() {
        return jobId != null ? ApplicationTargetType.JOB : ApplicationTargetType.SHIFT;
    }

    public UUID targetId() {
        return jobId != null ? jobId : shiftId;
    }
}
