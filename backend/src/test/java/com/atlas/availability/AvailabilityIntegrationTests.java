package com.atlas.availability;

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
class AvailabilityIntegrationTests {
    private final MockMvc mvc;
    private final ObjectMapper json;
    private final JdbcTemplate jdbc;

    @Autowired
    AvailabilityIntegrationTests(MockMvc mvc, ObjectMapper json, JdbcTemplate jdbc) {
        this.mvc = mvc;
        this.json = json;
        this.jdbc = jdbc;
    }

    @Test
    void workerCanManageRecurringRulesAndOverrides() throws Exception {
        Auth worker = bootstrapWorker();
        createProfile(worker);

        MvcResult ruleResult = mvc.perform(post("/api/v1/workers/me/availability/rules")
                        .header("Authorization", worker.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "dayOfWeek", 7,
                                "startLocal", "09:00:00",
                                "endLocal", "17:00:00",
                                "timezone", "Asia/Dhaka"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.version").value(0))
                .andReturn();
        UUID ruleId = UUID.fromString(json.readTree(ruleResult.getResponse().getContentAsString())
                .get("id").asText());

        mvc.perform(get("/api/v1/workers/me/availability/resolved")
                        .param("date", "2026-10-04")
                        .header("Authorization", worker.bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.source").value("RECURRING"))
                .andExpect(jsonPath("$.windows[0].durationMinutes").value(480));

        mvc.perform(put("/api/v1/workers/me/availability/rules/{id}", ruleId)
                        .header("Authorization", worker.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "version", 0,
                                "dayOfWeek", 7,
                                "startLocal", "10:00:00",
                                "endLocal", "16:00:00",
                                "timezone", "Asia/Dhaka"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.version").value(1));

        MvcResult overrideResult = mvc.perform(post("/api/v1/workers/me/availability/overrides")
                        .header("Authorization", worker.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "date", "2026-10-04",
                                "type", "UNAVAILABLE",
                                "timezone", "Asia/Dhaka",
                                "note", "Personal day"))))
                .andExpect(status().isCreated())
                .andReturn();
        UUID overrideId = UUID.fromString(json.readTree(overrideResult.getResponse().getContentAsString())
                .get("id").asText());

        mvc.perform(get("/api/v1/workers/me/availability/resolved")
                        .param("date", "2026-10-04")
                        .header("Authorization", worker.bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.source").value("OVERRIDE"))
                .andExpect(jsonPath("$.windows").isEmpty());

        mvc.perform(delete("/api/v1/workers/me/availability/overrides/{id}", overrideId)
                        .header("Authorization", worker.bearer()))
                .andExpect(status().isNoContent());

        mvc.perform(delete("/api/v1/workers/me/availability/rules/{id}", ruleId)
                        .header("Authorization", worker.bearer()))
                .andExpect(status().isNoContent());
    }

    @Test
    void workerCannotMutateAnotherWorkersRuleById() throws Exception {
        Auth first = bootstrapWorker();
        Auth second = bootstrapWorker();
        createProfile(first);
        createProfile(second);

        UUID ruleId = createRule(first);

        mvc.perform(put("/api/v1/workers/me/availability/rules/{id}", ruleId)
                        .header("Authorization", second.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "version", 0,
                                "dayOfWeek", 1,
                                "startLocal", "09:00:00",
                                "endLocal", "17:00:00",
                                "timezone", "Asia/Dhaka"))))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("AVAILABILITY_RULE_NOT_FOUND"));
    }

    private UUID createRule(Auth worker) throws Exception {
        MvcResult result = mvc.perform(post("/api/v1/workers/me/availability/rules")
                        .header("Authorization", worker.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "dayOfWeek", 1,
                                "startLocal", "08:00:00",
                                "endLocal", "12:00:00",
                                "timezone", "Asia/Dhaka"))))
                .andExpect(status().isCreated())
                .andReturn();
        return UUID.fromString(json.readTree(result.getResponse().getContentAsString()).get("id").asText());
    }

    private Auth bootstrapWorker() throws Exception {
        String email = "availability-" + UUID.randomUUID() + "@example.test";
        String token = "mock:" + UUID.randomUUID() + ":" + email;
        MvcResult result = mvc.perform(post("/api/v1/auth/bootstrap")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("accountType", "worker"))))
                .andExpect(status().isCreated()).andReturn();
        JsonNode response = json.readTree(result.getResponse().getContentAsString());
        return new Auth(UUID.fromString(response.get("user").get("id").asText()), token);
    }

    private void createProfile(Auth worker) {
        UUID profileId = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO worker_profiles
                    (id, user_id, public_handle, full_name, headline, bio, experience_years,
                     visibility, completion_score, completion_version, version, created_at, updated_at)
                VALUES (?, ?, ?, 'Availability Worker', 'Worker', 'Availability test', 2,
                        'PRIVATE', 50, 1, 0, now(), now())
                """, profileId, worker.id(), "availability-" + profileId.toString().substring(0, 8));
    }

    private record Auth(UUID id, String token) {
        String bearer() { return "Bearer " + token; }
    }
}
