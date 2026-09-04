package com.atlas.identity.audit;

import java.time.Clock;
import java.time.Instant;
import java.sql.Timestamp;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SecurityAuditService {
    private final JdbcTemplate jdbc;
    private final Clock clock;

    public SecurityAuditService(JdbcTemplate jdbc, Clock clock) {
        this.jdbc = jdbc;
        this.clock = clock;
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void record(UUID actorId, String eventType, String outcome, UUID subjectId,
                       String ipAddress, String userAgent) {
        jdbc.update("""
                INSERT INTO audit_events
                    (id, actor_user_id, event_type, outcome, subject_id, ip_address, user_agent, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, UUID.randomUUID(), actorId, eventType, outcome, subjectId,
                truncate(ipAddress, 64), truncate(userAgent, 512), Timestamp.from(Instant.now(clock)));
    }

    private static String truncate(String value, int maximum) {
        if (value == null || value.length() <= maximum) return value;
        return value.substring(0, maximum);
    }
}
