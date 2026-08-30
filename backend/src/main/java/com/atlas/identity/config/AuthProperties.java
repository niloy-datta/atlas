package com.atlas.identity.config;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.time.Duration;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties("atlas.auth")
public record AuthProperties(
        @NotBlank String issuer,
        @NotBlank String audience,
        Duration accessTokenTtl,
        Duration refreshTokenTtl,
        Duration passwordResetTtl,
        @NotBlank String jwtSecret,
        @NotBlank String tokenHashSecret,
        @NotEmpty List<String> allowedOrigins,
        boolean secureCookies,
        @Min(1) int loginLimit,
        @Min(1) int recoveryLimit,
        Duration rateLimitWindow,
        @NotBlank String passwordResetUrl) {
}
