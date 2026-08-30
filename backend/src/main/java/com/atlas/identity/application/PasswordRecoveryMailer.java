package com.atlas.identity.application;

import java.time.Instant;

public interface PasswordRecoveryMailer {
    void sendPasswordReset(String email, String rawToken, Instant expiresAt);
}
