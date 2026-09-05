package com.atlas.identity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.atlas.identity.application.FirebaseVerifiedUser;
import com.atlas.identity.infrastructure.FirebaseAdminTokenVerifier;
import com.atlas.shared.error.ApiProblemException;
import com.google.firebase.ErrorCode;
import com.google.firebase.auth.AuthErrorCode;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import java.util.Map;

class FirebaseAdminTokenVerifierTests {

    private FirebaseAuth firebaseAuth;
    private FirebaseAdminTokenVerifier verifier;

    @BeforeEach
    void setUp() {
        firebaseAuth = mock(FirebaseAuth.class);
        verifier = new FirebaseAdminTokenVerifier(firebaseAuth, false);
    }

    @Test
    void rejectsNullOrBlankToken() {
        assertThatThrownBy(() -> verifier.verify(null))
                .isInstanceOf(ApiProblemException.class)
                .satisfies(ex -> {
                    ApiProblemException apiEx = (ApiProblemException) ex;
                    assertThat(apiEx.status()).isEqualTo(HttpStatus.UNAUTHORIZED);
                    assertThat(apiEx.code()).isEqualTo("MISSING_BEARER_TOKEN");
                });

        assertThatThrownBy(() -> verifier.verify("   "))
                .isInstanceOf(ApiProblemException.class)
                .satisfies(ex -> {
                    ApiProblemException apiEx = (ApiProblemException) ex;
                    assertThat(apiEx.status()).isEqualTo(HttpStatus.UNAUTHORIZED);
                    assertThat(apiEx.code()).isEqualTo("MISSING_BEARER_TOKEN");
                });
    }

    @Test
    void verifiesValidTokenSuccessfully() throws FirebaseAuthException {
        String rawToken = "valid-token";
        FirebaseToken mockDecodedToken = mock(FirebaseToken.class);
        when(mockDecodedToken.getUid()).thenReturn("user-123");
        when(mockDecodedToken.getEmail()).thenReturn("user@example.com");
        when(mockDecodedToken.isEmailVerified()).thenReturn(true);
        when(mockDecodedToken.getName()).thenReturn("Jane Doe");
        when(mockDecodedToken.getClaims()).thenReturn(Map.of("role", "worker"));

        when(firebaseAuth.verifyIdToken(eq(rawToken), eq(false))).thenReturn(mockDecodedToken);

        FirebaseVerifiedUser result = verifier.verify(rawToken);

        assertThat(result.uid()).isEqualTo("user-123");
        assertThat(result.email()).isEqualTo("user@example.com");
        assertThat(result.emailVerified()).isTrue();
        assertThat(result.name()).isEqualTo("Jane Doe");
        assertThat(result.claims()).containsEntry("role", "worker");
    }

    @Test
    void mapsExpiredTokenException() throws FirebaseAuthException {
        FirebaseAuthException expiredEx = mock(FirebaseAuthException.class);
        when(expiredEx.getAuthErrorCode()).thenReturn(AuthErrorCode.EXPIRED_ID_TOKEN);
        when(firebaseAuth.verifyIdToken("expired-token", false)).thenThrow(expiredEx);

        assertThatThrownBy(() -> verifier.verify("expired-token"))
                .isInstanceOf(ApiProblemException.class)
                .satisfies(ex -> {
                    ApiProblemException apiEx = (ApiProblemException) ex;
                    assertThat(apiEx.status()).isEqualTo(HttpStatus.UNAUTHORIZED);
                    assertThat(apiEx.code()).isEqualTo("EXPIRED_FIREBASE_TOKEN");
                });
    }

    @Test
    void mapsRevokedTokenException() throws FirebaseAuthException {
        FirebaseAuthException revokedEx = mock(FirebaseAuthException.class);
        when(revokedEx.getAuthErrorCode()).thenReturn(AuthErrorCode.REVOKED_ID_TOKEN);
        when(firebaseAuth.verifyIdToken("revoked-token", false)).thenThrow(revokedEx);

        assertThatThrownBy(() -> verifier.verify("revoked-token"))
                .isInstanceOf(ApiProblemException.class)
                .satisfies(ex -> {
                    ApiProblemException apiEx = (ApiProblemException) ex;
                    assertThat(apiEx.status()).isEqualTo(HttpStatus.UNAUTHORIZED);
                    assertThat(apiEx.code()).isEqualTo("REVOKED_FIREBASE_TOKEN");
                });
    }
}
