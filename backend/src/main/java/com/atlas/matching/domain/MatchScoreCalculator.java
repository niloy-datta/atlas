package com.atlas.matching.domain;

import java.util.List;

public final class MatchScoreCalculator {
    private MatchScoreCalculator() { }

    public static Score scoreJob(Input input) {
        double skill = ratio(input.matchedRequiredSkills(), input.requiredSkills()) * 50.0;
        double verified = ratio(input.verifiedMatchedSkills(), input.requiredSkills()) * 10.0;
        double distance = distanceScore(input.distanceMeters(), input.maxDistanceKm()) * 25.0;
        double profile = clamp01(input.profileCompletion() / 100.0) * 15.0;
        return score(skill, verified, distance, 0.0, profile);
    }

    public static Score scoreShift(Input input) {
        double skill = ratio(input.matchedRequiredSkills(), input.requiredSkills()) * 40.0;
        double verified = ratio(input.verifiedMatchedSkills(), input.requiredSkills()) * 10.0;
        double distance = distanceScore(input.distanceMeters(), input.maxDistanceKm()) * 20.0;
        double availability = input.availableForShift() ? 20.0 : 0.0;
        double profile = clamp01(input.profileCompletion() / 100.0) * 10.0;
        return score(skill, verified, distance, availability, profile);
    }

    private static Score score(double skill, double verified, double distance,
                               double availability, double profile) {
        double total = round(skill + verified + distance + availability + profile);
        return new Score(total,
                round(skill),
                round(verified),
                round(distance),
                round(availability),
                round(profile),
                reasons(skill, verified, distance, availability, profile));
    }

    private static List<String> reasons(double skill, double verified, double distance,
                                        double availability, double profile) {
        java.util.ArrayList<String> reasons = new java.util.ArrayList<>();
        if (skill > 0) reasons.add("required skills matched");
        if (verified > 0) reasons.add("verified skill evidence");
        if (distance > 0) reasons.add("within preferred travel distance");
        if (availability > 0) reasons.add("availability covers shift");
        if (profile >= 8) reasons.add("strong profile completeness");
        return List.copyOf(reasons);
    }

    private static double ratio(int numerator, int denominator) {
        if (denominator <= 0) return 1.0;
        return clamp01((double) numerator / denominator);
    }

    private static double distanceScore(Double distanceMeters, Integer maxDistanceKm) {
        if (distanceMeters == null) return 0.0;
        double radiusKm = maxDistanceKm == null ? 50.0 : Math.max(1, maxDistanceKm);
        double distanceKm = Math.max(0, distanceMeters) / 1000.0;
        return clamp01(1.0 - (distanceKm / radiusKm));
    }

    private static double clamp01(double value) {
        return Math.max(0.0, Math.min(1.0, value));
    }

    private static double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    public record Input(int requiredSkills, int matchedRequiredSkills, int verifiedMatchedSkills,
                        Double distanceMeters, Integer maxDistanceKm, int profileCompletion,
                        boolean availableForShift) { }

    public record Score(double total, double skillFit, double verifiedSkillFit,
                        double distanceFit, double availabilityFit, double profileFit,
                        List<String> reasons) { }
}
