package com.atlas.worker.domain;

import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class ProfileCompletionEngine {
    public static final int VERSION = 1;
    public static final int TOTAL_WEIGHT = 100;

    public Result calculate(Input input) {
        int score = 0;
        List<String> recommendations = new ArrayList<>();
        score += component(present(input.fullName()), 15, "ADD_FULL_NAME", recommendations);
        score += component(present(input.headline()), 10, "ADD_HEADLINE", recommendations);
        score += component(present(input.bio()), 10, "ADD_BIO", recommendations);
        score += component(present(input.handle()), 15, "CLAIM_PUBLIC_HANDLE", recommendations);
        score += component(input.hasLocation(), 20, "ADD_SEARCH_LOCATION", recommendations);
        score += component(input.hasPreferences(), 10, "SET_WORK_PREFERENCES", recommendations);
        score += component(input.experienceYears() != null, 10, "ADD_EXPERIENCE", recommendations);
        score += component(input.visibility() == ProfileVisibility.PUBLIC, 10, "PUBLISH_WORKPASS", recommendations);
        return new Result(score, VERSION, List.copyOf(recommendations));
    }

    private static int component(boolean complete, int weight, String recommendation, List<String> missing) {
        if (complete) return weight;
        missing.add(recommendation);
        return 0;
    }

    private static boolean present(String value) { return value != null && !value.isBlank(); }

    public record Input(String handle, String fullName, String headline, String bio, Integer experienceYears,
                        ProfileVisibility visibility, boolean hasLocation, boolean hasPreferences) { }
    public record Result(int score, int version, List<String> recommendations) { }
}
