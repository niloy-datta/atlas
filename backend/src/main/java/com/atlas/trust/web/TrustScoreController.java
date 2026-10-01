package com.atlas.trust.web;

import com.atlas.identity.domain.AtlasPrincipal;
import com.atlas.trust.application.TrustScoreService;
import com.atlas.trust.application.TrustScoreService.TrustScoreView;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/workers/me/trust-score")
public class TrustScoreController {
    private final TrustScoreService trust;

    public TrustScoreController(TrustScoreService trust) {
        this.trust = trust;
    }

    @GetMapping
    TrustScoreView score(@AuthenticationPrincipal AtlasPrincipal principal) {
        return trust.calculate(principal.requireUserId());
    }
}
