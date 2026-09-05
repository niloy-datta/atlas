package com.atlas.invitation;

import com.atlas.invitation.domain.InvitationStatus;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class InvitationStatusTests {

    @Test
    void testAllowedTransitionsFromPending() {
        assertTrue(InvitationStatus.PENDING.canTransitionTo(InvitationStatus.ACCEPTED));
        assertTrue(InvitationStatus.PENDING.canTransitionTo(InvitationStatus.DECLINED));
        assertTrue(InvitationStatus.PENDING.canTransitionTo(InvitationStatus.EXPIRED));
        assertTrue(InvitationStatus.PENDING.canTransitionTo(InvitationStatus.CANCELLED));
        assertFalse(InvitationStatus.PENDING.canTransitionTo(InvitationStatus.PENDING));
    }

    @Test
    void testTerminalStatesCannotTransition() {
        for (InvitationStatus status : new InvitationStatus[]{
                InvitationStatus.ACCEPTED,
                InvitationStatus.DECLINED,
                InvitationStatus.EXPIRED,
                InvitationStatus.CANCELLED
        }) {
            for (InvitationStatus next : InvitationStatus.values()) {
                assertFalse(status.canTransitionTo(next));
            }
        }
    }
}
