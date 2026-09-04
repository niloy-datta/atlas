# ADR 007: Firebase Authentication Strategy

- Status: Accepted
- Date: 2026-09-04
- Supersedes: ADR 004

## Context

ATLAS previously maintained a bespoke identity infrastructure featuring custom HMAC-SHA-256 JWT access tokens, opaque refresh tokens stored in cookies with rotation/revocation in PostgreSQL, argon2id password hashing, and server-managed password recovery emails.

While secure, this required maintaining custom session rotation logic, cookie CSRF mechanisms, rate-limiting layers, and mail delivery infrastructure. Transitioning to Firebase Authentication delegates client credentials, MFA, identity federation (e.g. Google Sign-In), password lifecycle, and secure token issuance to Firebase while ATLAS preserves strict business authority, tenant boundaries, role-based access control, and user provisioning.

## Decision

1. **Client Identity Delegation**:
   - The Next.js frontend uses Firebase Client SDK (v12+) for all identity operations: Email/Password signup & login, Google popup/redirect authentication, password resets, and email verification.
   - Credentials (passwords, social provider secrets) never touch ATLAS backend servers.
   - Authentication tokens are short-lived Firebase ID tokens (JWTs) sent via Authorization: Bearer <idToken>.

2. **Backend Token Verification & Authority**:
   - The Spring Boot backend uses the Firebase Admin SDK (FirebaseTokenVerifier) to cryptographically verify Firebase ID tokens (issuer, audience, signature, expiration).
   - Authoritative user state, roles (WORKER, EMPLOYER_ADMIN, PLATFORM_ADMIN), and domain profiles reside strictly in ATLAS PostgreSQL (users table).
   - In integration test environments, a deterministic @Primary FirebaseTokenVerifier mock handles mock identities and token failure cases without external cloud dependencies.

3. **User Account Bootstrapping & Linking Security**:
   - First-time authenticated users call POST /api/v1/auth/bootstrap with their requested account type (worker or employer).
   - The endpoint idempotently resolves or provisions the Atlas user record linked via firebase_uid.
   - **Zero Automatic Email Linking**: ATLAS explicitly rejects linking an incoming Firebase UID to an existing user by email alone (EMAIL_ALREADY_REGISTERED conflict) to prevent account takeover vectors.
   - Account disabled status (enabled = false) is enforced authoritative on every authenticated request with ACCOUNT_DISABLED (403 Forbidden).

4. **Elimination of Legacy Session Footprint**:
   - Removed obsolete atlas.auth configuration, custom JWT encoder/decoders, session tables, refresh token cookies, CSRF double-submit cookies, and backend password recovery mailers.
   - The API is stateless with SessionCreationPolicy.STATELESS.

## Consequences

- Reduced backend attack surface and eliminated maintenance of password hashing and mail delivery.
- Frontend manages token lifecycle and automatic refresh via Firebase Auth.
- Backend remains decoupled from identity providers and maintains single-source-of-truth authorization.
