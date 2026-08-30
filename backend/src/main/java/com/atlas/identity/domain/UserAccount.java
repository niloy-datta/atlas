package com.atlas.identity.domain;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "users")
public class UserAccount {
    @Id
    private UUID id;

    @Column(name = "email_normalized", nullable = false, unique = true, length = 320)
    private String emailNormalized;

    @Column(name = "email_display", nullable = false, length = 320)
    private String emailDisplay;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private boolean enabled;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "role", nullable = false)
    @Enumerated(EnumType.STRING)
    private Set<PlatformRole> roles = new HashSet<>();

    protected UserAccount() {
    }

    public static UserAccount create(String displayEmail, String normalizedEmail, String passwordHash,
                                     PlatformRole role, Instant now) {
        UserAccount user = new UserAccount();
        user.id = UUID.randomUUID();
        user.emailDisplay = displayEmail;
        user.emailNormalized = normalizedEmail;
        user.passwordHash = passwordHash;
        user.enabled = true;
        user.roles.add(role);
        user.createdAt = now;
        user.updatedAt = now;
        return user;
    }

    public UUID id() { return id; }
    public String emailNormalized() { return emailNormalized; }
    public String emailDisplay() { return emailDisplay; }
    public String passwordHash() { return passwordHash; }
    public boolean enabled() { return enabled; }
    public Set<PlatformRole> roles() { return Set.copyOf(roles); }

    public void changePassword(String newHash, Instant now) {
        passwordHash = newHash;
        updatedAt = now;
    }
}
