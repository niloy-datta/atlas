package com.atlas.identity.infrastructure;

import com.atlas.identity.application.FirebaseTokenVerifier;
import com.atlas.identity.application.FirebaseVerifiedUser;
import com.atlas.identity.domain.AtlasPrincipal;
import com.atlas.identity.domain.UserAccount;
import com.atlas.shared.error.ApiProblemException;
import tools.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.http.MediaType;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

public class FirebaseAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(FirebaseAuthenticationFilter.class);

    private final FirebaseTokenVerifier tokenVerifier;
    private final UserAccountRepository userAccountRepository;
    private final ObjectMapper objectMapper;

    public FirebaseAuthenticationFilter(FirebaseTokenVerifier tokenVerifier,
                                        UserAccountRepository userAccountRepository,
                                        ObjectMapper objectMapper) {
        this.tokenVerifier = tokenVerifier;
        this.userAccountRepository = userAccountRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");

        if (authHeader == null) {
            filterChain.doFilter(request, response);
            return;
        }

        if (!authHeader.startsWith("Bearer ")) {
            writeProblem(response, request.getRequestURI(), HttpServletResponse.SC_UNAUTHORIZED,
                    "MALFORMED_AUTHORIZATION_HEADER", "Malformed Authorization Header",
                    "Authorization header must start with 'Bearer ' followed by a valid Firebase ID token.");
            return;
        }

        String token = authHeader.substring(7).trim();
        if (token.isEmpty()) {
            writeProblem(response, request.getRequestURI(), HttpServletResponse.SC_UNAUTHORIZED,
                    "MISSING_BEARER_TOKEN", "Missing Bearer Token",
                    "Firebase ID token must not be empty.");
            return;
        }

        try {
            FirebaseVerifiedUser firebaseUser = tokenVerifier.verify(token);

            // Side-effect-free user resolution by Firebase UID only (NO automatic email linking)
            Optional<UserAccount> userOpt = userAccountRepository.findByFirebaseUid(firebaseUser.uid());

            AtlasPrincipal principal;
            if (userOpt.isPresent()) {
                UserAccount user = userOpt.get();
                if (!user.enabled()) {
                    writeProblem(response, request.getRequestURI(), HttpServletResponse.SC_FORBIDDEN,
                            "ACCOUNT_DISABLED", "Account Disabled", "User account is disabled.");
                    return;
                }
                principal = new AtlasPrincipal(
                        user.id(),
                        firebaseUser.uid(),
                        user.emailDisplay(),
                        firebaseUser.emailVerified(),
                        user.roles()
                );
            } else {
                // Authenticated with Firebase, but not yet provisioned in ATLAS
                principal = new AtlasPrincipal(
                        null,
                        firebaseUser.uid(),
                        firebaseUser.email(),
                        firebaseUser.emailVerified(),
                        Set.of()
                );
            }

            AtlasAuthenticationToken authentication = new AtlasAuthenticationToken(principal, token);
            SecurityContextHolder.getContext().setAuthentication(authentication);
            filterChain.doFilter(request, response);
        } catch (ApiProblemException e) {
            SecurityContextHolder.clearContext();
            writeProblem(response, request.getRequestURI(), e.status().value(), e.code(), e.title(), e.getMessage());
        } catch (DataAccessException e) {
            SecurityContextHolder.clearContext();
            log.error("Database access error during authentication", e);
            writeProblem(response, request.getRequestURI(), HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                    "DATABASE_ERROR", "Authentication Service Error", "Database error occurred during authentication.");
        } catch (Exception e) {
            SecurityContextHolder.clearContext();
            log.error("Unexpected error in authentication filter", e);
            writeProblem(response, request.getRequestURI(), HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                    "AUTHENTICATION_ERROR", "Authentication Error", "An unexpected authentication error occurred.");
        }
    }

    private void writeProblem(HttpServletResponse response, String instance, int status,
                              String code, String title, String detail) throws IOException {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        objectMapper.writeValue(response.getOutputStream(), Map.of(
                "type", "https://atlas.example/problems/" + code.toLowerCase(Locale.ROOT).replace('_', '-'),
                "title", title,
                "status", status,
                "code", code,
                "detail", detail,
                "instance", instance,
                "traceId", "unavailable"
        ));
    }
}
