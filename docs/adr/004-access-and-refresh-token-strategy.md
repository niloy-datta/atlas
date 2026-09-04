# ADR 004: Access and refresh token strategy

- Status: Superseded by ADR 007
- Date: 2026-08-30 (Superseded: 2026-09-04)

## Context

ATLAS browser sessions need short-lived API credentials, revocation, reuse detection, and protection against token theft without placing bearer credentials in persistent browser storage.

## Decision

Issue HMAC-SHA-256 JWT access tokens for 10 minutes with validated issuer, audience, expiry, unique ID, roles, subject, and session ID. Keep access tokens in browser memory. Issue 256-bit opaque refresh tokens for at most 30 days in `HttpOnly`, `SameSite=Lax` cookies; store only HMAC-SHA-256 keyed hashes in PostgreSQL. Rotate on every refresh under a row lock. Reuse of a non-active family member revokes the family and session. Check authoritative session state on every authenticated request so explicit revocation is immediate.

Cookie commands require both an allow-listed `Origin` and a constant-time double-submit CSRF comparison. Password-reset tokens use the same opaque/keyed-hash pattern and are single-use. Password reset revokes all sessions.

## Consequences

- PostgreSQL remains the session authority and enables deterministic rotation and audit evidence.
- A database lookup is added to authenticated requests; Phase 17 may add non-authoritative Redis acceleration without changing correctness.
- HMAC secrets must be high entropy, externally managed, rotated deliberately, and never shared with clients.
- Multi-key JWT rotation and asymmetric signing remain production-hardening work before independent token issuers or verifiers exist.

## Revisit conditions

Revisit signing-key topology when ATLAS has multiple independent token issuers/verifiers, external identity federation, or a managed key service. Revisit session lookup acceleration only after measurement.
