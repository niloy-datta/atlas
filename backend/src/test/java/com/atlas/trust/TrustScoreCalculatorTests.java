package com.atlas.trust;

import static org.assertj.core.api.Assertions.assertThat;

import com.atlas.trust.domain.TrustScoreCalculator;
import com.atlas.trust.domain.TrustScoreCalculator.Facts;
import org.junit.jupiter.api.Test;

class TrustScoreCalculatorTests {
    @Test
    void coldStartIsNeutralAndVersioned() {
        var score = TrustScoreCalculator.calculate(new Facts(0, 0, 0, 0));
        assertThat(score.total()).isEqualTo(50);
        assertThat(score.algorithmVersion()).isEqualTo("TRUST_V1");
    }

    @Test
    void scoreIsAlwaysBounded() {
        assertThat(TrustScoreCalculator.calculate(new Facts(10_000, 0, 10_000, 100)).total())
                .isBetween(0, 100);
        assertThat(TrustScoreCalculator.calculate(new Facts(0, 10_000, 0, 0)).total())
                .isBetween(0, 100);
    }

    @Test
    void calculatorUsesOnlyWorkEvidenceFields() {
        Facts evidence = new Facts(3, 1, 2, 80);
        var a = TrustScoreCalculator.calculate(evidence);
        var b = TrustScoreCalculator.calculate(evidence);
        assertThat(a).isEqualTo(b);
        assertThat(Facts.class.getRecordComponents())
                .extracting(java.lang.reflect.RecordComponent::getName)
                .containsExactly("completedShifts", "cancelledReservations", "verifiedSkills", "profileCompletion");
    }
}
