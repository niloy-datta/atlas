package com.atlas.identity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.atlas.TestcontainersConfiguration;
import com.atlas.identity.CapturingMailConfiguration.CapturingPasswordRecoveryMailer;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwtValidationException;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@Import({TestcontainersConfiguration.class, CapturingMailConfiguration.class})
@SpringBootTest
@AutoConfigureMockMvc
class AuthenticationIntegrationTests {
    private static final String ORIGIN = "http://localhost:3000";
    private final MockMvc mvc;
    private final ObjectMapper json;
    private final JdbcTemplate jdbc;
    private final CapturingPasswordRecoveryMailer mailer;
    private final JwtEncoder jwtEncoder;
    private final JwtDecoder jwtDecoder;

    @Autowired
    AuthenticationIntegrationTests(MockMvc mvc, ObjectMapper json, JdbcTemplate jdbc,
                                   CapturingPasswordRecoveryMailer mailer, JwtEncoder jwtEncoder,
                                   JwtDecoder jwtDecoder) {
        this.mvc = mvc;
        this.json = json;
        this.jdbc = jdbc;
        this.mailer = mailer;
        this.jwtEncoder = jwtEncoder;
        this.jwtDecoder = jwtDecoder;
    }

    @Test
    void registrationLoginCurrentUserAndCookieSecurity() throws Exception {
        String email = unique("worker");
        MvcResult registration = register("worker", email, "Correct-Horse-42!")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.user.roles[0]").value("WORKER"))
                .andExpect(cookie().httpOnly("atlas_refresh", true))
                .andExpect(cookie().sameSite("atlas_refresh", "Lax"))
                .andExpect(cookie().httpOnly("atlas_csrf", false))
                .andReturn();

        Tokens tokens = tokens(registration);
        String storedPassword = jdbc.queryForObject(
                "SELECT password_hash FROM users WHERE email_normalized = ?", String.class, email);
        assertThat(storedPassword).startsWith("$argon2id$").doesNotContain("Correct-Horse-42!");
        Integer rawRefreshTokens = jdbc.queryForObject(
                "SELECT count(*) FROM refresh_tokens WHERE token_hash = ?", Integer.class,
                tokens.refreshCookie().getValue());
        assertThat(rawRefreshTokens).isZero();
        mvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer " + tokens.access()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email));

        mvc.perform(post("/api/v1/auth/refresh").cookie(tokens.refreshCookie()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("CSRF_REJECTED"));

        mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(credentials(email, "wrong-password-42")))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTHENTICATION_FAILED"));
    }

    @Test
    void refreshRotatesAndReuseRevokesEntireSession() throws Exception {
        String email = unique("rotation");
        Tokens original = tokens(register("worker", email, "Correct-Horse-42!").andReturn());

        MvcResult rotatedResult = refresh(original).andExpect(status().isOk()).andReturn();
        Tokens rotated = tokens(rotatedResult);
        assertThat(rotated.refreshCookie().getValue()).isNotEqualTo(original.refreshCookie().getValue());

        refresh(original).andExpect(status().isUnauthorized());
        refresh(rotated).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer " + rotated.access()))
                .andExpect(status().isUnauthorized());

        Integer reuseEvents = jdbc.queryForObject(
                "SELECT count(*) FROM audit_events WHERE event_type = 'REFRESH_TOKEN_REUSE'", Integer.class);
        assertThat(reuseEvents).isGreaterThanOrEqualTo(1);
    }

    @Test
    void passwordRecoveryDoesNotEnumerateUsersAndResetRevokesSessions() throws Exception {
        String email = unique("recovery");
        Tokens beforeReset = tokens(register("worker", email, "Correct-Horse-42!").andReturn());

        recover(email).andExpect(status().isAccepted());
        recover(unique("missing")).andExpect(status().isAccepted());
        String resetToken = mailer.messageFor(email).token();

        mvc.perform(post("/api/v1/auth/password-reset").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(new ResetBody(resetToken, "New-Correct-Horse-84!"))))
                .andExpect(status().isNoContent());

        mvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer " + beforeReset.access()))
                .andExpect(status().isUnauthorized());
        login(email, "Correct-Horse-42!").andExpect(status().isUnauthorized());
        login(email, "New-Correct-Horse-84!").andExpect(status().isOk());
        mvc.perform(post("/api/v1/auth/password-reset").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(new ResetBody(resetToken, "Another-Password-95!"))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void jwtRejectsWrongIssuerAudienceAndExpiredTokens() {
        Instant now = Instant.now();
        assertThatThrownBy(() -> jwtDecoder.decode(encoded("https://wrong.example", List.of("atlas-web"), now.plusSeconds(60))))
                .isInstanceOf(JwtValidationException.class);
        assertThatThrownBy(() -> jwtDecoder.decode(encoded("http://localhost:8080", List.of("wrong-audience"), now.plusSeconds(60))))
                .isInstanceOf(JwtValidationException.class);
        assertThatThrownBy(() -> jwtDecoder.decode(encoded("http://localhost:8080", List.of("atlas-web"), now.minusSeconds(60))))
                .isInstanceOf(JwtValidationException.class);
    }

    @Test
    void sessionListingAndRevocationAreOwnerScopedAndImmediate() throws Exception {
        String email = unique("sessions");
        Tokens tokens = tokens(register("employer", email, "Correct-Horse-42!")
                .andExpect(jsonPath("$.user.roles[0]").value("EMPLOYER_ADMIN")).andReturn());
        MvcResult list = mvc.perform(get("/api/v1/auth/sessions")
                        .header("Authorization", "Bearer " + tokens.access()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].current").value(true))
                .andReturn();
        UUID sessionId = UUID.fromString(json.readTree(list.getResponse().getContentAsString()).get(0).get("id").asText());

        mvc.perform(delete("/api/v1/auth/sessions/{id}", UUID.randomUUID())
                        .header("Authorization", "Bearer " + tokens.access()))
                .andExpect(status().isNotFound());
        mvc.perform(delete("/api/v1/auth/sessions/{id}", sessionId)
                        .header("Authorization", "Bearer " + tokens.access()))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer " + tokens.access()))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON));
    }

    @Test
    void duplicateRegistrationAndUntrustedOriginsAreRejected() throws Exception {
        String email = unique("duplicate");
        Tokens tokens = tokens(register("worker", email, "Correct-Horse-42!").andReturn());
        register("worker", email.toUpperCase(), "Another-Password-84!")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("EMAIL_ALREADY_REGISTERED"));
        mvc.perform(post("/api/v1/auth/refresh").header("Origin", "https://evil.example")
                        .header("X-CSRF-TOKEN", tokens.csrfCookie().getValue())
                        .cookie(tokens.refreshCookie(), tokens.csrfCookie()))
                .andExpect(status().isForbidden());
    }

    private org.springframework.test.web.servlet.ResultActions register(String kind, String email, String password) throws Exception {
        return mvc.perform(post("/api/v1/auth/register/" + kind).contentType(MediaType.APPLICATION_JSON)
                .content(credentials(email, password)));
    }

    private org.springframework.test.web.servlet.ResultActions login(String email, String password) throws Exception {
        return mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content(credentials(email, password)));
    }

    private org.springframework.test.web.servlet.ResultActions recover(String email) throws Exception {
        return mvc.perform(post("/api/v1/auth/password-recovery").contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(new RecoveryBody(email))));
    }

    private org.springframework.test.web.servlet.ResultActions refresh(Tokens tokens) throws Exception {
        return mvc.perform(post("/api/v1/auth/refresh").header("Origin", ORIGIN)
                .header("X-CSRF-TOKEN", tokens.csrfCookie().getValue())
                .cookie(tokens.refreshCookie(), tokens.csrfCookie()));
    }

    private Tokens tokens(MvcResult result) throws Exception {
        JsonNode body = json.readTree(result.getResponse().getContentAsString());
        Cookie refresh = result.getResponse().getCookie("atlas_refresh");
        Cookie csrf = result.getResponse().getCookie("atlas_csrf");
        return new Tokens(body.get("accessToken").asText(), refresh, csrf);
    }

    private String encoded(String issuer, List<String> audience, Instant expiry) {
        Instant now = Instant.now().truncatedTo(ChronoUnit.SECONDS);
        JwtClaimsSet claims = JwtClaimsSet.builder().issuer(issuer).audience(audience)
                .subject(UUID.randomUUID().toString()).issuedAt(now.minusSeconds(120)).expiresAt(expiry)
                .claim("roles", List.of("WORKER")).claim("sessionId", UUID.randomUUID().toString()).build();
        return jwtEncoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
    }

    private String credentials(String email, String password) throws Exception {
        return json.writeValueAsString(new CredentialsBody(email, password));
    }

    private static String unique(String prefix) { return prefix + '-' + UUID.randomUUID() + "@example.test"; }
    private record Tokens(String access, Cookie refreshCookie, Cookie csrfCookie) { }
    private record CredentialsBody(String email, String password) { }
    private record RecoveryBody(String email) { }
    private record ResetBody(String token, String newPassword) { }
}
