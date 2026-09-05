package com.atlas.identity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.atlas.identity.application.AuthenticationService;
import com.atlas.identity.audit.SecurityAuditService;
import com.atlas.identity.domain.AtlasPrincipal;
import com.atlas.identity.domain.PlatformRole;
import com.atlas.identity.domain.UserAccount;
import com.atlas.identity.infrastructure.UserAccountRepository;
import com.atlas.shared.error.ApiProblemException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

class AuthenticationServiceTests {

    private UserAccountRepository users;
    private SecurityAuditService audit;
    private Clock clock;
    private AuthenticationService service;

    @BeforeEach
    void setUp() {
        users = mock(UserAccountRepository.class);
        audit = mock(SecurityAuditService.class);
        clock = Clock.fixed(Instant.parse("2026-09-01T12:00:00Z"), ZoneOffset.UTC);
        service = new AuthenticationService(users, audit, clock);
    }

    @Test
    void bootstrapRejectsNullOrBlankFirebaseUid() {
        AtlasPrincipal invalid = new AtlasPrincipal(null, null, "test@atlas.test", true, Set.of());
        AuthenticationService.RequestMetadata metadata = new AuthenticationService.RequestMetadata("127.0.0.1", "test-agent");

        assertThatThrownBy(() -> service.bootstrap(invalid, "worker", metadata))
                .isInstanceOf(ApiProblemException.class)
                .satisfies(ex -> {
                    ApiProblemException apiEx = (ApiProblemException) ex;
                    assertThat(apiEx.status()).isEqualTo(HttpStatus.UNAUTHORIZED);
                    assertThat(apiEx.code()).isEqualTo("UNAUTHENTICATED");
                });
    }

    @Test
    void bootstrapReturnsExistingUserWhenAlreadyBootstrapped() {
        String firebaseUid = "fb-existing";
        String email = "worker@atlas.test";
        AtlasPrincipal principal = new AtlasPrincipal(null, firebaseUid, email, true, Set.of());
        AuthenticationService.RequestMetadata metadata = new AuthenticationService.RequestMetadata("127.0.0.1", "test-agent");

        UserAccount existing = UserAccount.createWithFirebase(firebaseUid, email, email, PlatformRole.WORKER, Instant.now(clock));
        when(users.findByFirebaseUid(firebaseUid)).thenReturn(Optional.of(existing));

        AuthenticationService.BootstrapResult result = service.bootstrap(principal, "worker", metadata);

        assertThat(result.created()).isFalse();
        assertThat(result.user().email()).isEqualTo(email);
        assertThat(result.user().roles()).containsExactly("WORKER");
    }

