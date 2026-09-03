package com.atlas.identity.infrastructure;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "atlas.firebase")
public record FirebaseProperties(
        String projectId,
        String credentialsPath,
        String emulatorHost
) {
    public FirebaseProperties {
        if (projectId == null || projectId.isBlank()) {
            projectId = "atlas-verified";
        }
    }
}
