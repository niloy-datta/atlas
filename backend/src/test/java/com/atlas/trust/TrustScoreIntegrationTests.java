package com.atlas.trust;

import static org.assertj.core.api.Assertions.assertThat;

import com.atlas.TestcontainersConfiguration;
import com.atlas.trust.application.TrustScoreService;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
class TrustScoreIntegrationTests {
    private final TrustScoreService trust;
    private final JdbcTemplate jdbc;

    @Autowired
    TrustScoreIntegrationTests(TrustScoreService trust, JdbcTemplate jdbc) {
        this.trust = trust;
        this.jdbc = jdbc;
    }

    @Test
    void calculationPersistsVersionedAuditableSnapshot() {
        UUID workerId = createWorker(80);

        var view = trust.calculate(workerId);

        assertThat(view.algorithmVersion()).isEqualTo("TRUST_V1");
        assertThat(view.score()).isBetween(0, 100);
        assertThat(view.profileCompletion()).isEqualTo(80);

        Integer snapshots = jdbc.queryForObject("""
                SELECT count(*) FROM worker_trust_score_snapshots
                 WHERE worker_user_id = ? AND algorithm_version = 'TRUST_V1'
                """, Integer.class, workerId);
        assertThat(snapshots).isEqualTo(1);
    }

    private UUID createWorker(int completion) {
        UUID userId = UUID.randomUUID();
        UUID profileId = UUID.randomUUID();
        String email = "trust-" + UUID.randomUUID() + "@example.test";

        jdbc.update("""
                INSERT INTO users
                    (id, email_normalized, email_display, password_hash, enabled,
                     firebase_uid, created_at, updated_at)
                VALUES (?, ?, ?, NULL, true, ?, now(), now())
                """, userId, email, email, "trust-" + UUID.randomUUID());

        jdbc.update("""
                INSERT INTO worker_profiles
                    (id, user_id, public_handle, full_name, headline, bio, experience_years,
                     visibility, completion_score, completion_version, version, created_at, updated_at)
                VALUES (?, ?, ?, 'Trust Worker', 'Worker', 'Trust test', 2,
                        'PRIVATE', ?, 1, 0, now(), now())
                """, profileId, userId, "trust-" + profileId.toString().substring(0, 8), completion);

        return userId;
    }
}
