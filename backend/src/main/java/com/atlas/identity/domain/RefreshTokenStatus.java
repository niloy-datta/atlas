package com.atlas.identity.domain;

public enum RefreshTokenStatus {
    ACTIVE,
    ROTATED,
    REVOKED,
    REUSED
}
