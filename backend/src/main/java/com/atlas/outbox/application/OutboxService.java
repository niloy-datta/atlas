package com.atlas.outbox.application;

import com.atlas.outbox.infrastructure.OutboxRepository;
import com.atlas.outbox.infrastructure.OutboxRepository.OutboxEvent;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OutboxService {
    private final OutboxRepository repository;
    private final Clock clock;

    public OutboxService(OutboxRepository repository, Clock clock) {
        this.repository = repository;
        this.clock = clock;
    }

    @Transactional
    public OutboxEvent append(String aggregateType, UUID aggregateId,
                              String eventType, String payloadJson, Instant occurredAt) {
        return append(aggregateType, aggregateId, null, eventType, payloadJson, occurredAt);
    }

    @Transactional
    public OutboxEvent append(String aggregateType, UUID aggregateId, Long sequenceNo,
                              String eventType, String payloadJson, Instant occurredAt) {
        Instant now = Instant.now(clock);
        OutboxEvent event = new OutboxEvent(
                UUID.randomUUID(), aggregateType, aggregateId, sequenceNo, eventType,
                payloadJson, occurredAt, now, null, 0, null);
        repository.append(event);
        return event;
    }

    @Transactional(readOnly = true)
    public List<OutboxEvent> pending(int limit) {
        return repository.pending(Math.clamp(limit, 1, 500));
    }

    @Transactional(readOnly = true)
    public long pendingCount() {
        return repository.pendingCount();
    }
}
