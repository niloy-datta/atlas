package com.atlas.identity.config;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties("atlas.auth")
public record AuthProperties(
        @NotEmpty List<String> allowedOrigins) {
}
