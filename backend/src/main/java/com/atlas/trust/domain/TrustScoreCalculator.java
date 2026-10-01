package com.atlas.trust.domain;

public final class TrustScoreCalculator {
    public static final String VERSION = "TRUST_V1";

    private TrustScoreCalculator() { }

    public static Score calculate(Facts facts) {
        int completed = Math.min(25, Math.max(0, facts.completedShifts()) * 5);
        int verified = Math.min(15, Math.max(0, facts.verifiedSkills()) * 3);
        int profile = Math.min(10, Math.max(0, Math.min(100, facts.profileCompletion())) / 10);
        int cancellationPenalty = Math.min(20, Math.max(0, facts.cancelledReservations()) * 5);

        int total = Math.clamp(50 + completed + verified + profile - cancellationPenalty, 0, 100);
        return new Score(total, VERSION, completed, verified, profile, cancellationPenalty);
    }

    public record Facts(int completedShifts, int cancelledReservations,
                        int verifiedSkills, int profileCompletion) { }

    public record Score(int total, String algorithmVersion, int completedWorkPoints,
                        int verifiedSkillPoints, int profilePoints,
                        int cancellationPenalty) { }
}
