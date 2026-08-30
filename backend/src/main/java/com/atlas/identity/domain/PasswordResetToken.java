package com.atlas.identity.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "password_reset_tokens")
public class PasswordResetToken {
    @Id
    private UUID id;
    @Column(name = "user_id", nullable = false)
    private UUID userId;
    @Column(name = "token_hash", nullable = false, unique = true, length = 64)
    private String tokenHash;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;
    @Column(name = "used_at")
    private Instant usedAt;

    protected PasswordResetToken() {
    }

    public static PasswordResetToken create(UUID userId, String hash, Instant now, Instant expiry) {
        PasswordResetToken token = new PasswordResetToken();
        token.id = UUID.randomUUID();
        token.userId = userId;
        token.tokenHash = hash;
        token.createdAt = now;
        token.expiresAt = expiry;
        return token;
    }

    public UUID userId() { return userId; }
    public Instant expiresAt() { return expiresAt; }
    public Instant usedAt() { return usedAt; }
    public void consume(Instant now) { usedAt = now; }
}
