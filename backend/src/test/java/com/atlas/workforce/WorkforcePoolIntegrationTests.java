package com.atlas.workforce;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.atlas.TestcontainersConfiguration;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
class WorkforcePoolIntegrationTests {
    private final MockMvc mvc;
    private final ObjectMapper json;
    private final JdbcTemplate jdbc;

    @Autowired
    WorkforcePoolIntegrationTests(MockMvc mvc, ObjectMapper json, JdbcTemplate jdbc) {
        this.mvc = mvc;
        this.json = json;
        this.jdbc = jdbc;
    }

    @Test
    void ownerCanCreateUpdateAndManageReusableWorkerPool() throws Exception {
        Auth owner = bootstrap(unique("owner"), "employer");
        UUID organizationId = createOrganization(owner, "Reliable Staffing");
        Auth worker = bootstrap(unique("worker"), "worker");
        createWorkerProfile(worker, "Reliable Worker");

        MvcResult created = mvc.perform(post("/api/v1/organizations/{orgId}/workforce-pools", organizationId)
                        .header("Authorization", owner.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "name", "Trusted Weekend Crew",
                                "description", "Workers we can rebook for weekend shifts"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Trusted Weekend Crew"))
                .andExpect(jsonPath("$.version").value(0))
                .andReturn();

        UUID poolId = UUID.fromString(json.readTree(created.getResponse().getContentAsString()).get("id").asText());

        mvc.perform(post("/api/v1/organizations/{orgId}/workforce-pools/{poolId}/members", organizationId, poolId)
                        .header("Authorization", owner.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "workerId", worker.id(),
                                "note", "Strong attendance on prior shift"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.workerUserId").value(worker.id().toString()))
                .andExpect(jsonPath("$.fullName").value("Reliable Worker"));

        mvc.perform(get("/api/v1/organizations/{orgId}/workforce-pools/{poolId}/members", organizationId, poolId)
                        .header("Authorization", owner.bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].workerUserId").value(worker.id().toString()));

        mvc.perform(post("/api/v1/organizations/{orgId}/workforce-pools/{poolId}/members", organizationId, poolId)
                        .header("Authorization", owner.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("workerId", worker.id()))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("WORKFORCE_POOL_MEMBER_CONFLICT"));

        mvc.perform(put("/api/v1/organizations/{orgId}/workforce-pools/{poolId}", organizationId, poolId)
                        .header("Authorization", owner.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "version", 0,
                                "name", "Priority Weekend Crew",
                                "description", "Preferred workers for repeat bookings"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Priority Weekend Crew"))
                .andExpect(jsonPath("$.version").value(1));

        mvc.perform(delete("/api/v1/organizations/{orgId}/workforce-pools/{poolId}/members/{workerId}",
                        organizationId, poolId, worker.id()).header("Authorization", owner.bearer()))
                .andExpect(status().isNoContent());

        mvc.perform(get("/api/v1/organizations/{orgId}/workforce-pools/{poolId}/members", organizationId, poolId)
                        .header("Authorization", owner.bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());

        mvc.perform(delete("/api/v1/organizations/{orgId}/workforce-pools/{poolId}", organizationId, poolId)
                        .header("Authorization", owner.bearer()))
                .andExpect(status().isNoContent());

        assertThat(jdbc.queryForObject("SELECT count(*) FROM workforce_pools WHERE id = ?",
                Integer.class, poolId)).isZero();
    }

    @Test
    void poolsAreTenantIsolatedAndNamesAreUniquePerOrganization() throws Exception {
        Auth ownerA = bootstrap(unique("owner-a"), "employer");
        Auth ownerB = bootstrap(unique("owner-b"), "employer");
        UUID organizationA = createOrganization(ownerA, "Organization A");
        UUID organizationB = createOrganization(ownerB, "Organization B");

        UUID poolA = createPool(ownerA, organizationA, "Repeat Crew");

        mvc.perform(get("/api/v1/organizations/{orgId}/workforce-pools/{poolId}", organizationA, poolA)
                        .header("Authorization", ownerB.bearer()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("ORGANIZATION_NOT_FOUND"));

        mvc.perform(post("/api/v1/organizations/{orgId}/workforce-pools", organizationA)
                        .header("Authorization", ownerA.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("name", "Repeat Crew"))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("WORKFORCE_POOL_NAME_CONFLICT"));

        mvc.perform(post("/api/v1/organizations/{orgId}/workforce-pools", organizationB)
                        .header("Authorization", ownerB.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("name", "Repeat Crew"))))
                .andExpect(status().isCreated());
    }

    @Test
    void stalePoolUpdateIsRejected() throws Exception {
        Auth owner = bootstrap(unique("owner"), "employer");
        UUID organizationId = createOrganization(owner, "Versioned Workforce");
        UUID poolId = createPool(owner, organizationId, "Core Crew");

        mvc.perform(put("/api/v1/organizations/{orgId}/workforce-pools/{poolId}", organizationId, poolId)
                        .header("Authorization", owner.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "version", 0,
                                "name", "Core Crew Updated"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.version").value(1));

        mvc.perform(put("/api/v1/organizations/{orgId}/workforce-pools/{poolId}", organizationId, poolId)
                        .header("Authorization", owner.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "version", 0,
                                "name", "Stale Update"))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("WORKFORCE_POOL_VERSION_CONFLICT"));
    }

    private UUID createPool(Auth owner, UUID organizationId, String name) throws Exception {
        MvcResult result = mvc.perform(post("/api/v1/organizations/{orgId}/workforce-pools", organizationId)
                        .header("Authorization", owner.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("name", name))))
                .andExpect(status().isCreated())
                .andReturn();
        return UUID.fromString(json.readTree(result.getResponse().getContentAsString()).get("id").asText());
    }

    private UUID createOrganization(Auth auth, String name) throws Exception {
        MvcResult result = mvc.perform(post("/api/v1/organizations")
                        .header("Authorization", auth.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "name", name,
                                "slug", slug(name),
                                "description", "Workforce pool integration test"))))
                .andExpect(status().isCreated())
                .andReturn();
        return UUID.fromString(json.readTree(result.getResponse().getContentAsString()).get("id").asText());
    }

    private Auth bootstrap(String email, String accountType) throws Exception {
        String token = "mock:" + UUID.randomUUID() + ":" + email;
        MvcResult result = mvc.perform(post("/api/v1/auth/bootstrap")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("accountType", accountType))))
                .andExpect(status().isCreated())
                .andReturn();
        JsonNode response = json.readTree(result.getResponse().getContentAsString());
        return new Auth(UUID.fromString(response.get("user").get("id").asText()), email, token);
    }

    private void createWorkerProfile(Auth worker, String fullName) {
        UUID profileId = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO worker_profiles
                    (id, user_id, public_handle, full_name, headline, bio, experience_years,
                     visibility, completion_score, completion_version, version, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'PRIVATE', 50, 1, 0, now(), now())
                """, profileId, worker.id(), "worker-" + profileId.toString().substring(0, 8),
                fullName, "Verified workforce member", "Reusable workforce pool test profile", 3);
    }

    private static String unique(String prefix) {
        return prefix + '-' + UUID.randomUUID() + "@example.test";
    }

    private static String slug(String prefix) {
        return prefix.toLowerCase().replaceAll("[^a-z0-9]+", "-")
                + '-' + UUID.randomUUID().toString().substring(0, 8);
    }

    private record Auth(UUID id, String email, String token) {
        String bearer() { return "Bearer " + token; }
    }
}
