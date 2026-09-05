# ATLAS / SkillHub

Verified Workforce Infrastructure & Flexible Shift Platform

**SkillHub**: User-facing application for physical services, shifts, and verified worker identities.  
**ATLAS**: Underlying domain authority, tenant isolation, matching engine, and workforce platform infrastructure.

**Verified workers. Trusted employers. Real work.**

---

## Architecture & Status

Phases 0–6 establish the repository, platform foundation, identity boundary, private/public WorkPass, tenant-isolated organizations, SkillProof, and secure credentials.
- **Identity Provider**: Firebase Authentication handles user credentials, Google OAuth, password reset, and short-lived ID tokens.
- **Domain Authority**: ATLAS (Spring Boot + PostgreSQL) cryptographically verifies Firebase ID tokens, maps Firebase UIDs to internal Atlas UUIDs, and enforces business authorization, tenant isolation, and role policies.
- **Credential Storage**: MinIO / S3-compatible storage with short-lived signed URLs and file signature checks.
- **Frontend**: Next.js App Router, React 19, Tailwind CSS, and strict TypeScript.

## Stack

- Java 21 LTS and Spring Boot 4.1.1
- Maven Wrapper
- PostgreSQL 18 with PostGIS 3.6
- Redis 8.2
- MinIO for local S3-compatible credential storage
- Firebase Client SDK (Web v12) and Firebase Admin SDK (Java v9)
- Next.js 16.3, React 19.2, and strict TypeScript
- Docker Compose
- JUnit 5, Testcontainers, Vitest, Testing Library, and Playwright

## Prerequisites

- Java 21 LTS
- Node.js 24+
- Docker Desktop with Docker Compose
- Git

Run `pwsh ./scripts/check-environment.ps1` to validate the machine.

## Local Setup

1. Copy `.env.example` to `.env` and configure local development variables.
2. Start infrastructure with `docker compose up -d --wait`.
3. Start the backend with `cd backend` then `./mvnw spring-boot:run` (`.\\mvnw.cmd` on Windows).
4. Start the frontend with `cd frontend`, `npm ci`, then `npm run dev`.
5. Open `http://localhost:3000` (SkillHub); verify `http://localhost:8080/api/v1/system/info`, generated contracts at `http://localhost:8080/api-docs`, and MinIO administration at `http://localhost:9001`.

## Verification

Run `pwsh ./scripts/verify.ps1` from the repository root. The script validates Compose, runs backend tests, then runs frontend lint, type checking, unit tests, and a production build.

## Documentation

- [Current state](docs/implementation/current-state.md)
- [Master plan](docs/implementation/master-plan.md)
- [Architecture decision index](docs/adr/README.md)
- [ADR 007: Firebase Authentication Strategy](docs/adr/007-firebase-authentication-strategy.md)
- [API Documentation](docs/api/README.md)

No throughput, availability, latency, user-count, or scale claim is made without saved benchmark evidence.
