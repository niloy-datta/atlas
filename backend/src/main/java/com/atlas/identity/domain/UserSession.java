package com.atlas.identity.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_sessions")
public class UserSession {
    @Id
    private UUID id;
    @Column(name = "user_id", nullable = false)
    private UUID userId;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
    @Column(name = "last_seen_at", nullable = false)
    private Instant lastSeenAt;
    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;
    @Column(name = "revoked_at")
    private Instant revokedAt;
    @Column(name = "ip_address", length = 64)
    private String ipAddress;
    @Column(name = "user_agent", length = 512)
    private String userAgent;

    protected UserSession() {
    }

    public static UserSession create(UUID userId, Instant now, Instant expiresAt, String ip, String agent) {
        UserSession session = new UserSession();
        session.id = UUID.randomUUID();
        session.userId = userId;
        session.createdAt = now;
        session.lastSeenAt = now;
        session.expiresAt = expiresAt;
        session.ipAddress = ip;
        session.userAgent = agent;
        return session;
    }

    public UUID id() { return id; }
    public UUID userId() { return userId; }
    public Instant createdAt() { return createdAt; }
    public Instant lastSeenAt() { return lastSeenAt; }
    public Instant expiresAt() { return expiresAt; }
    public Instant revokedAt() { return revokedAt; }
    public String ipAddress() { return ipAddress; }
    public String userAgent() { return userAgent; }
    public boolean activeAt(Instant now) { return revokedAt == null && expiresAt.isAfter(now); }
    public void touch(Instant now) { lastSeenAt = now; }
    public void revoke(Instant now) { if (revokedAt == null) revokedAt = now; }
}
