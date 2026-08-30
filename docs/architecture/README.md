# Architecture documentation

ATLAS begins as one deployable Spring Boot modular monolith. PostgreSQL/PostGIS is authoritative; Redis and OpenSearch are derived; Kafka delivery is at least once and originates through a Transactional Outbox.

