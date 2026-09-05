package com.atlas.identity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.atlas.identity.application.FirebaseTokenVerifier;
import com.atlas.identity.application.FirebaseVerifiedUser;
import com.atlas.identity.domain.AtlasPrincipal;
import com.atlas.identity.domain.PlatformRole;
import com.atlas.identity.domain.UserAccount;
import com.atlas.identity.infrastructure.FirebaseAuthenticationFilter;
import com.atlas.identity.infrastructure.UserAccountRepository;
import com.atlas.shared.error.ApiProblemException;
import tools.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

class FirebaseAuthenticationFilterTests {

    private FirebaseTokenVerifier tokenVerifier;
    private UserAccountRepository userAccountRepository;
    private ObjectMapper objectMapper;
    private FilterChain filterChain;
    private FirebaseAuthenticationFilter filter;

    @BeforeEach
    void setUp() {
        tokenVerifier = mock(FirebaseTokenVerifier.class);
        userAccountRepository = mock(UserAccountRepository.class);
        objectMapper = new ObjectMapper();
        filterChain = mock(FilterChain.class);
        filter = new FirebaseAuthenticationFilter(tokenVerifier, userAccountRepository, objectMapper);
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void allowsRequestThroughWhenNoAuthorizationHeader() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    void rejectsMalformedAuthorizationHeader() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Basic credentials");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, filterChain);

        assertThat(response.getStatus()).isEqualTo(401);
        assertThat(response.getContentAsString()).contains("MALFORMED_AUTHORIZATION_HEADER");
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    void rejectsEmptyBearerToken() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer   ");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, filterChain);

        assertThat(response.getStatus()).isEqualTo(401);
        assertThat(response.getContentAsString()).contains("MISSING_BEARER_TOKEN");
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    void handlesInvalidFirebaseTokenFromVerifier() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer bad-token");
        MockHttpServletResponse response = new MockHttpServletResponse();

        when(tokenVerifier.verify("bad-token")).thenThrow(new ApiProblemException(
                HttpStatus.UNAUTHORIZED, "INVALID_FIREBASE_TOKEN", "Invalid Firebase ID Token", "Invalid token signature."));

        filter.doFilter(request, response, filterChain);

        assertThat(response.getStatus()).isEqualTo(401);
        assertThat(response.getContentAsString()).contains("INVALID_FIREBASE_TOKEN");
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    void populatesSecurityContextForProvisionedUser() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer valid-token");
        MockHttpServletResponse response = new MockHttpServletResponse();

        String firebaseUid = "fb-uid-123";
        String email = "worker@example.com";
        UUID userId = UUID.randomUUID();

        when(tokenVerifier.verify("valid-token")).thenReturn(
                new FirebaseVerifiedUser(firebaseUid, email, true, "Worker Name", Map.of())
        );

        UserAccount account = UserAccount.createWithFirebase(
                firebaseUid, email, email.toLowerCase(), PlatformRole.WORKER, Instant.now()
        );
        when(userAccountRepository.findByFirebaseUid(firebaseUid)).thenReturn(Optional.of(account));

        filter.doFilter(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        var auth = SecurityContextHolder.getContext().getAuthentication();
        assertThat(auth).isNotNull();
        assertThat(auth.getPrincipal()).isInstanceOf(AtlasPrincipal.class);
        AtlasPrincipal principal = (AtlasPrincipal) auth.getPrincipal();
        assertThat(principal.isProvisioned()).isTrue();
        assertThat(principal.userId()).isEqualTo(account.id());
        assertThat(principal.firebaseUid()).isEqualTo(firebaseUid);
        assertThat(principal.hasRole(PlatformRole.WORKER)).isTrue();
    }

    @Test
    void rejectsDisabledUser() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer valid-token");
        MockHttpServletResponse response = new MockHttpServletResponse();

        String firebaseUid = "fb-disabled-123";
        String email = "disabled@example.com";

        when(tokenVerifier.verify("valid-token")).thenReturn(
                new FirebaseVerifiedUser(firebaseUid, email, true, "Disabled User", Map.of())
        );

        UserAccount account = UserAccount.createWithFirebase(
                firebaseUid, email, email.toLowerCase(), PlatformRole.WORKER, Instant.now()
        );
        account.disable(Instant.now());
        when(userAccountRepository.findByFirebaseUid(firebaseUid)).thenReturn(Optional.of(account));

        filter.doFilter(request, response, filterChain);

        assertThat(response.getStatus()).isEqualTo(403);
        assertThat(response.getContentAsString()).contains("ACCOUNT_DISABLED");
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    void populatesUnprovisionedPrincipalForNewFirebaseUser() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer new-token");
        MockHttpServletResponse response = new MockHttpServletResponse();

        String firebaseUid = "fb-new-user";
        String email = "new@example.com";

        when(tokenVerifier.verify("new-token")).thenReturn(
                new FirebaseVerifiedUser(firebaseUid, email, false, "New User", Map.of())
        );
        when(userAccountRepository.findByFirebaseUid(firebaseUid)).thenReturn(Optional.empty());

        filter.doFilter(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        var auth = SecurityContextHolder.getContext().getAuthentication();
        assertThat(auth).isNotNull();
        AtlasPrincipal principal = (AtlasPrincipal) auth.getPrincipal();
        assertThat(principal.isProvisioned()).isFalse();
        assertThat(principal.userId()).isNull();
        assertThat(principal.firebaseUid()).isEqualTo(firebaseUid);
        assertThat(principal.roles()).isEmpty();
    }
}
