package com.atlas.identity.application;

import java.util.Collections;
import java.util.Map;

public record FirebaseVerifiedUser(
        String uid,
        String email,
        boolean emailVerified,
        String name,
        Map<String, Object> claims
) {
    public FirebaseVerifiedUser {
        if (uid == null || uid.isBlank()) {
            throw new IllegalArgumentException("Firebase UID cannot be null or blank");
        }
        claims = claims != null ? Collections.unmodifiableMap(claims) : Collections.emptyMap();
    }
}
