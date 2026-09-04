package com.atlas.identity.domain;

 
import org.springframework.data.domain.Persistable;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.PostLoad;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "users")
public class UserAccount implements Persistable<UUID> {
    @Id
    private UUID id;

    @Transient
    private boolean isNew = true;

    @Override
    public UUID getId() {
        return id;
    }

    @Override
    public boolean isNew() {
        return isNew;
    }

    @PrePersist
    @PostLoad
    void markNotNew() {
        this.isNew = false;
    }

    @Column(name = "email_normalized", nullable = false, unique = true, length = 320)
    private String emailNormalized;

    @Column(name = "email_display", nullable = false, length = 320)
    private String emailDisplay;

    @Column(name = "password_hash")
    private String passwordHash;

    @Column(name = "firebase_uid", length = 128, unique = true)
    private String firebaseUid;

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

    public static UserAccount createWithFirebase(String firebaseUid, String displayEmail, String normalizedEmail,
                                                 PlatformRole role, Instant now) {
        UserAccount user = new UserAccount();
        user.id = UUID.randomUUID();
        user.firebaseUid = firebaseUid;
        user.emailDisplay = displayEmail;
        user.emailNormalized = normalizedEmail;
        user.passwordHash = null;
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
    public String firebaseUid() { return firebaseUid; }
    public boolean enabled() { return enabled; }
    public Set<PlatformRole> roles() { return Set.copyOf(roles); }
    public Instant createdAt() { return createdAt; }
    public Instant updatedAt() { return updatedAt; }

    public void disable(Instant now) {
        this.enabled = false;
        this.updatedAt = now;
    }

    public void enable(Instant now) {
        this.enabled = true;
        this.updatedAt = now;
    }

    public void addRole(PlatformRole role, Instant now) {
        this.roles.add(role);
        this.updatedAt = now;
    }

    public void linkFirebaseUid(String firebaseUid, Instant now) {
        this.firebaseUid = firebaseUid;
        this.updatedAt = now;
    }
}
