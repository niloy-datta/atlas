package com.atlas.shift.domain;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ShiftDetailView(
        UUID id,
        UUID jobId,
        String jobTitle,
        UUID organizationId,
        String organizationName,
        String organizationSlug,
        String organizationVerificationStatus,
        String title,
        String description,
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
        List<ShiftSkillRequirement> requiredSkills,
        List<ShiftCredentialRequirement> requiredCredentials,
        long version,
        Instant createdAt,
        Instant updatedAt
) {}
