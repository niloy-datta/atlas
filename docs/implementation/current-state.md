# ATLAS Current State

Date: 2026-10-01
Repository: `niloy-datta/atlas` (SkillHub / ATLAS Platform)
License: MIT

## Platform Capability Matrix

| Capability Area | Status | Implementation Details |
|---|---|---|
| **Identity & Auth** | `PRODUCTION-READY` | Firebase Auth (Web v12) + Spring Boot Firebase Admin SDK (v9). ATLAS principal mapping, tenant membership, token verification. |
| **Worker Profiles & WorkPass** | `PRODUCTION-READY` | Private worker profiles, public verified WorkPass (`/workpass/[handle]`), privacy toggles, QR share, skills & credentials. |
| **Organization & Tenancy** | `PRODUCTION-READY` | Multi-tenant organization isolation, member management, invitation tokens, role-based access controls. |
| **Jobs & Shifts Engine** | `PRODUCTION-READY` | Full lifecycle management for fixed jobs and flexible shifts, location geo-tagging, schedule intervals, pay rates, supervisor assignments. |
| **Applications Domain** | `PRODUCTION-READY` | Phase 9 completed. Unified polymorphic applications (Jobs & Shifts), state machine (`SUBMITTED -> REVIEWING -> SHORTLISTED -> ACCEPTED / REJECTED / WITHDRAWN`), database-enforced integrity (`V11`), optimistic locking. |
| **Invitations Domain** | `PRODUCTION-READY` | Phase 9 completed. Direct organization-to-worker invitations for jobs/shifts, automatic TTL expiration, acceptance/decline flow, database-enforced candidate targets. |
| **Database & Invariants** | `HARDENED` | PostgreSQL 18 + PostGIS 3.6. Flyway migrations up to `V16__idempotency.sql`. Composite foreign keys, cross-tenant isolation, XOR check constraints (`job_id` vs `shift_id`). |
| **Workforce Pools** | `IMPLEMENTED` | Phase 10 reusable organization-scoped worker pools, membership management, duplicate protection, tenant-safe composite foreign keys, and optimistic pool updates. |
| **Recurring Availability** | `IMPLEMENTED` | Phase 11 timezone-aware weekly rules, date overrides, DST-safe instant resolution, optimistic updates, and worker-scoped isolation. |
| **Nearby Discovery** | `IMPLEMENTED` | Phase 12 behavior is already present in jobs/shifts: PostGIS geography, GiST indexes, ST_DWithin filtering, and ST_Distance ranking. |
| **MatchEngine V1** | `IMPLEMENTED` | Phase 13 deterministic ranking with explainable skill, verified-skill, distance, availability, and profile-completeness components. |
| **Reservations** | `IMPLEMENTED` | Phase 14 shift reservations serialize capacity decisions with PostgreSQL row locks, enforce one active reservation per worker/shift, and support optimistic cancellation. |
| **Idempotency** | `IMPLEMENTED` | Phase 15 reusable transactional idempotency records with request hashing, stored response replay, conflicting-payload detection, and concurrent retry coverage. |
| **Frontend Applications** | `EXPANDED` | Next.js 16 App Router, React 19, Tailwind CSS. Adds real workforce-pool operations, deterministic match review, idempotent shift reservation actions, and worker availability/override management on top of onboarding, jobs, shifts, and application flows. |
| **CI / CD Automation** | `ACTIVE` | GitHub Actions CI workflow (`.github/workflows/ci.yml`) testing backend (Maven wrapper, JUnit 5) and frontend (lint, TypeScript check, Vitest 17 unit tests, Next.js production build). Automated GitHub Pages deployment (`.github/workflows/deploy-pages.yml`). |
| **Verification Tooling** | `HARDENED` | Cross-platform `scripts/verify.ps1` runs native Maven & npm test suites without WSL path dependencies. |

## Completed Phases

- **Phase 0–6**: Platform foundation, identity boundary, private/public WorkPass, tenant-isolated organizations, SkillProof, and secure credentials.
- **Phase 7–8**: Jobs domain, flexible shifts domain, supervisor assignment, time slots.
- **Phase 9**: Application & Invitation transactional core, candidate key hardening (`V11`), employer pipeline, worker pipeline, and CI/CD automation.
- **Phase 10**: Workforce Pools with reusable worker membership, tenant isolation, duplicate protection, and integration tests.
- **Phase 11**: Recurring Availability & Overrides with IANA timezones, DST-aware resolution, date overrides, and isolation tests.
- **Phase 12**: Nearby Discovery already implemented through real PostGIS queries and GiST location indexes.
- **Phase 13**: Deterministic MatchEngine V1 with reproducible scoring, explainable breakdowns, and tenant-isolated match endpoints.
- **Phase 14**: Concurrency-safe shift reservations with row-level locking and high-contention capacity tests.
- **Phase 15**: Reusable Idempotency with request hashing, replayed responses, mismatch rejection, and concurrent retry tests.
- **Phase 16 (partial)**: New workforce operations and worker availability pages connect Phases 10–15 to real frontend workflows; remaining demo/static surfaces are still tracked separately.
