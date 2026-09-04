package com.atlas.skill;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.atlas.TestcontainersConfiguration;
import com.atlas.shared.error.ApiProblemException;
import com.atlas.skill.application.SkillService;
import com.atlas.skill.domain.SkillProficiency;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
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
class SkillProofIntegrationTests {
    private static final String PASSWORD = "Correct-Horse-42!";
    private final MockMvc mvc;
    private final ObjectMapper json;
    private final JdbcTemplate jdbc;
    private final SkillService skillService;

    @Autowired
    SkillProofIntegrationTests(MockMvc mvc, ObjectMapper json, JdbcTemplate jdbc, SkillService skillService) {
        this.mvc = mvc;
        this.json = json;
        this.jdbc = jdbc;
        this.skillService = skillService;
    }

    @Test
    void evidenceVerificationAndEndorsementLifecycleIsAuthorizedAndAuditable() throws Exception {
        Auth admin = platformAdmin();
        Auth worker = register("worker", unique("proof-worker"));
        Auth endorser = register("employer", unique("endorser"));
        UUID skillId = createSkill(admin, "Industrial Wiring");

        mvc.perform(get("/api/v1/skills").param("query", "Wiring"))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].id").value(skillId.toString()));

        UUID workerSkillId = declare(worker, skillId);
        mvc.perform(patch("/api/v1/admin/worker-skills/{id}/verification", workerSkillId)
                        .header("Authorization", worker.bearer()).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("status", "VERIFIED", "reason", "Self verify"))))
                .andExpect(status().isForbidden());

        mvc.perform(post("/api/v1/workers/me/skills/{id}/evidence", workerSkillId)
                        .header("Authorization", worker.bearer()).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("evidenceType", "ASSESSMENT",
                                "evidenceReference", "assessment:provider/result-42"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.verificationStatus").value("EVIDENCE_SUBMITTED"))
                .andExpect(jsonPath("$.evidence[0].status").value("SUBMITTED"));

        mvc.perform(patch("/api/v1/admin/worker-skills/{id}/verification", workerSkillId)
                        .header("Authorization", admin.bearer()).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("status", "VERIFIED",
                                "reason", "Assessment result independently checked"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.verificationStatus").value("VERIFIED"))
                .andExpect(jsonPath("$.evidence[0].status").value("ACCEPTED"));

        mvc.perform(delete("/api/v1/workers/me/skills/{id}", workerSkillId)
                        .header("Authorization", worker.bearer()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("VERIFIED_SKILL_REMOVAL_DENIED"));
        mvc.perform(post("/api/v1/worker-skills/{id}/endorsements", workerSkillId)
                        .header("Authorization", worker.bearer()).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("relationship", "COWORKER"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("SKILL_SELF_ENDORSEMENT_DENIED"));
        mvc.perform(post("/api/v1/worker-skills/{id}/endorsements", workerSkillId)
                        .header("Authorization", endorser.bearer()).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("relationship", "SUPERVISOR",
                                "comment", "Observed safe work practices"))))
                .andExpect(status().isCreated());
        mvc.perform(post("/api/v1/worker-skills/{id}/endorsements", workerSkillId)
                        .header("Authorization", endorser.bearer()).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("relationship", "SUPERVISOR"))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("SKILL_ENDORSEMENT_ALREADY_EXISTS"));

        assertThat(jdbc.queryForObject(
                "SELECT count(*) FROM worker_skill_verification_history WHERE worker_skill_id = ?",
                Integer.class, workerSkillId)).isEqualTo(3);
    }

    @Test
    void duplicatesInactiveSkillsAndForeignWorkerResourcesAreRejected() throws Exception {
        Auth admin = platformAdmin();
        Auth workerA = register("worker", unique("skill-a"));
        Auth workerB = register("worker", unique("skill-b"));
        UUID skillId = createSkill(admin, "Commercial Plumbing");
        UUID workerSkillId = declare(workerA, skillId);

        mvc.perform(post("/api/v1/workers/me/skills").header("Authorization", workerA.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("skillId", skillId, "proficiency", "EXPERT"))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("WORKER_SKILL_ALREADY_EXISTS"));
        mvc.perform(patch("/api/v1/workers/me/skills/{id}", workerSkillId)
                        .header("Authorization", workerB.bearer()).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("version", 0, "proficiency", "ADVANCED"))))
                .andExpect(status().isNotFound());

        mvc.perform(patch("/api/v1/admin/skills/{id}/active", skillId)
                        .header("Authorization", admin.bearer()).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("active", false))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.active").value(false));
        mvc.perform(get("/api/v1/skills").param("query", "Commercial Plumbing"))
                .andExpect(status().isOk()).andExpect(jsonPath("$").isEmpty());
        mvc.perform(post("/api/v1/workers/me/skills").header("Authorization", workerB.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("skillId", skillId, "proficiency", "BEGINNER"))))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("SKILL_NOT_FOUND"));
    }

    @Test
    void domainRejectsIllegalVerificationJumpsAndRepeatedEvidenceSubmission() throws Exception {
        Auth admin = platformAdmin();
        Auth worker = register("worker", unique("transition-worker"));
        UUID skillId = createSkill(admin, "Equipment Inspection");
        UUID workerSkillId = declare(worker, skillId);

        mvc.perform(patch("/api/v1/admin/worker-skills/{id}/verification", workerSkillId)
                        .header("Authorization", admin.bearer()).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("status", "VERIFIED", "reason", "Illegal jump"))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("SKILL_VERIFICATION_TRANSITION_INVALID"));

        String evidence = json.writeValueAsString(Map.of("evidenceType", "PORTFOLIO",
                "evidenceReference", "portfolio:inspection/2026"));
        mvc.perform(post("/api/v1/workers/me/skills/{id}/evidence", workerSkillId)
                        .header("Authorization", worker.bearer()).contentType(MediaType.APPLICATION_JSON).content(evidence))
                .andExpect(status().isOk());
        mvc.perform(post("/api/v1/workers/me/skills/{id}/evidence", workerSkillId)
                        .header("Authorization", worker.bearer()).contentType(MediaType.APPLICATION_JSON).content(evidence))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("SKILL_VERIFICATION_TRANSITION_INVALID"));
    }

    @Test
    void concurrentDeclarationsProduceExactlyOneWorkerSkill() throws Exception {
        Auth admin = platformAdmin();
        Auth worker = register("worker", unique("concurrent-worker"));
        UUID skillId = createSkill(admin, "Concurrent Safety Test");
        int contenders = 16;
        CountDownLatch ready = new CountDownLatch(contenders);
        CountDownLatch start = new CountDownLatch(1);
        List<Future<Boolean>> results = new ArrayList<>();
        try (ExecutorService executor = Executors.newFixedThreadPool(contenders)) {
            for (int i = 0; i < contenders; i++) {
                results.add(executor.submit(() -> {
                    ready.countDown();
                    start.await();
                    try {
                        skillService.declare(worker.id(), skillId, SkillProficiency.INTERMEDIATE);
                        return true;
                    } catch (ApiProblemException exception) {
                        assertThat(exception.code()).isEqualTo("WORKER_SKILL_ALREADY_EXISTS");
                        return false;
                    }
                }));
            }
            ready.await();
            start.countDown();
            int successes = 0;
            for (Future<Boolean> result : results) if (result.get()) successes++;
            assertThat(successes).isEqualTo(1);
        }
        assertThat(jdbc.queryForObject(
                "SELECT count(*) FROM worker_skills WHERE worker_user_id = ? AND skill_id = ?",
                Integer.class, worker.id(), skillId)).isEqualTo(1);
    }

    private UUID declare(Auth worker, UUID skillId) throws Exception {
        MvcResult result = mvc.perform(post("/api/v1/workers/me/skills").header("Authorization", worker.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("skillId", skillId, "proficiency", "ADVANCED"))))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.verificationStatus").value("SELF_DECLARED"))
                .andReturn();
        return UUID.fromString(json.readTree(result.getResponse().getContentAsString()).get("id").asText());
    }

    private UUID createSkill(Auth admin, String name) throws Exception {
        MvcResult categoryResult = mvc.perform(post("/api/v1/admin/skill-categories")
                        .header("Authorization", admin.bearer()).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("name", name + " Category", "slug", slug("category"),
                                "description", "Test category"))))
                .andExpect(status().isCreated()).andReturn();
        UUID categoryId = UUID.fromString(json.readTree(categoryResult.getResponse().getContentAsString())
                .get("id").asText());
        MvcResult skillResult = mvc.perform(post("/api/v1/admin/skills")
                        .header("Authorization", admin.bearer()).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("categoryId", categoryId, "name", name,
                                "slug", slug("skill"), "description", "Test skill"))))
                .andExpect(status().isCreated()).andReturn();
        return UUID.fromString(json.readTree(skillResult.getResponse().getContentAsString()).get("id").asText());
    }

    private Auth platformAdmin() throws Exception {
        Auth admin = register("employer", unique("skill-admin"));
        jdbc.update("INSERT INTO user_roles (user_id, role) VALUES (?, 'PLATFORM_ADMIN')", admin.id());
        return login(admin.email());
    }

    private Auth register(String kind, String email) throws Exception {
        String token = "mock:" + UUID.randomUUID() + ":" + email;
        MvcResult result = mvc.perform(post("/api/v1/auth/bootstrap")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("accountType", kind))))
                .andExpect(status().isCreated()).andReturn();
        JsonNode response = json.readTree(result.getResponse().getContentAsString());
        UUID id = UUID.fromString(response.get("user").get("id").asText());
        return new Auth(id, email, token);
    }

    private Auth login(String email) throws Exception {
        String uid = jdbc.queryForObject("SELECT firebase_uid FROM users WHERE email_normalized = ?", String.class, email.toLowerCase());
        UUID id = jdbc.queryForObject("SELECT id FROM users WHERE email_normalized = ?", UUID.class, email.toLowerCase());
        String token = "mock:" + uid + ":" + email;
        return new Auth(id, email, token);
    }

    private Auth auth(MvcResult result, String email) throws Exception {
        JsonNode response = json.readTree(result.getResponse().getContentAsString());
        return new Auth(UUID.fromString(response.get("user").get("id").asText()), email,
                response.get("accessToken").asText());
    }

    private static String unique(String prefix) { return prefix + '-' + UUID.randomUUID() + "@example.test"; }
    private static String slug(String prefix) { return prefix + '-' + UUID.randomUUID().toString().substring(0, 8); }
    private record Auth(UUID id, String email, String token) {
        String bearer() { return "Bearer " + token; }
    }
}
