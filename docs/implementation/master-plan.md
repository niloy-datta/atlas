# ATLAS / SkillHub Implementation Master Plan

## Goal

Build ATLAS as a production-oriented modular monolith powering the SkillHub workforce application. The system provides verifiable transactional correctness, fine-grained resource authorization, PostGIS geospatial discovery, deterministic and explainable matching, concurrency-safe capacity management, idempotent write APIs, reliable asynchronous projections, operational visibility, and evidence-based performance engineering.

The implementation never claims customers, uptime, throughput, latency, or scale that has not been measured.

## Naming & Brand Architecture

- **SkillHub**: The user-facing application for physical services, shifts, and verified worker identities.
- **ATLAS**: The underlying domain authority, tenant isolation, matching engine, and workforce platform infrastructure.

## Current system

The system uses a Java 21 LTS / Spring Boot 4.1 backend, Next.js 16 frontend, PostgreSQL 18 / PostGIS 3.6, Redis, forward-only Flyway migrations, automated tests, documentation, and reproducible verification.

Authentication delegates identity and credential management to **Firebase Authentication** (ADR 007), while ATLAS remains the sole authority for business permissions, PostgreSQL tenant isolation, and domain workflows.

## Target architecture

The backend is one deployable modular monolith organized by feature: `identity`, `worker`, `organization`, `skill`, `credential`, `job`, `shift`, `availability`, `application`, `matching`, `reservation`, `workforce`, `workledger`, `trust`, `notification`, `outbox`, and `shared` infrastructure.

PostgreSQL/PostGIS owns transactional truth. Redis is an expendable optimization. Kafka receives events only through the Transactional Outbox. OpenSearch holds rebuildable public search projections. Consumers assume at-least-once delivery and deduplicate by consumer and event ID.

## Implementation phases

| Phase | Delivery | Acceptance evidence |
|---:|---|---|
| 0 | Repository and environment audit | Current-state report, toolchain check, planned changes |
| 1 | Backend, frontend, Compose, migration, health, tests | Clean builds, PostGIS migration, healthy services |
| 2 | Accounts, Firebase Authentication, Admin SDK verification | ADR 007 accepted, side-effect-free auth filter, bootstrap tests |
| 3 | Worker profile and public/private WorkPass | Privacy allow-list and completion-engine tests |
| 4 | Organizations, membership, verification | Cross-tenant denial and privilege tests |
| 5 | Skill catalogue and SkillProof | Transition, evidence, uniqueness tests |
| 6 | Credentials and object storage | Upload, authorization, signature, sharing tests |
| 7 | Jobs domain & lifecycle state machine | Lifecycle validation and tenant-isolated tests |
| 8 | Shifts domain & capacity management | Timezone-aware intervals, rate validation, tests |
| 9 | Applications and Invitations | State machine, non-duplicate application tests |
| 10 | Workforce Pools | Rebookable worker pools, membership tests |
| 11 | Recurring Availability & Overrides | DST and timezone matrix tests |
| 12 | PostGIS Nearby Discovery | Real geospatial queries, GiST indexing, distance ranking |
| 13 | Deterministic MatchEngine V1 | Explainable score weights, reproducible ranking tests |
| 14 | Concurrency-Safe Reservations | High-contention PostgreSQL tests (0 overbooking guarantee) |
| 15 | Reusable Idempotency | Sequential and concurrent retry idempotency tests |
| 16 | Complete Frontend Product Flows | Real onboarding, dashboards, jobs, shifts, applications UI |
| 17 | Append-Only WorkLedger | Historical event tracking and derived projection tests |
| 18 | Versioned TrustScore V1 | Non-discriminatory bounded score and cold-start tests |
| 19 | Transactional Outbox | Atomic mutation/event insertion and recovery tests |
| 20 | Kafka & Idempotent Consumers | Redelivery, ordering, poison-message tests |
| 21 | In-App Notifications & SSE | Real-time events, reconnect, and deduplication tests |
| 22 | Redis Optimization | Cache invalidation and outage degradation tests |
| 23 | OpenSearch Projections | Reindex, stale-data, and privacy projection tests |
| 24 | Production Malware Scanning | Fail-closed quarantine and scan telemetry tests |
| 25 | Observability & OpenTelemetry | Redacted structured logs, trace IDs, Prometheus metrics |
| 26 | Performance Benchmarks (k6) | Reproducible saved benchmark evidence under load |
| 27 | Security Hardening | SAST, secret scan, threat review, penetration tests |
| 28 | Failure & Recovery Scenarios | Database restart, cache drop, consumer crash runbooks |
| 29 | CI/CD Pipeline | Clean-checkout GitHub Actions gate and OCI container build |
| 30 | Final Production Audit | End-to-end critical journey verification |

## Database evolution

Schema arrives with the phase that owns the behavior. Migrations are append-only. UUIDs identify entities, `timestamptz` stores canonical time, money uses `numeric(19,4)` plus ISO currency, and employer-owned records carry `organization_id`.

Critical invariants use foreign keys, check constraints, unique constraints, partial indexes, and transactional updates. PostGIS locations use `geography(Point,4326)` with GiST indexes. Event payloads use JSONB only where versioned event data requires it; ordinary domain fields remain relational.

## Security risks and controls

- **IDOR and tenant leakage**: Central organization access policy, scoped repository queries, and cross-tenant integration tests.
- **Identity & Authentication**: Firebase Authentication for credential security; Firebase ID token cryptographic verification on backend; zero automatic account linking without proof.
- **Sensitive WorkPass leakage**: Separate public DTO allow-list and output contract tests.
- **Credential exposure**: S3-compatible opaque keys, short signed URLs, content validation, sharing grants, and audit events.
- **Admin escalation**: Explicit platform roles, resource authorization, audit trails, and negative security tests.
- **Secret/PII leakage**: Environment-only secrets, structured-log redaction, safe traces, and repository secret scanning.

## Performance risks and evidence policy

Likely pressure points are nearby queries, text search, matching fan-out, WorkLedger aggregation, high-contention reservations, connection pools, cache stampedes, outbox backlog, and consumer lag. Each optimization requires a baseline, diagnosed bottleneck, controlled change, and repeated measurement. Large datasets do not run in routine CI.
