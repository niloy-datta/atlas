# ATLAS Current State

Date: 2026-09-06
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
| **Database & Invariants** | `HARDENED` | PostgreSQL 18 + PostGIS 3.6. Flyway migrations up to `V11__harden_application_targets.sql`. Composite foreign keys, cross-tenant isolation, XOR check constraints (`job_id` vs `shift_id`). |
| **Frontend Applications** | `PRODUCTION-READY` | Next.js 16 App Router, React 19, Tailwind CSS. Integrated apply modals, worker invitation & application pipelines, employer applicant management dashboard. |
| **CI / CD Automation** | `ACTIVE` | GitHub Actions CI workflow (`.github/workflows/ci.yml`) testing backend (Maven wrapper, JUnit 5) and frontend (lint, TypeScript check, Vitest 17 unit tests, Next.js production build). Automated GitHub Pages deployment (`.github/workflows/deploy-pages.yml`). |
| **Verification Tooling** | `HARDENED` | Cross-platform `scripts/verify.ps1` runs native Maven & npm test suites without WSL path dependencies. |

## Completed Phases

- **Phase 0–6**: Platform foundation, identity boundary, private/public WorkPass, tenant-isolated organizations, SkillProof, and secure credentials.
- **Phase 7–8**: Jobs domain, flexible shifts domain, supervisor assignment, time slots.
- **Phase 9**: Application & Invitation transactional core, candidate key hardening (`V11`), employer pipeline, worker pipeline, and CI/CD automation.
