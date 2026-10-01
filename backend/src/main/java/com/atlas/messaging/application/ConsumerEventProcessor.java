package com.atlas.messaging.application;

import com.atlas.messaging.domain.DomainEventEnvelope;
import com.atlas.messaging.infrastructure.ConsumerEventRepository;
import java.time.Clock;
import java.time.Instant;
import java.util.Set;
import java.util.UUID;
import java.util.function.Consumer;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

@Service
public class ConsumerEventProcessor {
    private static final Set<String> SUPPORTED_EVENTS = Set.of(
            "workledger.reservation_confirmed.v1",
            "workledger.reservation_cancelled.v1",
            "workledger.shift_completed.v1");

    private final ConsumerEventRepository repository;
    private final ObjectMapper json;
    private final Clock clock;

    public ConsumerEventProcessor(ConsumerEventRepository repository,
                                  ObjectMapper json,
                                  Clock clock) {
        this.repository = repository;
        this.json = json;
        this.clock = clock;
    }

    @Transactional
    public Result process(String consumerName, DomainEventEnvelope event,
                          Consumer<DomainEventEnvelope> handler) {
        Instant now = Instant.now(clock);
        if (!repository.tryClaim(consumerName, event.eventId(), safe(event.eventType()),
                event.aggregateId(), event.sequenceNo(), now)) {
            return Result.DUPLICATE;
        }

        if (!validEnvelope(event) || !SUPPORTED_EVENTS.contains(event.eventType())) {
            repository.deadLetter(UUID.randomUUID(), consumerName, event.eventId(),
                    event.eventType(), event.payload(), "Unsupported or invalid event envelope", now);
            repository.updateResult(consumerName, event.eventId(), Result.POISON.name(), now);
            return Result.POISON;
        }

        try {
            json.readTree(event.payload());
        } catch (JacksonException exception) {
            repository.deadLetter(UUID.randomUUID(), consumerName, event.eventId(),
                    event.eventType(), event.payload(), "Invalid JSON payload", now);
            repository.updateResult(consumerName, event.eventId(), Result.POISON.name(), now);
            return Result.POISON;
        }

        if (event.sequenceNo() != null) {
            var last = repository.lastSequence(consumerName, event.aggregateId());
            if (last.isPresent() && event.sequenceNo() <= last.getAsLong()) {
                repository.updateResult(consumerName, event.eventId(), Result.OUT_OF_ORDER.name(), now);
                return Result.OUT_OF_ORDER;
            }
        }

        handler.accept(event);

        if (event.sequenceNo() != null) {
            repository.updateOffset(consumerName, event.aggregateId(),
                    event.sequenceNo(), event.eventId(), now);
        }
        repository.updateResult(consumerName, event.eventId(), Result.PROCESSED.name(), now);
        return Result.PROCESSED;
    }

    private static boolean validEnvelope(DomainEventEnvelope event) {
        return event != null
                && event.eventId() != null
                && event.aggregateId() != null
                && event.aggregateType() != null
                && !event.aggregateType().isBlank()
                && event.eventType() != null
                && !event.eventType().isBlank()
                && event.payload() != null
                && event.occurredAt() != null;
    }

    private static String safe(String value) {
        return value == null ? "INVALID" : value;
    }

    public enum Result {
        PROCESSED,
        DUPLICATE,
        OUT_OF_ORDER,
        POISON
    }
}
