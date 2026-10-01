package com.atlas.trust.application;

import com.atlas.shared.error.ApiProblemException;
import com.atlas.trust.domain.TrustScoreCalculator;
import com.atlas.trust.domain.TrustScoreCalculator.Facts;
import com.atlas.trust.domain.TrustScoreCalculator.Score;
import com.atlas.trust.infrastructure.TrustScoreRepository;
import java.time.Clock;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

@Service
public class TrustScoreService {
    private final TrustScoreRepository repository;
    private final ObjectMapper json;
    private final Clock clock;

    public TrustScoreService(TrustScoreRepository repository, ObjectMapper json, Clock clock) {
        this.repository = repository;
        this.json = json;
        this.clock = clock;
    }

    @Transactional
    public TrustScoreView calculate(UUID workerUserId) {
        if (!repository.workerExists(workerUserId)) {
            throw new ApiProblemException(HttpStatus.NOT_FOUND, "TRUST_WORKER_NOT_FOUND",
                    "Worker not found", "The requested worker profile does not exist.");
        }

        Facts facts = repository.facts(workerUserId);
        Score score = TrustScoreCalculator.calculate(facts);
        Instant now = Instant.now(clock);
        repository.snapshot(UUID.randomUUID(), workerUserId, facts, score,
                componentsJson(score), now);

        return new TrustScoreView(workerUserId, score.total(), score.algorithmVersion(),
                facts.completedShifts(), facts.cancelledReservations(), facts.verifiedSkills(),
                facts.profileCompletion(), score.completedWorkPoints(),
                score.verifiedSkillPoints(), score.profilePoints(),
                score.cancellationPenalty(), now);
    }

    private String componentsJson(Score score) {
        try {
            return json.writeValueAsString(Map.of(
                    "completedWorkPoints", score.completedWorkPoints(),
                    "verifiedSkillPoints", score.verifiedSkillPoints(),
                    "profilePoints", score.profilePoints(),
                    "cancellationPenalty", score.cancellationPenalty()));
        } catch (JacksonException exception) {
            throw new IllegalStateException("Could not serialize trust score components", exception);
        }
    }

    public record TrustScoreView(
            UUID workerUserId,
            int score,
            String algorithmVersion,
            int completedShifts,
            int cancelledReservations,
            int verifiedSkills,
            int profileCompletion,
            int completedWorkPoints,
            int verifiedSkillPoints,
            int profilePoints,
            int cancellationPenalty,
            Instant computedAt) { }
}
