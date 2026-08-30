# ATLAS Backend

Java 25 and Spring Boot 4.1 modular monolith with the ATLAS identity and session-security boundary.

## Run

Start PostgreSQL/PostGIS, Redis, and Mailpit from the repository root, then run `.\\mvnw.cmd spring-boot:run` on Windows or `./mvnw spring-boot:run` elsewhere.

The safe public foundation endpoints are:

- `GET /api/v1/system/info`
- `GET /actuator/health/liveness`
- `GET /actuator/health/readiness`
- `GET /api-docs`

Authentication routes are documented in `docs/api/README.md`. All unspecified routes are denied.

## Test

Run `.\\mvnw.cmd clean verify`. Integration tests use pinned PostGIS and Redis Testcontainers images and require Docker.
