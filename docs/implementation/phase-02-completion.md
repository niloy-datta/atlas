# Phase 2 Completion Report

Date: 2026-08-30

## Implemented

- Worker and employer registration with normalized unique email addresses and allow-listed roles.
- Argon2id password hashing and transparent hash-parameter upgrade on successful login.
- Ten-minute signed JWT access tokens with issuer, audience, expiry, subject, role, unique ID, and session claims.
- Thirty-day opaque refresh tokens stored only as keyed HMAC-SHA-256 hashes.
- Transactional refresh rotation protected by PostgreSQL pessimistic row locking.
- Refresh-token family reuse detection with immediate session/family revocation.
- Current-user, session-listing, session-revocation, refresh, logout, recovery, and reset endpoints.
- Password-reset tokens stored as keyed hashes, single-use enforcement, and all-session revocation after reset.
- Origin allow-listing and double-submit CSRF checks for refresh/logout cookie commands.
- Fixed-window login and recovery limits with configuration hooks; distributed Redis limits remain Phase 17.
- Security audit events for login outcomes, password reset, session revocation, and token reuse detection.
- Local SMTP delivery through pinned Mailpit and a provider interface for future production email selection.
- RFC-compatible Problem Details for application and security failures.
- Generated OpenAPI JSON at `/api-docs`.

## Important Files

- `backend/src/main/resources/db/migration/V2__identity_and_sessions.sql`
- `backend/src/main/java/com/atlas/identity/application/AuthenticationService.java`
- `backend/src/main/java/com/atlas/identity/web/AuthenticationController.java`
- `backend/src/main/java/com/atlas/shared/config/SecurityConfiguration.java`
- `backend/src/test/java/com/atlas/identity/AuthenticationIntegrationTests.java`
- `docs/adr/004-access-and-refresh-token-strategy.md`

## Database Changes

Added `users`, `user_roles`, `user_sessions`, `refresh_tokens`, `password_reset_tokens`, and `audit_events`, including foreign keys, role/status checks, normalized-email uniqueness, token-hash uniqueness, active-session indexes, audit indexes, and a partial unique index allowing one active refresh token per session.

## Tests and Results

- Backend: 12 tests passed, 0 failed, 0 errors, 0 skipped.
- Real PostgreSQL/PostGIS and Redis Testcontainers validate both Flyway migrations and persistence behavior.
- Tests cover registration roles, normalization/duplicate prevention, Argon2id storage, absence of raw refresh tokens, login denial, JWT issuer/audience/expiry validation, CSRF denial, origin denial, refresh rotation, family reuse revocation, immediate access revocation, recovery non-enumeration, single-use reset, session ownership, and fixed-window limiting.
- Compose configuration passed; PostgreSQL, Redis, and Mailpit were healthy, and Mailpit `/readyz` returned HTTP 200.

## Security Review

- JPA entities are never serialized; response records expose allow-listed fields.
- Access tokens are returned only in no-store responses; refresh cookies are HttpOnly and can be Secure by configuration.
- Raw refresh/reset tokens are never persisted or logged by application code.
- Authentication failures use generic responses to limit enumeration.
- Reset requests return the same accepted response for existing and missing accounts.
- Client IP uses the servlet remote address; forwarded headers are not trusted until proxy trust is explicitly configured.
- CORS is credentialed only for configured exact origins.

## Known Limitations

- Local development defaults use documented non-production secrets and `Secure=false`; production must supply strong external secrets and HTTPS cookie configuration.
- Rate limiting is instance-local in Phase 2. Redis-backed distributed limits are intentionally deferred to Phase 17.
- Mailpit is a local catcher; no production email provider has been selected.
- JWT signing uses one HMAC key. Multi-key rotation or asymmetric signing should be introduced when deployment topology requires it.
- Email ownership verification and MFA are not included in the approved Phase 2 scope.
- The JDK emits the existing Mockito dynamic-agent warning during tests.

## Next Phase

Phase 3 implements worker profiles, privacy controls, deterministic profile completion, PostGIS worker location, and public/private WorkPass contracts. Do not begin without explicit authorization.
