# Contributing to ATLAS

## Working agreement

- Preserve package-by-feature boundaries.
- Controllers validate transport input and call application services; they do not use repositories directly.
- Do not expose persistence entities from APIs.
- Add a new Flyway migration instead of editing an applied migration.
- Protect critical invariants with database constraints and transactional tests.
- Treat PostgreSQL as truth; Redis and OpenSearch are derived infrastructure.
- Never commit secrets or sensitive demo identities.
- Never publish a performance claim without a reproducible benchmark report.

## Before opening a change

Run `pwsh ./scripts/verify.ps1` and review `git diff` for generated files, secrets, and unrelated changes.

