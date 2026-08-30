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
