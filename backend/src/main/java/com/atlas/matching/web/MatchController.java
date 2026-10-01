package com.atlas.matching.web;

import com.atlas.identity.domain.AtlasPrincipal;
import com.atlas.matching.application.MatchService;
import com.atlas.matching.application.MatchService.MatchResponse;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/organizations/{organizationId}")
public class MatchController {
    private final MatchService matching;

    public MatchController(MatchService matching) {
        this.matching = matching;
    }

    @GetMapping("/jobs/{jobId}/matches")
    MatchResponse jobMatches(@PathVariable UUID organizationId, @PathVariable UUID jobId,
                             @AuthenticationPrincipal AtlasPrincipal principal,
                             @RequestParam(defaultValue = "25") int limit) {
        return matching.jobMatches(organizationId, jobId, principal.requireUserId(), limit);
    }

    @GetMapping("/shifts/{shiftId}/matches")
    MatchResponse shiftMatches(@PathVariable UUID organizationId, @PathVariable UUID shiftId,
                               @AuthenticationPrincipal AtlasPrincipal principal,
                               @RequestParam(defaultValue = "25") int limit) {
        return matching.shiftMatches(organizationId, shiftId, principal.requireUserId(), limit);
    }
}
