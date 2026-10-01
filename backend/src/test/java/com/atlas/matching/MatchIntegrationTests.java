package com.atlas.matching;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
class MatchIntegrationTests {
    private final MockMvc mvc;
    private final ObjectMapper json;
    private final JdbcTemplate jdbc;

    @Autowired
    MatchIntegrationTests(MockMvc mvc, ObjectMapper json, JdbcTemplate jdbc) {
        this.mvc = mvc;
        this.json = json;
        this.jdbc = jdbc;
    }

    @Test
    void verifiedNearbySkillMatchRanksFirstAndIsExplainable() throws Exception {
        Auth employer = bootstrap("employer");
        UUID orgId = createOrganization(employer, "Match Employer");
        UUID skillId = createSkill();
        UUID jobId = createJob(employer, orgId, skillId);

        Auth strong = bootstrap("worker");
        Auth weak = bootstrap("worker");
        createWorker(strong, "Strong Worker", 23.8105, 90.4127, 90);
        createWorker(weak, "Weak Worker", 23.9000, 90.5000, 60);

        jdbc.update("""
                INSERT INTO worker_skills
                    (id, worker_user_id, skill_id, proficiency, verification_status,
                     version, created_at, updated_at)
                VALUES (?, ?, ?, 'EXPERT', 'VERIFIED', 0, now(), now())
                """, UUID.randomUUID(), strong.id(), skillId);

        MvcResult result = mvc.perform(get("/api/v1/organizations/{org}/jobs/{job}/matches", orgId, jobId)
                        .header("Authorization", employer.bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.algorithmVersion").value("MATCH_V1"))
                .andExpect(jsonPath("$.candidates[0].workerUserId").value(strong.id().toString()))
                .andExpect(jsonPath("$.candidates[0].score.total").isNumber())
                .andExpect(jsonPath("$.candidates[0].score.reasons").isArray())
                .andReturn();

        JsonNode candidates = json.readTree(result.getResponse().getContentAsString()).get("candidates");
        assertThat(candidates.size()).isGreaterThanOrEqualTo(2);
        assertThat(candidates.get(0).get("score").get("total").asDouble())
                .isGreaterThan(candidates.get(1).get("score").get("total").asDouble());
    }

    @Test
    void anotherOrganizationCannotReadMatches() throws Exception {
        Auth owner = bootstrap("employer");
        Auth outsider = bootstrap("employer");
        UUID orgId = createOrganization(owner, "Private Match Employer");
        UUID otherOrg = createOrganization(outsider, "Other Employer");
        UUID skillId = createSkill();
        UUID jobId = createJob(owner, orgId, skillId);

        mvc.perform(get("/api/v1/organizations/{org}/jobs/{job}/matches", orgId, jobId)
                        .header("Authorization", outsider.bearer()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("ORGANIZATION_NOT_FOUND"));

        assertThat(otherOrg).isNotEqualTo(orgId);
    }

    private UUID createJob(Auth employer, UUID orgId, UUID skillId) throws Exception {
        MvcResult created = mvc.perform(post("/api/v1/organizations/{org}/jobs", orgId)
                        .header("Authorization", employer.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "title", "Verified Electrician",
                                "description", "Electrical maintenance",
                                "jobType", "SERVICE",
                                "locationName", "Dhaka",
                                "formattedAddress", "Dhaka, Bangladesh",
                                "latitude", 23.8103,
                                "longitude", 90.4125,
                                "budgetMinPence", 30000,
                                "budgetMaxPence", 45000,
                                "currency", "BDT"))))
                .andExpect(status().isCreated()).andReturn();
        UUID jobId = UUID.fromString(json.readTree(created.getResponse().getContentAsString()).get("id").asText());
        jdbc.update("""
                INSERT INTO job_required_skills
                    (id, job_id, skill_id, minimum_proficiency, required, created_at)
                VALUES (?, ?, ?, 'INTERMEDIATE', true, now())
                """, UUID.randomUUID(), jobId, skillId);
        return jobId;
    }

    private UUID createSkill() {
        UUID categoryId = UUID.randomUUID();
        UUID skillId = UUID.randomUUID();
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        jdbc.update("""
                INSERT INTO skill_categories
                    (id, name, slug, description, active, created_at, updated_at)
                VALUES (?, ?, ?, 'Test', true, now(), now())
                """, categoryId, "Electrical " + suffix, "electrical-" + suffix);
        jdbc.update("""
                INSERT INTO skills
                    (id, category_id, name, slug, description, active, created_at, updated_at)
                VALUES (?, ?, ?, ?, 'Test', true, now(), now())
                """, skillId, categoryId, "Wiring " + suffix, "wiring-" + suffix);
        return skillId;
    }

    private void createWorker(Auth auth, String name, double lat, double lon, int completion) {
        UUID profileId = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO worker_profiles
                    (id, user_id, public_handle, full_name, headline, bio, experience_years,
                     visibility, completion_score, completion_version, version, created_at, updated_at)
                VALUES (?, ?, ?, ?, 'Skilled worker', 'Matching test', 5,
                        'PUBLIC', ?, 1, 0, now(), now())
                """, profileId, auth.id(), "match-" + profileId.toString().substring(0, 8), name, completion);
        jdbc.update("""
                INSERT INTO worker_preferences
                    (worker_profile_id, open_to_work, max_distance_km, preferred_job_types, updated_at)
                VALUES (?, true, 50, '[]'::jsonb, now())
                """, profileId);
        jdbc.update("""
                INSERT INTO worker_locations
                    (worker_profile_id, search_point, city, region, country_code, updated_at)
                VALUES (?, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography,
                        'Dhaka', 'Dhaka', 'BD', now())
                """, profileId, lon, lat);
    }

    private UUID createOrganization(Auth auth, String name) throws Exception {
        MvcResult result = mvc.perform(post("/api/v1/organizations")
                        .header("Authorization", auth.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "name", name,
                                "slug", "match-" + UUID.randomUUID().toString().substring(0, 8),
                                "description", "Matching integration test"))))
                .andExpect(status().isCreated()).andReturn();
        return UUID.fromString(json.readTree(result.getResponse().getContentAsString()).get("id").asText());
    }

    private Auth bootstrap(String accountType) throws Exception {
        String email = "match-" + UUID.randomUUID() + "@example.test";
        String token = "mock:" + UUID.randomUUID() + ":" + email;
        MvcResult result = mvc.perform(post("/api/v1/auth/bootstrap")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("accountType", accountType))))
                .andExpect(status().isCreated()).andReturn();
        return new Auth(UUID.fromString(json.readTree(result.getResponse().getContentAsString())
                .get("user").get("id").asText()), token);
    }

    private record Auth(UUID id, String token) {
        String bearer() { return "Bearer " + token; }
    }
}
