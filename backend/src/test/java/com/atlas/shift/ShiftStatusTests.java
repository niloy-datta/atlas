package com.atlas.shift;

import static org.assertj.core.api.Assertions.assertThat;

import com.atlas.shift.domain.ShiftStatus;
import org.junit.jupiter.api.Test;

class ShiftStatusTests {

    @Test
    void draftCanTransitionToPublishedOrCancelled() {
        assertThat(ShiftStatus.DRAFT.canTransitionTo(ShiftStatus.PUBLISHED)).isTrue();
        assertThat(ShiftStatus.DRAFT.canTransitionTo(ShiftStatus.CANCELLED)).isTrue();
        assertThat(ShiftStatus.DRAFT.canTransitionTo(ShiftStatus.IN_PROGRESS)).isFalse();
        assertThat(ShiftStatus.DRAFT.canTransitionTo(ShiftStatus.COMPLETED)).isFalse();
    }

    @Test
    void publishedCanTransitionToInProgressCompletedOrCancelled() {
        assertThat(ShiftStatus.PUBLISHED.canTransitionTo(ShiftStatus.IN_PROGRESS)).isTrue();
        assertThat(ShiftStatus.PUBLISHED.canTransitionTo(ShiftStatus.COMPLETED)).isTrue();
        assertThat(ShiftStatus.PUBLISHED.canTransitionTo(ShiftStatus.CANCELLED)).isTrue();
        assertThat(ShiftStatus.PUBLISHED.canTransitionTo(ShiftStatus.DRAFT)).isFalse();
    }

    @Test
    void inProgressCanTransitionToCompletedOrCancelled() {
        assertThat(ShiftStatus.IN_PROGRESS.canTransitionTo(ShiftStatus.COMPLETED)).isTrue();
        assertThat(ShiftStatus.IN_PROGRESS.canTransitionTo(ShiftStatus.CANCELLED)).isTrue();
        assertThat(ShiftStatus.IN_PROGRESS.canTransitionTo(ShiftStatus.DRAFT)).isFalse();
        assertThat(ShiftStatus.IN_PROGRESS.canTransitionTo(ShiftStatus.PUBLISHED)).isFalse();
    }

    @Test
    void cancelledAndCompletedAreTerminal() {
        for (ShiftStatus status : ShiftStatus.values()) {
            assertThat(ShiftStatus.CANCELLED.canTransitionTo(status)).isFalse();
            assertThat(ShiftStatus.COMPLETED.canTransitionTo(status)).isFalse();
        }
    }
}

