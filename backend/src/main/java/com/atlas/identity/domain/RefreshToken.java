package com.atlas.identity.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "refresh_tokens")
public class RefreshToken {
    @Id
    private UUID id;
    @Column(name = "session_id", nullable = false)
    private UUID sessionId;
    @Column(name = "family_id", nullable = false)
    private UUID familyId;
    @Column(name = "token_hash", nullable = false, unique = true, length = 64)
    private String tokenHash;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private RefreshTokenStatus status;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;
    @Column(name = "used_at")
    private Instant usedAt;
    @Column(name = "replaced_by_id")
    private UUID replacedById;

    protected RefreshToken() {
    }

    public static RefreshToken create(UUID sessionId, UUID familyId, String hash, Instant now, Instant expiry) {
        RefreshToken token = new RefreshToken();
        token.id = UUID.randomUUID();
        token.sessionId = sessionId;
        token.familyId = familyId;
        token.tokenHash = hash;
        token.status = RefreshTokenStatus.ACTIVE;
        token.createdAt = now;
        token.expiresAt = expiry;
        return token;
    }

    public UUID id() { return id; }
    public UUID sessionId() { return sessionId; }
    public UUID familyId() { return familyId; }
    public RefreshTokenStatus status() { return status; }
    public Instant expiresAt() { return expiresAt; }
    public void rotate(UUID replacementId, Instant now) {
        status = RefreshTokenStatus.ROTATED;
        usedAt = now;
        replacedById = replacementId;
    }
    public void linkReplacement(UUID replacementId) { replacedById = replacementId; }
    public void markReused(Instant now) { status = RefreshTokenStatus.REUSED; usedAt = now; }
    public void revoke(Instant now) { if (status == RefreshTokenStatus.ACTIVE) { status = RefreshTokenStatus.REVOKED; usedAt = now; } }
}
