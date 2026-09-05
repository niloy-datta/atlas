package com.atlas.job.domain;

import java.time.Instant;
import java.util.UUID;

public record JobRow(
        UUID id,
        UUID organizationId,
        String title,
        String description,
        JobType jobType,
        JobStatus status,
        String locationName,
        String formattedAddress,
        Double latitude,
        Double longitude,
        Long budgetMinPence,
        Long budgetMaxPence,
        String currency,
        long version,
        Instant createdAt,
        Instant updatedAt
) {}
