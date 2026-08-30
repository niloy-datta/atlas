package com.atlas.identity.config;

import com.atlas.identity.infrastructure.UserSessionRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Clock;
import java.time.Instant;
import java.util.UUID;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class ActiveSessionFilter extends OncePerRequestFilter {
    private final UserSessionRepository sessions;
    private final Clock clock;

    public ActiveSessionFilter(UserSessionRepository sessions, Clock clock) {
        this.sessions = sessions;
        this.clock = clock;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        if (SecurityContextHolder.getContext().getAuthentication() instanceof JwtAuthenticationToken authentication) {
            String sessionClaim = authentication.getToken().getClaimAsString("sessionId");
            boolean active = false;
            try {
                UUID sessionId = UUID.fromString(sessionClaim);
                active = sessions.findById(sessionId).filter(session -> session.activeAt(Instant.now(clock))).isPresent();
            } catch (IllegalArgumentException | NullPointerException ignored) {
                // Invalid session claims result in an unauthenticated request.
            }
            if (!active) SecurityContextHolder.clearContext();
        }
        chain.doFilter(request, response);
    }
}
