package com.atlas.job.domain;

import java.time.Instant;
import java.util.UUID;

public record JobSummaryView(
        UUID id,
        UUID organizationId,
        String organizationName,
        String organizationSlug,
        String organizationVerificationStatus,
        String title,
        JobType jobType,
        JobStatus status,
        String locationName,
        String formattedAddress,
        Double latitude,
        Double longitude,
        Long budgetMinPence,
        Long budgetMaxPence,
        String currency,
        int requiredSkillsCount,
        int requiredCredentialsCount,
        Double distanceMeters,
        Instant createdAt
) {}

