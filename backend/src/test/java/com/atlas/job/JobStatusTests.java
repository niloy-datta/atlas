package com.atlas.job;

import static org.assertj.core.api.Assertions.assertThat;

import com.atlas.job.domain.JobStatus;
import org.junit.jupiter.api.Test;

class JobStatusTests {

    @Test
    void draftCanTransitionToPublishedOrCancelled() {
        assertThat(JobStatus.DRAFT.canTransitionTo(JobStatus.PUBLISHED)).isTrue();
        assertThat(JobStatus.DRAFT.canTransitionTo(JobStatus.CANCELLED)).isTrue();
        assertThat(JobStatus.DRAFT.canTransitionTo(JobStatus.PAUSED)).isFalse();
        assertThat(JobStatus.DRAFT.canTransitionTo(JobStatus.CLOSED)).isFalse();
        assertThat(JobStatus.DRAFT.canTransitionTo(JobStatus.COMPLETED)).isFalse();
    }

    @Test
    void publishedCanTransitionToPausedClosedCancelledOrCompleted() {
        assertThat(JobStatus.PUBLISHED.canTransitionTo(JobStatus.PAUSED)).isTrue();
        assertThat(JobStatus.PUBLISHED.canTransitionTo(JobStatus.CLOSED)).isTrue();
        assertThat(JobStatus.PUBLISHED.canTransitionTo(JobStatus.CANCELLED)).isTrue();
        assertThat(JobStatus.PUBLISHED.canTransitionTo(JobStatus.COMPLETED)).isTrue();
        assertThat(JobStatus.PUBLISHED.canTransitionTo(JobStatus.DRAFT)).isFalse();
    }

    @Test
    void pausedCanTransitionToPublishedClosedOrCancelled() {
        assertThat(JobStatus.PAUSED.canTransitionTo(JobStatus.PUBLISHED)).isTrue();
        assertThat(JobStatus.PAUSED.canTransitionTo(JobStatus.CLOSED)).isTrue();
        assertThat(JobStatus.PAUSED.canTransitionTo(JobStatus.CANCELLED)).isTrue();
        assertThat(JobStatus.PAUSED.canTransitionTo(JobStatus.DRAFT)).isFalse();
    }

    @Test
    void closedCanOnlyTransitionToCancelled() {
        assertThat(JobStatus.CLOSED.canTransitionTo(JobStatus.CANCELLED)).isTrue();
        assertThat(JobStatus.CLOSED.canTransitionTo(JobStatus.PUBLISHED)).isFalse();
        assertThat(JobStatus.CLOSED.canTransitionTo(JobStatus.DRAFT)).isFalse();
    }

    @Test
    void cancelledAndCompletedAreTerminal() {
        for (JobStatus status : JobStatus.values()) {
            assertThat(JobStatus.CANCELLED.canTransitionTo(status)).isFalse();
            assertThat(JobStatus.COMPLETED.canTransitionTo(status)).isFalse();
        }
    }
}

