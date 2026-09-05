package com.atlas.invitation.domain;

import java.time.Instant;
import java.util.UUID;

public record CreateInvitationCommand(
        UUID workerId,
        Long offeredRatePence,
        String message,
        Instant expiresAt
) {}
