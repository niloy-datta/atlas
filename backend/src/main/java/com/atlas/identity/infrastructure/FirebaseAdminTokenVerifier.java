package com.atlas.identity.infrastructure;

import com.atlas.identity.application.FirebaseTokenVerifier;
import com.atlas.identity.application.FirebaseVerifiedUser;
import com.atlas.shared.error.ApiProblemException;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;

public class FirebaseAdminTokenVerifier implements FirebaseTokenVerifier {

    private static final Logger log = LoggerFactory.getLogger(FirebaseAdminTokenVerifier.class);

    private final FirebaseAuth firebaseAuth;

    public FirebaseAdminTokenVerifier(FirebaseAuth firebaseAuth) {
        this.firebaseAuth = firebaseAuth;
    }

    @Override
    public FirebaseVerifiedUser verify(String idToken) {
        if (idToken == null || idToken.isBlank()) {
            throw new ApiProblemException(
                    HttpStatus.UNAUTHORIZED,
                    "MISSING_BEARER_TOKEN",
                    "Missing Bearer Token",
                    "Firebase ID token is required."
            );
        }

        try {
            FirebaseToken decoded = firebaseAuth.verifyIdToken(idToken);
            return new FirebaseVerifiedUser(
                    decoded.getUid(),
                    decoded.getEmail(),
                    decoded.isEmailVerified(),
                    decoded.getName(),
                    decoded.getClaims()
            );
        } catch (FirebaseAuthException e) {
            log.warn("Firebase token verification failed: {} (code: {})", e.getMessage(), e.getAuthErrorCode());
            throw new ApiProblemException(
                    HttpStatus.UNAUTHORIZED,
                    "INVALID_FIREBASE_TOKEN",
                    "Invalid Firebase ID Token",
                    "Firebase token validation failed: " + e.getMessage()
            );
        } catch (Exception e) {
            log.error("Unexpected error during Firebase token verification", e);
            throw new ApiProblemException(
                    HttpStatus.UNAUTHORIZED,
                    "INVALID_FIREBASE_TOKEN",
                    "Invalid Firebase ID Token",
                    "Unable to verify authentication credentials."
            );
        }
    }
}
