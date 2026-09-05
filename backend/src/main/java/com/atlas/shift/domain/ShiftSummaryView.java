package com.atlas.shift.domain;

import java.time.Instant;
import java.util.UUID;

public record ShiftSummaryView(
        UUID id,
        UUID jobId,
        String jobTitle,
        UUID organizationId,
        String organizationName,
        String organizationSlug,
        String organizationVerificationStatus,
        String title,
        Instant startTime,
        Instant endTime,
        String timezone,
        int capacity,
        long hourlyRatePence,
        String currency,
        ShiftStatus status,
        String locationName,
        String formattedAddress,
        Double latitude,
        Double longitude,
        int requiredSkillsCount,
        int requiredCredentialsCount,
        Double distanceMeters,
        Instant createdAt
) {}

