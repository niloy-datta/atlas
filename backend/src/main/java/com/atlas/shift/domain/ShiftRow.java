package com.atlas.shift.domain;

import java.time.Instant;
import java.util.UUID;

public record ShiftRow(
        UUID id,
        UUID jobId,
        UUID organizationId,
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
        long version,
        Instant createdAt,
        Instant updatedAt
) {}
