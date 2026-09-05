package com.atlas.job.domain;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record JobDetailView(
        UUID id,
        UUID organizationId,
        String organizationName,
        String organizationSlug,
        String organizationVerificationStatus,
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
        List<JobSkillRequirement> requiredSkills,
        List<JobCredentialRequirement> requiredCredentials,
        long version,
        Instant createdAt,
        Instant updatedAt
) {}
