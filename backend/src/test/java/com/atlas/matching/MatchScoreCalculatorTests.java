package com.atlas.matching;

import static org.assertj.core.api.Assertions.assertThat;

import com.atlas.matching.domain.MatchScoreCalculator;
import com.atlas.matching.domain.MatchScoreCalculator.Input;
import org.junit.jupiter.api.Test;

class MatchScoreCalculatorTests {
    @Test
    void identicalInputsAlwaysProduceIdenticalScore() {
        Input input = new Input(4, 3, 2, 5_000.0, 20, 80, true);
        assertThat(MatchScoreCalculator.scoreShift(input))
                .isEqualTo(MatchScoreCalculator.scoreShift(input));
    }

    @Test
    void perfectShiftCandidateScoresOneHundred() {
        var score = MatchScoreCalculator.scoreShift(new Input(2, 2, 2, 0.0, 20, 100, true));
        assertThat(score.total()).isEqualTo(100.0);
        assertThat(score.skillFit()).isEqualTo(40.0);
        assertThat(score.verifiedSkillFit()).isEqualTo(10.0);
        assertThat(score.availabilityFit()).isEqualTo(20.0);
    }

    @Test
    void jobScoreDoesNotDependOnShiftAvailability() {
        var a = MatchScoreCalculator.scoreJob(new Input(2, 1, 1, 10_000.0, 20, 80, true));
        var b = MatchScoreCalculator.scoreJob(new Input(2, 1, 1, 10_000.0, 20, 80, false));
        assertThat(a).isEqualTo(b);
    }
}
