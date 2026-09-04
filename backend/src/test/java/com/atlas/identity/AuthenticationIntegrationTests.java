package com.atlas.identity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.atlas.TestcontainersConfiguration;
import tools.jackson.databind.ObjectMapper;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
class AuthenticationIntegrationTests {

    private final MockMvc mvc;
    private final ObjectMapper json;
    private final JdbcTemplate jdbc;

    @Autowired
    AuthenticationIntegrationTests(MockMvc mvc, ObjectMapper json, JdbcTemplate jdbc) {
        this.mvc = mvc;
        this.json = json;
        this.jdbc = jdbc;
    }

    @Test
    void unauthenticatedRequestsAreRejected() throws Exception {
        mvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTHENTICATION_REQUIRED"));

        mvc.perform(post("/api/v1/auth/bootstrap")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"accountType\":\"worker\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTHENTICATION_REQUIRED"));
    }

    @Test
    void malformedAndInvalidTokensAreRejected() throws Exception {
        mvc.perform(get("/api/v1/auth/me").header("Authorization", "Basic 12345"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("MALFORMED_AUTHORIZATION_HEADER"));

        mvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer "))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("MISSING_BEARER_TOKEN"));

        mvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer invalid-token"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_FIREBASE_TOKEN"));

        mvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer expired-token"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("FIREBASE_TOKEN_EXPIRED"));

        mvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer revoked-token"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("FIREBASE_TOKEN_REVOKED"));
    }

    @Test
    void unprovisionedUserAccessingMeReturnsUnauthorized() throws Exception {
        String uid = "unprovisioned-" + UUID.randomUUID();
        mvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer mock:" + uid))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
    }

    @Test
    void bootstrapProvisionsWorkerAndReturnsCreated() throws Exception {
        String uid = "worker-" + UUID.randomUUID();
        String email = uid + "@example.test";

        bootstrap(uid, email, "worker")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.created").value(true))
                .andExpect(jsonPath("$.user.email").value(email))
                .andExpect(jsonPath("$.user.roles[0]").value("WORKER"));

        // Verify currentUser endpoint returns user details
        mvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer mock:" + uid + ":" + email))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.roles[0]").value("WORKER"));

        // Verify DB persistence
        String dbUid = jdbc.queryForObject(
                "SELECT firebase_uid FROM users WHERE email_normalized = ?", String.class, email.toLowerCase());
        assertThat(dbUid).isEqualTo(uid);
    }

    @Test
    void bootstrapProvisionsEmployerAndReturnsCreated() throws Exception {
        String uid = "employer-" + UUID.randomUUID();
        String email = uid + "@example.test";

        bootstrap(uid, email, "employer")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.created").value(true))
                .andExpect(jsonPath("$.user.email").value(email))
                .andExpect(jsonPath("$.user.roles[0]").value("EMPLOYER_ADMIN"));
    }

    @Test
    void bootstrapIsIdempotentForSameFirebaseUid() throws Exception {
        String uid = "idempotent-" + UUID.randomUUID();
        String email = uid + "@example.test";

        bootstrap(uid, email, "worker")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.created").value(true));

        // Subsequent bootstrap with same UID returns 200 OK and created=false
        bootstrap(uid, email, "worker")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.created").value(false))
                .andExpect(jsonPath("$.user.email").value(email));
    }

    @Test
    void bootstrapRejectsConflictingEmailUnderDifferentUid() throws Exception {
        String email = "conflict-" + UUID.randomUUID() + "@example.test";
        String uid1 = "user-1-" + UUID.randomUUID();
        String uid2 = "user-2-" + UUID.randomUUID();

        bootstrap(uid1, email, "worker").andExpect(status().isCreated());

        // Attempting to bootstrap with different UID but same email must be rejected with 409
        bootstrap(uid2, email, "worker")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("EMAIL_ALREADY_REGISTERED"));
    }

    @Test
    void bootstrapRejectsInvalidAccountType() throws Exception {
        String uid = "invalid-role-" + UUID.randomUUID();
        String email = uid + "@example.test";

        bootstrap(uid, email, "hacker")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_ACCOUNT_TYPE"));
    }

    @Test
    void disabledUserAccountIsForbidden() throws Exception {
        String uid = "disabled-" + UUID.randomUUID();
        String email = uid + "@example.test";

        bootstrap(uid, email, "worker").andExpect(status().isCreated());

        // Disable user in database
        jdbc.update("UPDATE users SET enabled = false WHERE firebase_uid = ?", uid);

        // Subsequent authenticated requests are rejected with 403 Forbidden
        mvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer mock:" + uid + ":" + email))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("ACCOUNT_DISABLED"));
    }

    private ResultActions bootstrap(String uid, String email, String accountType) throws Exception {
        return mvc.perform(post("/api/v1/auth/bootstrap")
                .header("Authorization", "Bearer mock:" + uid + ":" + email)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"accountType\":\"" + accountType + "\"}"));
    }
}
