package com.atlas.identity.web;

import com.atlas.identity.config.AuthProperties;
import com.atlas.shared.error.ApiProblemException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Arrays;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class CookieRequestGuard {
    public static final String CSRF_COOKIE = "atlas_csrf";
    public static final String CSRF_HEADER = "X-CSRF-TOKEN";
    private final AuthProperties properties;

    public CookieRequestGuard(AuthProperties properties) { this.properties = properties; }

    public void validate(HttpServletRequest request) {
        String origin = request.getHeader("Origin");
        if (origin == null || properties.allowedOrigins().stream().noneMatch(origin::equals)) {
            reject("Request origin is not allowed.");
        }
        String header = request.getHeader(CSRF_HEADER);
        String cookie = request.getCookies() == null ? null : Arrays.stream(request.getCookies())
                .filter(value -> CSRF_COOKIE.equals(value.getName()))
                .map(Cookie::getValue).findFirst().orElse(null);
        if (header == null || cookie == null || !MessageDigest.isEqual(
                header.getBytes(StandardCharsets.UTF_8), cookie.getBytes(StandardCharsets.UTF_8))) {
            reject("CSRF token is missing or invalid.");
        }
    }

    private static void reject(String detail) {
        throw new ApiProblemException(HttpStatus.FORBIDDEN, "CSRF_REJECTED", "Request rejected", detail);
    }
}
