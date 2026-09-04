package com.atlas.identity.application;

public interface FirebaseTokenVerifier {
    /**
     * Verifies a Firebase ID token with default revocation policy.
     *
     * @param idToken the raw Bearer token string
     * @return the verified user information
     * @throws com.atlas.shared.error.ApiProblemException if token is invalid, expired, or malformed
     */
    FirebaseVerifiedUser verify(String idToken);

    /**
     * Verifies a Firebase ID token with explicit revocation checking.
     *
     * @param idToken the raw Bearer token string
     * @param checkRevoked whether to verify revocation against Firebase server
     * @return the verified user information
     * @throws com.atlas.shared.error.ApiProblemException if token is invalid, expired, or malformed
     */
    FirebaseVerifiedUser verify(String idToken, boolean checkRevoked);
}
