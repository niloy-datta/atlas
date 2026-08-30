# ATLAS Implementation Master Plan

## Goal

Build ATLAS as a production-oriented modular monolith that can demonstrate transactional correctness, resource authorization, geospatial discovery, deterministic matching, concurrency-safe capacity, idempotent APIs, reliable asynchronous projections, operational visibility, and evidence-based performance work.

The implementation must never claim customers, uptime, throughput, latency, or scale that has not been measured.

## Current system

The repository began as a greenfield workspace. Phase 1 establishes a Java 25/Spring Boot 4.1 backend, Next.js frontend, PostgreSQL/PostGIS, Redis, migrations, tests, documentation, and repeatable verification. Authentication and product data deliberately remain outside Phase 1.

## Target architecture

The backend is one deployable modular monolith organized by feature: identity, worker, organization, skill, credential, job, shift, availability, application, matching, reservation, workforce, workledger, trust, notification, search, audit, outbox, and shared infrastructure.

PostgreSQL/PostGIS owns transactional truth. Redis is expendable optimization. Kafka receives events only through the Transactional Outbox. OpenSearch holds rebuildable public search projections. Consumers assume at-least-once delivery and deduplicate by consumer and event ID.

## Implementation phases

| Phase | Delivery | Acceptance evidence |
|---:|---|---|
| 0 | Repository and environment audit | Current-state report, toolchain check, planned changes |
| 1 | Backend, frontend, Compose, migration, health, tests | Clean builds, PostGIS migration, healthy services |
| 2 | Accounts, JWT access, opaque rotating refresh tokens | Authentication and session security tests |
| 3 | Worker profile and public/private WorkPass | Privacy allow-list and completion-engine tests |
| 4 | Organizations, membership, verification | Cross-tenant denial and privilege tests |
| 5 | Skill catalogue and SkillProof | Transition, evidence, uniqueness tests |
| 6 | Credentials and object storage | Upload, authorization, signature, sharing tests |
| 7 | Jobs, shifts, applications, invitations, workforce pools | Lifecycle and tenancy tests |
| 8 | PostGIS nearby discovery | GiST query plans and spatial correctness tests |
| 9 | Recurring availability and overrides | Timezone and DST test matrix |
| 10 | Deterministic MatchEngine V1 | Explainable, stable, reproducible rankings |
| 11 | Capacity-safe reservations | Repeated high-contention PostgreSQL tests |
| 12 | Reusable idempotency | Sequential and concurrent retry tests |
| 13 | Transactional Outbox | Atomic mutation/event and recovery tests |
| 14 | Kafka and idempotent consumers | Redelivery, ordering, poison-message tests |
| 15 | Append-only WorkLedger and worker metrics | Deduplication and projection rebuild proof |
| 16 | Versioned TrustScore V1 | Boundary, fairness, cold-start, version tests |
| 17 | Redis cache and rate limiting | Failure degradation and invalidation tests |
| 18 | OpenSearch projections and aliases | Reindex, stale-data, outage, privacy tests |
| 19 | In-app notifications and SSE | Deduplication and reconnect tests |
| 20 | Frontend product integration | Supplied-design mapping and accessibility tests |
| 21 | Logs, traces, metrics, dashboards, SLO targets | Traceable redacted E2E workflow |
| 22 | k6 load profiles and optimization | Reproducible saved benchmark evidence |
| 23 | Security hardening | Threat review and resolved critical findings |
| 24 | Failure and recovery exercises | Observed recovery evidence and runbooks |
| 25 | CI/CD and OCI artifacts | Reproducible clean-checkout pipeline |
| 26 | ADR, scaling, architecture, operations docs | Documentation/implementation consistency |
| 27 | Interview and portfolio evidence | Every claim maps to code, test, or benchmark |
| 28 | Final production audit | Complete critical E2E acceptance journey |

## Database evolution

Schema arrives with the phase that owns the behavior. Migrations are append-only. UUIDs identify entities, `timestamptz` stores canonical time, money uses `numeric(19,4)` plus ISO currency, and employer-owned records carry `organization_id`.

Critical invariants use foreign keys, check constraints, unique constraints, partial indexes, and transactional updates. PostGIS locations use `geography(Point,4326)` with GiST indexes. Event payloads use JSONB only where versioned event data requires it; ordinary domain fields remain relational.

## Security risks and controls

- IDOR and tenant leakage: central organization access policy, scoped repository queries, and cross-tenant integration tests.
- Token theft: short-lived signed access tokens, hashed rotating refresh tokens, family reuse detection, secure cookies, and session revocation.
- Sensitive WorkPass leakage: separate public DTO allow-list and output contract tests.
- Credential exposure: S3-compatible opaque keys, short signed URLs, content validation, sharing grants, and audit events.
- Admin escalation: explicit platform roles, resource authorization, audit trails, and negative security tests.
- Secret/PII leakage: environment-only secrets, structured-log redaction, safe traces, and repository secret scanning.

## Performance risks and evidence policy

Likely pressure points are nearby queries, text search, matching fan-out, WorkLedger aggregation, high-contention reservations, connection pools, cache stampedes, outbox backlog, and consumer lag. Each optimization requires a baseline, diagnosed bottleneck, controlled change, and repeated measurement. Large datasets do not run in routine CI.

## Migration strategy

This is greenfield, so no legacy data migration exists. Future schema changes use forward-only Flyway migrations with recovery notes for destructive or long-running operations. Search, cache, and metrics projections must be rebuildable from PostgreSQL and WorkLedger sources.

## Architectural complexity

- High: authentication/session security, tenant isolation, reservations, idempotency, outbox/Kafka delivery, WorkLedger, credential access.
- Medium: geospatial queries, availability/timezones, deterministic matching, TrustScore, search synchronization, observability.
- Lower but still gated: structural frontend foundation, documentation, local Compose, notification read models.

Microservices, Kubernetes deployment, multi-region ownership, payroll, opaque ML ranking, and irreversible AI employment decisions are outside v1.

