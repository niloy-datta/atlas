package com.atlas.application;

import com.atlas.application.domain.ApplicationStatus;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ApplicationStatusTests {

    @Test
    void testAllowedTransitionsFromSubmitted() {
        assertTrue(ApplicationStatus.SUBMITTED.canTransitionTo(ApplicationStatus.UNDER_REVIEW));
        assertTrue(ApplicationStatus.SUBMITTED.canTransitionTo(ApplicationStatus.WITHDRAWN));
        assertFalse(ApplicationStatus.SUBMITTED.canTransitionTo(ApplicationStatus.ACCEPTED));
        assertFalse(ApplicationStatus.SUBMITTED.canTransitionTo(ApplicationStatus.REJECTED));
    }

    @Test
    void testAllowedTransitionsFromUnderReview() {
        assertTrue(ApplicationStatus.UNDER_REVIEW.canTransitionTo(ApplicationStatus.SHORTLISTED));
        assertTrue(ApplicationStatus.UNDER_REVIEW.canTransitionTo(ApplicationStatus.ACCEPTED));
        assertTrue(ApplicationStatus.UNDER_REVIEW.canTransitionTo(ApplicationStatus.REJECTED));
        assertTrue(ApplicationStatus.UNDER_REVIEW.canTransitionTo(ApplicationStatus.WITHDRAWN));
    }

    @Test
    void testAllowedTransitionsFromShortlisted() {
        assertTrue(ApplicationStatus.SHORTLISTED.canTransitionTo(ApplicationStatus.ACCEPTED));
        assertTrue(ApplicationStatus.SHORTLISTED.canTransitionTo(ApplicationStatus.REJECTED));
        assertTrue(ApplicationStatus.SHORTLISTED.canTransitionTo(ApplicationStatus.WITHDRAWN));
        assertFalse(ApplicationStatus.SHORTLISTED.canTransitionTo(ApplicationStatus.SUBMITTED));
    }

    @Test
    void testTerminalStatesCannotTransition() {
        for (ApplicationStatus next : ApplicationStatus.values()) {
            assertFalse(ApplicationStatus.ACCEPTED.canTransitionTo(next));
            assertFalse(ApplicationStatus.REJECTED.canTransitionTo(next));
            assertFalse(ApplicationStatus.WITHDRAWN.canTransitionTo(next));
        }
    }
}
