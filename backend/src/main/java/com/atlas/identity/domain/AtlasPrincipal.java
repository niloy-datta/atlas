package com.atlas.identity.domain;

import java.security.Principal;
import java.util.Collections;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

public record AtlasPrincipal(
        UUID userId,
        String firebaseUid,
        String email,
        boolean emailVerified,
        Set<PlatformRole> roles
) implements Principal {

    public AtlasPrincipal {
        roles = roles != null ? Collections.unmodifiableSet(roles) : Collections.emptySet();
    }

    @Override
    public String getName() {
        return userId != null ? userId.toString() : (firebaseUid != null ? firebaseUid : "anonymous");
    }

    public UUID requireUserId() {
        return Objects.requireNonNull(userId, "Atlas user has not been bootstrapped");
    }

    public boolean isProvisioned() {
        return userId != null;
    }

    public boolean hasRole(PlatformRole role) {
        return roles.contains(role);
    }
}
