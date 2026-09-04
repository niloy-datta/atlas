package com.atlas.identity.infrastructure;

import com.atlas.identity.application.FirebaseTokenVerifier;
import com.atlas.identity.application.FirebaseVerifiedUser;
import com.atlas.shared.error.ApiProblemException;
import com.google.firebase.auth.AuthErrorCode;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;

public class FirebaseAdminTokenVerifier implements FirebaseTokenVerifier {

    private static final Logger log = LoggerFactory.getLogger(FirebaseAdminTokenVerifier.class);

    private final FirebaseAuth firebaseAuth;
    private final boolean defaultCheckRevocation;

    public FirebaseAdminTokenVerifier(FirebaseAuth firebaseAuth) {
        this(firebaseAuth, false);
    }

    public FirebaseAdminTokenVerifier(FirebaseAuth firebaseAuth, boolean defaultCheckRevocation) {
        this.firebaseAuth = firebaseAuth;
        this.defaultCheckRevocation = defaultCheckRevocation;
    }

    @Override
    public FirebaseVerifiedUser verify(String idToken) {
        return verify(idToken, this.defaultCheckRevocation);
    }

    @Override
    public FirebaseVerifiedUser verify(String idToken, boolean checkRevoked) {
        if (idToken == null || idToken.isBlank()) {
            throw new ApiProblemException(
                    HttpStatus.UNAUTHORIZED,
                    "MISSING_BEARER_TOKEN",
                    "Missing Bearer Token",
                    "Firebase ID token is required."
            );
        }

        try {
            FirebaseToken decoded = firebaseAuth.verifyIdToken(idToken, checkRevoked);
            return new FirebaseVerifiedUser(
                    decoded.getUid(),
                    decoded.getEmail(),
                    decoded.isEmailVerified(),
                    decoded.getName(),
                    decoded.getClaims()
            );
        } catch (FirebaseAuthException e) {
            log.warn("Firebase token verification failed (code: {})", e.getAuthErrorCode());
            String code = "INVALID_FIREBASE_TOKEN";
            String title = "Invalid Firebase ID Token";
            String detail = "Firebase token validation failed.";

            if (e.getAuthErrorCode() == AuthErrorCode.EXPIRED_ID_TOKEN) {
                code = "EXPIRED_FIREBASE_TOKEN";
                title = "Expired Firebase ID Token";
                detail = "Firebase ID token has expired.";
            } else if (e.getAuthErrorCode() == AuthErrorCode.REVOKED_ID_TOKEN) {
                code = "REVOKED_FIREBASE_TOKEN";
                title = "Revoked Firebase ID Token";
                detail = "Firebase ID token has been revoked.";
            }

            throw new ApiProblemException(HttpStatus.UNAUTHORIZED, code, title, detail);
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
