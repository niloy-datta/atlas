package com.atlas.shift.domain;

import java.time.Instant;
import java.util.UUID;

public record ShiftCredentialRequirement(
        UUID id,
        UUID shiftId,
        String credentialType,
        String title,
        String issuer,
        boolean required,
        Instant createdAt
) {}

