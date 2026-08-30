# API documentation

All public API routes use `/api/v1`, JSON camelCase fields, UUID identifiers, UTC timestamps, DTO allow-lists, and RFC 9457-compatible Problem Details. Generated OpenAPI JSON is served at `/api-docs`.

## Identity endpoints

| Method | Path | Authentication | Purpose |
| --- | --- | --- | --- |
| POST | `/api/v1/auth/register/worker` | Public | Register a worker and establish a session |
| POST | `/api/v1/auth/register/employer` | Public | Register an employer administrator and establish a session |
| POST | `/api/v1/auth/login` | Public | Authenticate and establish a session |
| POST | `/api/v1/auth/refresh` | Refresh cookie + origin + CSRF | Rotate the refresh token and issue a new access token |
| POST | `/api/v1/auth/logout` | Refresh cookie + origin + CSRF | Revoke the current session and clear cookies |
| POST | `/api/v1/auth/password-recovery` | Public, rate limited | Request a reset without revealing account existence |
| POST | `/api/v1/auth/password-reset` | One-time reset token | Change password and revoke all sessions |
| GET | `/api/v1/auth/me` | Bearer JWT | Read the current user allow-list |
| GET | `/api/v1/auth/sessions` | Bearer JWT | List the caller's sessions |
| DELETE | `/api/v1/auth/sessions/{sessionId}` | Bearer JWT | Revoke one caller-owned session |

Successful registration, login, and refresh responses return the 10-minute access token in JSON. The 30-day opaque refresh token is set only in the `atlas_refresh` HttpOnly cookie. Browser clients read the non-HttpOnly `atlas_csrf` cookie and echo it in `X-CSRF-TOKEN` for refresh and logout. Access tokens must remain in memory.

Recovery always returns `202 Accepted` for a valid email-shaped request, whether or not an account exists. Local reset emails appear in Mailpit at `http://localhost:8025`.

## Worker profile endpoints

| Method | Path | Authentication | Purpose |
| --- | --- | --- | --- |
| GET | `/api/v1/workers/me/profile` | Worker bearer JWT | Read the private profile |
| PUT | `/api/v1/workers/me/profile` | Worker bearer JWT | Replace the allow-listed profile using its version |
| GET | `/api/v1/workers/me/work-pass` | Worker bearer JWT | Read the private WorkPass |
| GET | `/api/v1/work-pass/{handle}` | Public | Read a public, privacy-filtered WorkPass |

## Organization endpoints

| Method | Path | Authorization | Purpose |
| --- | --- | --- | --- |
| POST/GET | `/api/v1/organizations` | Employer bearer JWT | Create or list caller memberships |
| GET/PUT | `/api/v1/organizations/{organizationId}` | Tenant policy | Read or version-replace the organization profile |
| GET | `/api/v1/organizations/{organizationId}/members` | Organization member | List members |
| PATCH | `/api/v1/organizations/{organizationId}/members/{memberId}/role` | Member-management permission | Change a member role |
| DELETE | `/api/v1/organizations/{organizationId}/members/{memberId}` | Member-management permission | Remove a member |
| POST | `/api/v1/organizations/{organizationId}/invitations` | Member-management permission | Invite a member |
| POST | `/api/v1/organizations/invitations/{invitationId}/accept` | Matching authenticated email | Accept an invitation |
| POST/GET | `/api/v1/organizations/{organizationId}/locations` | Tenant policy | Create or list PostGIS locations |
| POST | `/api/v1/organizations/{organizationId}/verification-request` | Profile-management permission | Move from unverified to pending |
| PATCH | `/api/v1/admin/organizations/{organizationId}/verification` | Platform admin | Apply an allowed verification transition |

Unknown and cross-tenant organization identifiers deliberately return the same not-found response. Client-provided organization identifiers select a resource but never establish authorization.
