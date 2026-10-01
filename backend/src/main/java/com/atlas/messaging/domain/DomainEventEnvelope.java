package com.atlas.messaging.domain;

import java.time.Instant;
import java.util.UUID;

public record DomainEventEnvelope(
        UUID eventId,
        String aggregateType,
        UUID aggregateId,
        Long sequenceNo,
        String eventType,
        String payload,
        Instant occurredAt) { }
