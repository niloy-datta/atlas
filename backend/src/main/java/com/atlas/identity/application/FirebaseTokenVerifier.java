package com.atlas.identity.application;

public interface FirebaseTokenVerifier {
    /**
     * Verifies a Firebase ID token.
     *
     * @param idToken the raw Bearer token string
     * @return the verified user information
     * @throws com.atlas.shared.error.ApiProblemException if token is invalid, expired, or malformed
     */
    FirebaseVerifiedUser verify(String idToken);
}
