package com.atlas.worker;

import static org.assertj.core.api.Assertions.assertThat;

import com.atlas.worker.domain.ProfileCompletionEngine;
import com.atlas.worker.domain.ProfileVisibility;
import org.junit.jupiter.api.Test;

class ProfileCompletionEngineTests {
    private final ProfileCompletionEngine engine = new ProfileCompletionEngine();

    @Test
    void weightsTotalOneHundredAndRecommendationsAreDeterministic() {
        ProfileCompletionEngine.Result empty = engine.calculate(new ProfileCompletionEngine.Input(
                null, null, null, null, null, ProfileVisibility.PRIVATE, false, false));
        assertThat(empty.score()).isZero();
        assertThat(empty.version()).isEqualTo(1);
        assertThat(empty.recommendations()).containsExactly(
                "ADD_FULL_NAME", "ADD_HEADLINE", "ADD_BIO", "CLAIM_PUBLIC_HANDLE",
                "ADD_SEARCH_LOCATION", "SET_WORK_PREFERENCES", "ADD_EXPERIENCE", "PUBLISH_WORKPASS");

        ProfileCompletionEngine.Result complete = engine.calculate(new ProfileCompletionEngine.Input(
                "sample-worker", "Sample Worker", "Verified electrician", "Ten years of experience",
                10, ProfileVisibility.PUBLIC, true, true));
        assertThat(complete.score()).isEqualTo(ProfileCompletionEngine.TOTAL_WEIGHT).isEqualTo(100);
        assertThat(complete.recommendations()).isEmpty();
    }
}
