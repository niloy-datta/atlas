# Phase 0–1 Completion Report

Date: 2026-08-30

## Implemented

- Initialized a new Git repository on `main`.
- Installed Eclipse Temurin Java 25 and Docker Desktop.
- Created the Spring Boot 4.1.1 backend with Java 25 and Maven Wrapper.
- Created the Next.js 16.3.3/React 19.2.8 frontend with strict TypeScript.
- Added PostgreSQL 18/PostGIS 3.6 and Redis 8.2.9 local services with persistent named volumes and health checks.
- Added Flyway foundation migration, PostGIS validation, safe public system metadata, liveness/readiness endpoints, and default-deny route security.
- Added backend integration, migration, endpoint authorization, and unit tests.
- Added frontend lint, typecheck, Vitest, Testing Library, production build, and Playwright foundations.
- Added environment and full-repository verification scripts.
- Added the current-state audit, master roadmap, ADR index, infrastructure placeholders, and contributor guidance.
- Kept the frontend to a neutral semantic shell because final UI design will be provided separately.

## Files Changed

Important implementation surfaces:

- Root repository configuration, Compose file, documentation, and verification scripts.
- `backend/pom.xml`, runtime configuration, security configuration, system controller, error foundation, migration, and tests.
- `frontend/package.json`, application shell, environment configuration, Vitest/Playwright configuration, and tests.

## Database

- Added `V1__foundation.sql`.
- Enabled PostGIS idempotently.
- Added singleton `atlas_schema_metadata` with schema version and UTC installation timestamp.
- Validated migration against an empty PostgreSQL 18/PostGIS Testcontainer and the local Compose database.
- Corrected the PostgreSQL 18 volume mount from the legacy `/var/lib/postgresql/data` path to `/var/lib/postgresql`.

The first failed Compose attempt created only empty ATLAS-owned development volumes. Those exact volumes were removed and recreated after correcting the PostgreSQL 18 mount; no user data existed or was lost.

## Tests

- Backend: 5 passed, 0 failed, 0 skipped.
- Backend tests prove application startup, PostGIS availability, schema metadata, public system/health access, and denial of the Prometheus endpoint.
- Frontend unit: 1 passed.
- Frontend E2E: 1 passed in Chromium.
- Frontend lint: passed.
- Frontend strict typecheck: passed.
- Frontend production build: passed.

## Commands Run

- Environment and Git inspection commands.
- `winget install EclipseAdoptium.Temurin.25.JDK`.
- `winget install Docker.DockerDesktop`.
- Spring Initializr generation for Spring Boot 4.1.1.
- `npx create-next-app@16.3.3`.
- `docker compose config --quiet`.
- `docker compose up -d --wait`.
- `.\\mvnw.cmd clean verify` and `.\\mvnw.cmd verify`.
- `npm run lint`.
- `npm run typecheck`.
- `npm test`.
- `npm run build`.
- `npm run test:e2e`.
- `pwsh -NoProfile -File .\\scripts\\check-environment.ps1`.
- `pwsh -NoProfile -File .\\scripts\\verify.ps1`.

## Results

- Java 25.0.4.1 detected.
- Docker 29.7.2 and Compose 5.4.0 detected.
- PostgreSQL/PostGIS and Redis containers are healthy.
- Live API returned `UP` for system metadata, liveness, and readiness.
- Live unauthenticated Prometheus request returned HTTP 403.
- The final root verification command passed.

Initial failures were investigated and corrected:

- Spring Initializr emitted `4.1.1.RELEASE`, while Maven Central publishes the parent as `4.1.1`.
- Vitest initially discovered Playwright specifications; unit and E2E discovery are now separated.
- PostgreSQL 18 rejected the legacy volume mount; the mount now follows the PostgreSQL 18 layout.
- The first root clean was blocked by the deliberately running verification JAR; the runtime was stopped gracefully before the clean rerun.

## Security Review

- Only system metadata and safe health endpoints are publicly accessible.
- Prometheus and all unspecified routes are denied.
- Spring's generated development user has been disabled pending the real Phase 2 identity implementation.
- Stack traces and application exception messages are excluded from HTTP responses.
- Validation uses Problem Details with stable error codes and trace correlation support.
- `.env` files, build output, test reports, and dependency directories are ignored.
- No production credential or deployment secret was created.

## Known Limitations

- Product authentication, workers, organizations, jobs, and all later domains are intentionally not implemented.
- OpenAPI generation begins with the first product API contracts.
- Prometheus is present as a registry but monitoring access and authentication are deferred to the observability phase.
- No final visual design has been implemented.
- Local Compose uses development-only fallback credentials; production secret management is not selected.
- Docker Desktop must be running for backend integration tests.
- The JDK currently emits a Mockito dynamic-agent warning during tests; the tests pass, and explicit agent configuration should be added before the JDK disables dynamic attachment by default.

## Next Phase

Phase 2: implement secure accounts, role assignment, JWT access tokens, hashed rotating refresh tokens, session revocation, password recovery, rate limiting, and authentication security tests. Do not start Phase 2 without explicit authorization.

