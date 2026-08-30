# ATLAS

Verified Workforce Infrastructure

**Verified workers. Trusted employers. Real work.**

ATLAS is a production-oriented workforce platform for portable verified worker identities, trustworthy employers, nearby work discovery, deterministic matching, and concurrency-safe shift reservation.

## Current status

Phases 0–6 establish the repository, platform foundation, identity boundary, private/public WorkPass, tenant-isolated organizations, SkillProof, and secure credentials. Credential metadata, verification history, temporary upload/download authorization, private sharing grants, file-signature checks, and storage-backed document isolation are implemented without exposing permanent object URLs.

The frontend is intentionally a neutral structural shell. Final UI implementation will follow the design supplied by the product owner.

## Stack

- Java 25 and Spring Boot 4.1.1
- Maven Wrapper
- PostgreSQL 18 with PostGIS 3.6
- Redis 8.2
- Mailpit 1.27.8 for local SMTP capture
- MinIO for local S3-compatible credential storage
- Next.js 16.3, React 19.2, and strict TypeScript
- Docker Compose
- JUnit, Testcontainers, Vitest, Testing Library, and Playwright

## Prerequisites

- Java 25
- Node.js 24+
- Docker Desktop with Docker Compose
- Git

Run `pwsh ./scripts/check-environment.ps1` to validate the machine.

## Local setup

1. Copy `.env.example` to `.env` and keep it uncommitted.
2. Start infrastructure with `docker compose up -d --wait`.
3. Start the backend with `cd backend` then `./mvnw spring-boot:run` (`.\\mvnw.cmd` on Windows).
4. Start the frontend with `cd frontend`, `npm ci`, then `npm run dev`.
5. Open `http://localhost:3000`; verify `http://localhost:8080/api/v1/system/info`, generated contracts at `http://localhost:8080/api-docs`, local mail at `http://localhost:8025`, and MinIO administration at `http://localhost:9001`.

## Verification

Run `pwsh ./scripts/verify.ps1` from the repository root. The script validates Compose, runs backend tests, then runs frontend lint, type checking, unit tests, and a production build.

## Documentation

- [Current state](docs/implementation/current-state.md)
- [Master plan](docs/implementation/master-plan.md)
- [Architecture decision index](docs/adr/README.md)
- [Phase 1 completion report](docs/implementation/phase-01-completion.md)
- [Phase 2 completion report](docs/implementation/phase-02-completion.md)
- [Phase 3 completion report](docs/implementation/phase-03-completion.md)
- [Phase 4 completion report](docs/implementation/phase-04-completion.md)
- [Phase 5 completion report](docs/implementation/phase-05-completion.md)
- [Phase 6 completion report](docs/implementation/phase-06-completion.md)

No throughput, availability, latency, user-count, or scale claim is made without saved benchmark evidence.
