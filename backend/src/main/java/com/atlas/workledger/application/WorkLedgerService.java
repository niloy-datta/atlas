package com.atlas.workledger.application;

import com.atlas.workledger.infrastructure.WorkLedgerRepository;
import com.atlas.workledger.infrastructure.WorkLedgerRepository.LedgerEntry;
import com.atlas.workledger.infrastructure.WorkLedgerRepository.WorkerProjection;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WorkLedgerService {
    private final WorkLedgerRepository ledger;
    private final Clock clock;

    public WorkLedgerService(WorkLedgerRepository ledger, Clock clock) {
        this.ledger = ledger;
        this.clock = clock;
    }

    @Transactional
    public LedgerEntry record(UUID workerUserId, UUID organizationId, UUID shiftId,
                              UUID reservationId, String eventType) {
        Instant now = Instant.now(clock);
        return ledger.append(UUID.randomUUID(), workerUserId, organizationId, shiftId,
                reservationId, eventType, now, "{}", now);
    }

    @Transactional(readOnly = true)
    public List<LedgerEntry> list(UUID workerUserId, int limit) {
        return ledger.listForWorker(workerUserId, Math.clamp(limit, 1, 200));
    }

    @Transactional(readOnly = true)
    public WorkerProjection projection(UUID workerUserId) {
        return ledger.projection(workerUserId);
    }
}
