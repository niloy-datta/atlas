# API documentation

All public API routes use `/api/v1`, JSON camelCase fields, UUID identifiers, UTC timestamps, DTO allow-lists, and RFC 9457-compatible Problem Details. Generated OpenAPI JSON is served at `/api-docs`.

## Identity endpoints

| Method | Path | Authentication | Purpose |
| --- | --- | --- | --- |
| POST | `/api/v1/auth/bootstrap` | Firebase ID Token Bearer | Provisions the internal Atlas account with role (`worker` or `employer`) upon first sign-in |
| GET | `/api/v1/auth/me` | Firebase ID Token Bearer | Read the authenticated user allow-list, roles, and profile state |

ATLAS delegates primary credential management, passwords, social authentication (Google OAuth), email verification, and session refreshes to **Firebase Authentication**.

Clients authenticate with Firebase on the frontend, retrieve a Firebase ID token, and pass it in the `Authorization: Bearer <token>` header to the Spring Boot backend. The backend verifies the token using the Firebase Admin SDK, maps the Firebase UID to the internal Atlas UUID (`users.id`), and enforces roles and domain authorization.

Account provisioning is strictly handled by `POST /api/v1/auth/bootstrap`. The backend authentication filter is side-effect-free and never performs automatic email linking or implicit account creation.

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
