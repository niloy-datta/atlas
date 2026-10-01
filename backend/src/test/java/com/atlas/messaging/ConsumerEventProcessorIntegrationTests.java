package com.atlas.messaging;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.atlas.TestcontainersConfiguration;
import com.atlas.messaging.application.ConsumerEventProcessor;
import com.atlas.messaging.application.ConsumerEventProcessor.Result;
import com.atlas.messaging.domain.DomainEventEnvelope;
import com.atlas.messaging.infrastructure.ConsumerEventRepository;
import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
class ConsumerEventProcessorIntegrationTests {
    private final ConsumerEventProcessor processor;
    private final ConsumerEventRepository repository;

    @Autowired
    ConsumerEventProcessorIntegrationTests(ConsumerEventProcessor processor,
                                           ConsumerEventRepository repository) {
        this.processor = processor;
        this.repository = repository;
    }

    @Test
    void redeliveryRunsHandlerOnlyOnce() {
        String consumer = "redelivery-" + UUID.randomUUID();
        DomainEventEnvelope event = event(UUID.randomUUID(), UUID.randomUUID(), 10L,
                "workledger.shift_completed.v1", "{}");
        AtomicInteger effects = new AtomicInteger();

        assertThat(processor.process(consumer, event, ignored -> effects.incrementAndGet()))
                .isEqualTo(Result.PROCESSED);
        assertThat(processor.process(consumer, event, ignored -> effects.incrementAndGet()))
                .isEqualTo(Result.DUPLICATE);

        assertThat(effects).hasValue(1);
        assertThat(repository.processedCount(consumer, event.eventId())).isEqualTo(1);
    }

    @Test
    void handlerFailureRollsBackClaimSoRedeliveryCanRetry() {
        String consumer = "retry-" + UUID.randomUUID();
        DomainEventEnvelope event = event(UUID.randomUUID(), UUID.randomUUID(), 20L,
                "workledger.reservation_confirmed.v1", "{}");

        assertThatThrownBy(() -> processor.process(consumer, event, ignored -> {
            throw new IllegalStateException("simulated consumer crash");
        })).isInstanceOf(IllegalStateException.class);

        assertThat(repository.processedCount(consumer, event.eventId())).isZero();

        assertThat(processor.process(consumer, event, ignored -> { }))
                .isEqualTo(Result.PROCESSED);
        assertThat(repository.processedCount(consumer, event.eventId())).isEqualTo(1);
    }

    @Test
    void olderAggregateSequenceCannotOverwriteNewerProjection() {
        String consumer = "ordering-" + UUID.randomUUID();
        UUID aggregateId = UUID.randomUUID();
        AtomicInteger effects = new AtomicInteger();

        DomainEventEnvelope newer = event(UUID.randomUUID(), aggregateId, 50L,
                "workledger.shift_completed.v1", "{}");
        DomainEventEnvelope older = event(UUID.randomUUID(), aggregateId, 40L,
                "workledger.reservation_confirmed.v1", "{}");
        DomainEventEnvelope newest = event(UUID.randomUUID(), aggregateId, 60L,
                "workledger.reservation_cancelled.v1", "{}");

        assertThat(processor.process(consumer, newer, ignored -> effects.incrementAndGet()))
                .isEqualTo(Result.PROCESSED);
        assertThat(processor.process(consumer, older, ignored -> effects.incrementAndGet()))
                .isEqualTo(Result.OUT_OF_ORDER);
        assertThat(processor.process(consumer, newest, ignored -> effects.incrementAndGet()))
                .isEqualTo(Result.PROCESSED);

        assertThat(effects).hasValue(2);
    }

    @Test
    void poisonMessageIsDeadLetteredAndThenDeduplicated() {
        String consumer = "poison-" + UUID.randomUUID();
        DomainEventEnvelope poison = event(UUID.randomUUID(), UUID.randomUUID(), 1L,
                "unknown.event.v1", "{not-json");

        assertThat(processor.process(consumer, poison, ignored -> {
            throw new AssertionError("poison handler must not run");
        })).isEqualTo(Result.POISON);

        assertThat(repository.deadLetterCount(consumer, poison.eventId())).isEqualTo(1);

        assertThat(processor.process(consumer, poison, ignored -> { }))
                .isEqualTo(Result.DUPLICATE);
        assertThat(repository.deadLetterCount(consumer, poison.eventId())).isEqualTo(1);
    }

    private static DomainEventEnvelope event(UUID eventId, UUID aggregateId, Long sequence,
                                             String eventType, String payload) {
        return new DomainEventEnvelope(eventId, "WORK_LEDGER", aggregateId,
                sequence, eventType, payload, Instant.parse("2026-10-01T12:00:00Z"));
    }
}
