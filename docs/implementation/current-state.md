# ATLAS Current State

Date: 2026-08-30
Repository state at audit: empty projectless workspace, not a Git repository

## Existing stack

| Area | Audit result | Phase 1 action |
|---|---|---|
| Backend | Not implemented | Spring Boot 4.1.1 modular-monolith foundation |
| Frontend | Not implemented | Next.js 16.3.3 structural shell |
| Database | Not implemented | PostgreSQL 18 / PostGIS 3.6 through Compose |
| Authentication | Not implemented | Deferred to Phase 2 |
| Testing | Not implemented | JUnit/Testcontainers and Vitest/Testing Library/Playwright foundations |
| Infrastructure | Not implemented | PostgreSQL/PostGIS and Redis local services |
| Deployment | Not selected | No deployment automation in Phase 1 |
| Observability | Not implemented | Health endpoints and Prometheus registry foundation only |

## Environment audit

Initial inspection found Java 17.0.19, Node.js 24.18.0, npm 11.16.0, Git 2.55.0, no Maven, and no Docker. Java 25 and Docker Desktop were provisioned for implementation. Maven is intentionally supplied through the repository wrapper.

## Existing features

All product features were `NOT IMPLEMENTED` at the start of the audit. There was no code to keep, refactor, replace, or remove.

## Technical debt

There was no inherited code debt. The principal risks at foundation time are:

- allowing scaffold defaults to become architecture;
- committing local secrets;
- coupling tests to non-PostgreSQL behavior;
- designing visual components before the product design is supplied;
- adding distributed infrastructure before transactional workflows exist;
- making unmeasured performance or scale claims.

## Reuse plan

No reusable application component existed. The generated Spring Boot and Next.js foundations are retained only where they match the approved stack; placeholder product content is replaced with ATLAS-specific structural content.

## Destructive changes

None. The workspace contained only productless `work` and `outputs` directories. They are preserved and ignored by Git.
