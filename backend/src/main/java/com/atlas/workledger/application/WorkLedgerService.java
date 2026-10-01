package com.atlas.workledger.application;

import com.atlas.outbox.application.OutboxService;
import com.atlas.workledger.infrastructure.WorkLedgerRepository;
import com.atlas.workledger.infrastructure.WorkLedgerRepository.LedgerEntry;
import com.atlas.workledger.infrastructure.WorkLedgerRepository.WorkerProjection;
import java.time.Clock;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

@Service
public class WorkLedgerService {
    private final WorkLedgerRepository ledger;
    private final OutboxService outbox;
    private final ObjectMapper json;
    private final Clock clock;

    public WorkLedgerService(WorkLedgerRepository ledger,
                             OutboxService outbox,
                             ObjectMapper json,
                             Clock clock) {
        this.ledger = ledger;
        this.outbox = outbox;
        this.json = json;
        this.clock = clock;
    }

    @Transactional
    public LedgerEntry record(UUID workerUserId, UUID organizationId, UUID shiftId,
                              UUID reservationId, String eventType) {
        Instant now = Instant.now(clock);
        LedgerEntry entry = ledger.append(UUID.randomUUID(), workerUserId, organizationId, shiftId,
                reservationId, eventType, now, "{}", now);

        outbox.append(
                "WORK_LEDGER",
                entry.id(),
                "workledger." + eventType.toLowerCase(Locale.ROOT) + ".v1",
                payload(entry),
                now);

        return entry;
    }

    @Transactional(readOnly = true)
    public List<LedgerEntry> list(UUID workerUserId, int limit) {
        return ledger.listForWorker(workerUserId, Math.clamp(limit, 1, 200));
    }

    @Transactional(readOnly = true)
    public WorkerProjection projection(UUID workerUserId) {
        return ledger.projection(workerUserId);
    }

    private String payload(LedgerEntry entry) {
        try {
            return json.writeValueAsString(Map.of(
                    "ledgerEntryId", entry.id(),
                    "workerUserId", entry.workerUserId(),
                    "organizationId", entry.organizationId(),
                    "shiftId", entry.shiftId(),
                    "reservationId", entry.reservationId(),
                    "eventType", entry.eventType(),
                    "occurredAt", entry.occurredAt()));
        } catch (JacksonException exception) {
            throw new IllegalStateException("Could not serialize work ledger outbox event", exception);
        }
    }
}