    @Test
    void bootstrapRejectsMissingEmail() {
        String firebaseUid = "fb-no-email";
        AtlasPrincipal principal = new AtlasPrincipal(null, firebaseUid, null, false, Set.of());
        AuthenticationService.RequestMetadata metadata = new AuthenticationService.RequestMetadata("127.0.0.1", "test-agent");

        when(users.findByFirebaseUid(firebaseUid)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.bootstrap(principal, "worker", metadata))
                .isInstanceOf(ApiProblemException.class)
                .satisfies(ex -> {
                    ApiProblemException apiEx = (ApiProblemException) ex;
                    assertThat(apiEx.status()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(apiEx.code()).isEqualTo("MISSING_EMAIL");
                });
    }

    @Test
    void bootstrapRejectsConflictingEmailUnderDifferentUid() {
        String firebaseUid = "fb-new";
        String email = "existing@atlas.test";
        AtlasPrincipal principal = new AtlasPrincipal(null, firebaseUid, email, true, Set.of());
        AuthenticationService.RequestMetadata metadata = new AuthenticationService.RequestMetadata("127.0.0.1", "test-agent");

        when(users.findByFirebaseUid(firebaseUid)).thenReturn(Optional.empty());
        UserAccount differentUser = UserAccount.createWithFirebase("fb-other", email, email, PlatformRole.WORKER, Instant.now(clock));
        when(users.findByEmailNormalized(email)).thenReturn(Optional.of(differentUser));

        assertThatThrownBy(() -> service.bootstrap(principal, "worker", metadata))
                .isInstanceOf(ApiProblemException.class)
                .satisfies(ex -> {
                    ApiProblemException apiEx = (ApiProblemException) ex;
                    assertThat(apiEx.status()).isEqualTo(HttpStatus.CONFLICT);
                    assertThat(apiEx.code()).isEqualTo("EMAIL_ALREADY_REGISTERED");
                });
    }

    @Test
    void bootstrapRejectsInvalidAccountType() {
        String firebaseUid = "fb-valid";
        String email = "valid@atlas.test";
        AtlasPrincipal principal = new AtlasPrincipal(null, firebaseUid, email, true, Set.of());
        AuthenticationService.RequestMetadata metadata = new AuthenticationService.RequestMetadata("127.0.0.1", "test-agent");

        when(users.findByFirebaseUid(firebaseUid)).thenReturn(Optional.empty());
        when(users.findByEmailNormalized(email)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.bootstrap(principal, "admin", metadata))
                .isInstanceOf(ApiProblemException.class)
                .satisfies(ex -> {
                    ApiProblemException apiEx = (ApiProblemException) ex;
                    assertThat(apiEx.status()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(apiEx.code()).isEqualTo("INVALID_ACCOUNT_TYPE");
                });
    }

    @Test
    void bootstrapProvisionsWorkerSuccessfully() {
        String firebaseUid = "fb-worker-new";
        String email = "newworker@atlas.test";
        AtlasPrincipal principal = new AtlasPrincipal(null, firebaseUid, email, true, Set.of());
        AuthenticationService.RequestMetadata metadata = new AuthenticationService.RequestMetadata("127.0.0.1", "test-agent");

        when(users.findByFirebaseUid(firebaseUid)).thenReturn(Optional.empty());
        when(users.findByEmailNormalized(email)).thenReturn(Optional.empty());

        AuthenticationService.BootstrapResult result = service.bootstrap(principal, "worker", metadata);

        assertThat(result.created()).isTrue();
        assertThat(result.user().email()).isEqualTo(email);
        assertThat(result.user().roles()).containsExactly("WORKER");
        verify(users).saveAndFlush(any(UserAccount.class));
        verify(audit).record(any(UUID.class), eq("ACCOUNT_BOOTSTRAPPED"), eq("SUCCESS"), any(UUID.class), eq("127.0.0.1"), eq("test-agent"));
    }

    @Test
    void bootstrapProvisionsEmployerSuccessfully() {
        String firebaseUid = "fb-employer-new";
        String email = "employer@atlas.test";
        AtlasPrincipal principal = new AtlasPrincipal(null, firebaseUid, email, true, Set.of());
        AuthenticationService.RequestMetadata metadata = new AuthenticationService.RequestMetadata("127.0.0.1", "test-agent");

        when(users.findByFirebaseUid(firebaseUid)).thenReturn(Optional.empty());
        when(users.findByEmailNormalized(email)).thenReturn(Optional.empty());

        AuthenticationService.BootstrapResult result = service.bootstrap(principal, "employer", metadata);

        assertThat(result.created()).isTrue();
        assertThat(result.user().email()).isEqualTo(email);
        assertThat(result.user().roles()).containsExactly("EMPLOYER_ADMIN");
        verify(users).saveAndFlush(any(UserAccount.class));
    }

    @Test
    void currentUserReturnsDetailsWhenUserExists() {
        UUID userId = UUID.randomUUID();
        String email = "existing@atlas.test";
        UserAccount user = UserAccount.createWithFirebase("fb-uid", email, email, PlatformRole.WORKER, Instant.now(clock));
        when(users.findById(userId)).thenReturn(Optional.of(user));

        AuthenticationService.CurrentUser currentUser = service.currentUser(userId);

        assertThat(currentUser.email()).isEqualTo(email);
        assertThat(currentUser.roles()).containsExactly("WORKER");
    }

    @Test
    void currentUserThrowsWhenNotFound() {
        UUID userId = UUID.randomUUID();
        when(users.findById(userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.currentUser(userId))
                .isInstanceOf(ApiProblemException.class)
                .satisfies(ex -> {
                    ApiProblemException apiEx = (ApiProblemException) ex;
                    assertThat(apiEx.status()).isEqualTo(HttpStatus.UNAUTHORIZED);
                    assertThat(apiEx.code()).isEqualTo("AUTHENTICATION_FAILED");
                });
    }
}
