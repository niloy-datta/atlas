package com.atlas.workledger.web;

import com.atlas.identity.domain.AtlasPrincipal;
import com.atlas.workledger.application.WorkLedgerService;
import com.atlas.workledger.infrastructure.WorkLedgerRepository.LedgerEntry;
import com.atlas.workledger.infrastructure.WorkLedgerRepository.WorkerProjection;
import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/workers/me/work-ledger")
public class WorkLedgerController {
    private final WorkLedgerService ledger;

    public WorkLedgerController(WorkLedgerService ledger) {
        this.ledger = ledger;
    }

    @GetMapping
    List<LedgerEntry> list(@AuthenticationPrincipal AtlasPrincipal principal,
                           @RequestParam(defaultValue = "50") int limit) {
        return ledger.list(principal.requireUserId(), limit);
    }

    @GetMapping("/summary")
    WorkerProjection summary(@AuthenticationPrincipal AtlasPrincipal principal) {
        return ledger.projection(principal.requireUserId());
    }
}
