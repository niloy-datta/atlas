package com.atlas.matching.application;

import com.atlas.matching.domain.MatchScoreCalculator;
import com.atlas.matching.domain.MatchScoreCalculator.Input;
import com.atlas.matching.domain.MatchScoreCalculator.Score;
import com.atlas.matching.infrastructure.MatchRepository;
import com.atlas.matching.infrastructure.MatchRepository.CandidateFacts;
import com.atlas.matching.infrastructure.MatchRepository.TargetRow;
import com.atlas.organization.application.OrganizationAccessPolicy;
import com.atlas.organization.domain.OrganizationAction;
import com.atlas.shared.error.ApiProblemException;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MatchService {
    private final MatchRepository matches;
    private final OrganizationAccessPolicy access;

    public MatchService(MatchRepository matches, OrganizationAccessPolicy access) {
        this.matches = matches;
        this.access = access;
    }

    @Transactional(readOnly = true)
    public MatchResponse jobMatches(UUID organizationId, UUID jobId, UUID actorId, int limit) {
        access.require(organizationId, actorId, OrganizationAction.VIEW_CANDIDATES);
        TargetRow target = matches.jobTarget(organizationId, jobId).orElseThrow(MatchService::targetNotFound);
        List<MatchCandidate> candidates = matches.jobCandidates(organizationId, jobId).stream()
                .map(facts -> candidate(facts, MatchScoreCalculator.scoreJob(input(facts, false))))
                .sorted(order())
                .limit(validLimit(limit))
                .toList();
        return new MatchResponse("JOB", target.id(), target.title(), "MATCH_V1", candidates);
    }

    @Transactional(readOnly = true)
    public MatchResponse shiftMatches(UUID organizationId, UUID shiftId, UUID actorId, int limit) {
        access.require(organizationId, actorId, OrganizationAction.VIEW_CANDIDATES);
        TargetRow target = matches.shiftTarget(organizationId, shiftId).orElseThrow(MatchService::targetNotFound);
        List<MatchCandidate> candidates = matches.shiftCandidates(organizationId, shiftId).stream()
                .map(facts -> {
                    boolean available = matches.availableForShift(
                            facts.workerUserId(), target.startsAt(), target.endsAt());
                    return candidate(facts, MatchScoreCalculator.scoreShift(input(facts, available)));
                })
                .sorted(order())
                .limit(validLimit(limit))
                .toList();
        return new MatchResponse("SHIFT", target.id(), target.title(), "MATCH_V1", candidates);
    }

    private static Input input(CandidateFacts facts, boolean available) {
        return new Input(
                facts.requiredSkills(),
                facts.matchedRequiredSkills(),
                facts.verifiedMatchedSkills(),
                facts.distanceMeters(),
                facts.maxDistanceKm(),
                facts.completionScore(),
                available);
    }

    private static MatchCandidate candidate(CandidateFacts facts, Score score) {
        return new MatchCandidate(facts.workerUserId(), facts.fullName(), facts.publicHandle(),
                facts.headline(), facts.distanceMeters(), facts.requiredSkills(),
                facts.matchedRequiredSkills(), facts.verifiedMatchedSkills(), score);
    }

    private static Comparator<MatchCandidate> order() {
        return Comparator.comparingDouble((MatchCandidate c) -> c.score().total()).reversed()
                .thenComparing(c -> c.workerUserId().toString());
    }

    private static long validLimit(int limit) {
        return Math.max(1, Math.min(100, limit));
    }

    private static ApiProblemException targetNotFound() {
        return new ApiProblemException(HttpStatus.NOT_FOUND, "MATCH_TARGET_NOT_FOUND",
                "Match target not found", "The requested job or shift is unavailable in this organization.");
    }

    public record MatchResponse(String targetType, UUID targetId, String targetTitle,
                                String algorithmVersion, List<MatchCandidate> candidates) { }

    public record MatchCandidate(UUID workerUserId, String fullName, String publicHandle,
                                 String headline, Double distanceMeters, int requiredSkills,
                                 int matchedRequiredSkills, int verifiedMatchedSkills, Score score) { }
}
