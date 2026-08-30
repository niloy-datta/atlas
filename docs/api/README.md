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

## SkillProof endpoints

| Method | Path | Authorization | Purpose |
| --- | --- | --- | --- |
| GET | `/api/v1/skills/categories` | Public | List active skill categories |
| GET | `/api/v1/skills` | Public | Search active catalogue skills |
| POST | `/api/v1/admin/skill-categories` | Platform admin | Create a category |
| POST | `/api/v1/admin/skills` | Platform admin | Create a skill |
| PATCH | `/api/v1/admin/skills/{skillId}/active` | Platform admin | Activate or deactivate a skill |
| GET/POST | `/api/v1/workers/me/skills` | Worker | List or declare worker skills |
| PATCH/DELETE | `/api/v1/workers/me/skills/{workerSkillId}` | Owning worker | Change proficiency or remove an unverified skill |
| POST | `/api/v1/workers/me/skills/{workerSkillId}/evidence` | Owning worker | Submit verification evidence |
| PATCH | `/api/v1/admin/worker-skills/{workerSkillId}/verification` | Platform admin | Verify, reject, or revoke through an allowed transition |
| POST | `/api/v1/worker-skills/{workerSkillId}/endorsements` | Authenticated non-owner | Endorse a verified skill once |

Evidence references are returned only through private worker/admin flows. Public catalogue responses contain no worker evidence or account data.

## Credential endpoints

| Method | Path | Authorization | Purpose |
| --- | --- | --- | --- |
| GET/POST | `/api/v1/workers/me/credentials` | Worker | List or create worker-owned credential metadata |
| GET/PUT/DELETE | `/api/v1/workers/me/credentials/{credentialId}` | Owning worker | Read, version-replace, or delete an eligible credential |
| POST | `/api/v1/workers/me/credentials/{credentialId}/uploads` | Owning worker | Create a short-lived signed upload authorization |
| POST | `/api/v1/workers/me/credentials/{credentialId}/documents/{documentId}/complete` | Owning worker | Inspect file size, signature, and malware status |
| POST | `/api/v1/workers/me/credentials/{credentialId}/submit` | Owning worker | Submit a clean credential for review |
| PATCH | `/api/v1/admin/credentials/{credentialId}/verification` | Platform admin | Verify, reject, or revoke through an allowed transition |
| POST | `/api/v1/workers/me/credentials/{credentialId}/shares` | Owning worker | Grant temporary private access to another user |
| DELETE | `/api/v1/workers/me/credentials/shares/{shareId}` | Grant owner | Revoke a sharing grant |
| GET | `/api/v1/credential-documents/{documentId}/download` | Owner or active grantee | Create a short-lived signed download authorization |
| GET | `/api/v1/public/credentials/{credentialId}` | Public | Read the allow-listed summary of a verified public credential |

Database responses never include storage object keys. Document access is authorized by the application before a temporary signed URL is created. Public summaries exclude credential numbers, documents, worker account identifiers, and verification evidence.
