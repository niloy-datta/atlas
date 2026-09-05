package com.atlas.job.domain;

import java.time.Instant;
import java.util.UUID;

public record JobCredentialRequirement(
        UUID id,
        UUID jobId,
        String credentialType,
        String title,
        String issuer,
        boolean required,
        Instant createdAt
) {}
