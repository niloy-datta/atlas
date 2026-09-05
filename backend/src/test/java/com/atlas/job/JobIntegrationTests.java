package com.atlas.job;

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
class JobIntegrationTests {
    private final MockMvc mvc;
    private final ObjectMapper json;
    private final JdbcTemplate jdbc;

    @Autowired
    JobIntegrationTests(MockMvc mvc, ObjectMapper json, JdbcTemplate jdbc) {
        this.mvc = mvc;
        this.json = json;
        this.jdbc = jdbc;
    }

    @Test
    void createJobDraftAndManageRequirements() throws Exception {
        Auth employer = registerEmployer(unique("employer"));
        UUID orgId = createOrganization(employer, "London Builders Ltd");

        // 1. Create Job Draft
        MvcResult draftResult = mvc.perform(post("/api/v1/organizations/{orgId}/jobs", orgId)
                        .header("Authorization", employer.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "title", "Senior Site Carpenter",
                                "description", "Experienced carpenter required for high-end residential renovation.",
                                "jobType", "SHIFT",
                                "locationName", "Mayfair Site",
                                "formattedAddress", "10 Berkeley Square, London W1J 6AA",
                                "latitude", 51.5098,
                                "longitude", -0.1465,
                                "budgetMinPence", 25000,
                                "budgetMaxPence", 35000,
                                "currency", "GBP"
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Senior Site Carpenter"))
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andExpect(jsonPath("$.budgetMinPence").value(25000))
                .andReturn();

        UUID jobId = UUID.fromString(json.readTree(draftResult.getResponse().getContentAsString()).get("id").asText());

        // 2. Add Required Skill
        Auth admin = platformAdmin();
        UUID skillId = createSkill(admin, "Carpentry");
        mvc.perform(post("/api/v1/organizations/{orgId}/jobs/{jobId}/skills", orgId, jobId)
                        .header("Authorization", employer.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "skillId", skillId,
                                "minimumProficiency", "ADVANCED",
                                "required", true
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.requiredSkills[0].skillName").value("Carpentry"))
                .andExpect(jsonPath("$.requiredSkills[0].minimumProficiency").value("ADVANCED"));

        // 3. Add Required Credential
        mvc.perform(post("/api/v1/organizations/{orgId}/jobs/{jobId}/credentials", orgId, jobId)
                        .header("Authorization", employer.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "credentialType", "CERTIFICATE",
                                "title", "CSCS Skilled Worker Card",
                                "issuer", "CSCS",
                                "required", true
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.requiredCredentials[0].title").value("CSCS Skilled Worker Card"))
                .andExpect(jsonPath("$.requiredCredentials[0].issuer").value("CSCS"));

        // 4. Update Draft
        mvc.perform(put("/api/v1/organizations/{orgId}/jobs/{jobId}", orgId, jobId)
                        .header("Authorization", employer.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.ofEntries(
                                Map.entry("version", 0),
                                Map.entry("title", "Lead Site Carpenter (Updated)"),
                                Map.entry("description", "Experienced lead carpenter required for residential refurbishment."),
                                Map.entry("jobType", "SHIFT"),
                                Map.entry("locationName", "Mayfair Site Central"),
                                Map.entry("formattedAddress", "10 Berkeley Square, London W1J 6AA"),
                                Map.entry("latitude", 51.5098),
                                Map.entry("longitude", -0.1465),
                                Map.entry("budgetMinPence", 28000),
                                Map.entry("budgetMaxPence", 38000),
                                Map.entry("currency", "GBP")
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Lead Site Carpenter (Updated)"))
                .andExpect(jsonPath("$.budgetMinPence").value(28000));

        // 5. Remove Requirement
        mvc.perform(delete("/api/v1/organizations/{orgId}/jobs/{jobId}/skills/{skillId}", orgId, jobId, skillId)
                        .header("Authorization", employer.bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.requiredSkills").isEmpty());
    }

    @Test
    void publishPauseAndCloseLifecycle() throws Exception {
        Auth employer = registerEmployer(unique("employer"));
        UUID orgId = createOrganization(employer, "Metro Facilities");

        MvcResult draftResult = mvc.perform(post("/api/v1/organizations/{orgId}/jobs", orgId)
                        .header("Authorization", employer.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "title", "HVAC Maintenance Engineer",
                                "description", "Commercial HVAC system servicing and emergency maintenance.",
                                "jobType", "SERVICE",
                                "locationName", "Canary Wharf Tower",
                                "formattedAddress", "1 Canada Square, London E14 5AA",
                                "latitude", 51.5054,
                                "longitude", -0.0209,
                                "budgetMinPence", 40000,
                                "budgetMaxPence", 50000,
                                "currency", "GBP"
                        ))))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode draftNode = json.readTree(draftResult.getResponse().getContentAsString());
        UUID jobId = UUID.fromString(draftNode.get("id").asText());
        long version = draftNode.get("version").asLong();

        // DRAFT -> PUBLISHED
        MvcResult pubResult = mvc.perform(post("/api/v1/organizations/{orgId}/jobs/{jobId}/publish", orgId, jobId)
                        .header("Authorization", employer.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("version", version))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PUBLISHED"))
                .andReturn();
        version = json.readTree(pubResult.getResponse().getContentAsString()).get("version").asLong();

        // PUBLISHED -> PAUSED
        MvcResult pauseResult = mvc.perform(post("/api/v1/organizations/{orgId}/jobs/{jobId}/pause", orgId, jobId)
                        .header("Authorization", employer.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("version", version))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PAUSED"))
                .andReturn();
        version = json.readTree(pauseResult.getResponse().getContentAsString()).get("version").asLong();

        // PAUSED -> PUBLISHED (Resume)
        MvcResult resumeResult = mvc.perform(post("/api/v1/organizations/{orgId}/jobs/{jobId}/resume", orgId, jobId)
                        .header("Authorization", employer.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("version", version))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PUBLISHED"))
                .andReturn();
        version = json.readTree(resumeResult.getResponse().getContentAsString()).get("version").asLong();

        // PUBLISHED -> CLOSED
        mvc.perform(post("/api/v1/organizations/{orgId}/jobs/{jobId}/close", orgId, jobId)
                        .header("Authorization", employer.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("version", version))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CLOSED"));
    }

    @Test
    void tenantBoundaryIsolationPreventsCrossTenantAccess() throws Exception {
        Auth employerA = registerEmployer(unique("employerA"));
        UUID orgA = createOrganization(employerA, "Alpha Engineering");

        Auth employerB = registerEmployer(unique("employerB"));
        UUID orgB = createOrganization(employerB, "Beta Contracting");

        MvcResult draftResult = mvc.perform(post("/api/v1/organizations/{orgId}/jobs", orgA)
                        .header("Authorization", employerA.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "title", "Electrical Inspector",
                                "description", "NICEIC qualified electrical testing.",
                                "jobType", "SERVICE",
                                "budgetMinPence", 30000,
                                "budgetMaxPence", 45000,
                                "currency", "GBP"
                        ))))
                .andExpect(status().isCreated())
                .andReturn();

        UUID jobAId = UUID.fromString(json.readTree(draftResult.getResponse().getContentAsString()).get("id").asText());

        // Employer B tries to view Org A's job via tenant endpoint -> 404 (or 403)
        mvc.perform(get("/api/v1/organizations/{orgId}/jobs/{jobId}", orgB, jobAId)
                        .header("Authorization", employerB.bearer()))
                .andExpect(status().isNotFound());

        // Employer B tries to publish Org A's job -> 404
        mvc.perform(post("/api/v1/organizations/{orgId}/jobs/{jobId}/publish", orgB, jobAId)
                        .header("Authorization", employerB.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("version", 0))))
                .andExpect(status().isNotFound());
    }

    @Test
    void postgisSpatialDiscoveryAndPublicSearch() throws Exception {
        Auth employer = registerEmployer(unique("employer"));
        UUID orgId = createOrganization(employer, "National Staffing");

        // Job 1: London Central (51.5074, -0.1278) -> PUBLISHED
        MvcResult job1 = mvc.perform(post("/api/v1/organizations/{orgId}/jobs", orgId)
                        .header("Authorization", employer.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "title", "Event Security Steward London",
                                "description", "SIA licensed stewarding team.",
                                "jobType", "SHIFT",
                                "locationName", "Trafalgar Square",
                                "formattedAddress", "London WC2N 5DN",
                                "latitude", 51.5074,
                                "longitude", -0.1278,
                                "budgetMinPence", 1500,
                                "budgetMaxPence", 2000,
                                "currency", "GBP"
                        ))))
                .andExpect(status().isCreated()).andReturn();
        UUID job1Id = UUID.fromString(json.readTree(job1.getResponse().getContentAsString()).get("id").asText());
        mvc.perform(post("/api/v1/organizations/{orgId}/jobs/{jobId}/publish", orgId, job1Id)
                        .header("Authorization", employer.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("version", 0))))
                .andExpect(status().isOk());

        // Job 2: Manchester (53.4808, -2.2426) -> PUBLISHED
        MvcResult job2 = mvc.perform(post("/api/v1/organizations/{orgId}/jobs", orgId)
                        .header("Authorization", employer.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "title", "Manchester Warehouse Operative",
                                "description", "Forklift driver in Manchester depot.",
                                "jobType", "SHIFT",
                                "locationName", "Manchester Depot",
                                "formattedAddress", "Trafford Park, Manchester",
                                "latitude", 53.4808,
                                "longitude", -2.2426,
                                "budgetMinPence", 1600,
                                "budgetMaxPence", 1900,
                                "currency", "GBP"
                        ))))
                .andExpect(status().isCreated()).andReturn();
        UUID job2Id = UUID.fromString(json.readTree(job2.getResponse().getContentAsString()).get("id").asText());
        mvc.perform(post("/api/v1/organizations/{orgId}/jobs/{jobId}/publish", orgId, job2Id)
                        .header("Authorization", employer.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("version", 0))))
                .andExpect(status().isOk());

        // Job 3: London -> DRAFT (should NOT be visible publicly)
        MvcResult job3 = mvc.perform(post("/api/v1/organizations/{orgId}/jobs", orgId)
                        .header("Authorization", employer.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "title", "Unpublished London Cleaner",
                                "description", "Deep cleaning service.",
                                "jobType", "SHIFT",
                                "latitude", 51.5074,
                                "longitude", -0.1278
                        ))))
                .andExpect(status().isCreated()).andReturn();
        UUID job3Id = UUID.fromString(json.readTree(job3.getResponse().getContentAsString()).get("id").asText());

        // 1. Search near London within 10 km
        MvcResult searchRes = mvc.perform(get("/api/v1/jobs")
                        .param("lat", "51.5074")
                        .param("lon", "-0.1278")
                        .param("radiusKm", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].id").value(job1Id.toString()))
                .andExpect(jsonPath("$.items[0].title").value("Event Security Steward London"))
                .andExpect(jsonPath("$.items[0].distanceMeters").isNumber())
                .andReturn();

        JsonNode items = json.readTree(searchRes.getResponse().getContentAsString()).get("items");
        // Verify Manchester job is not in the 10 km London search
        for (JsonNode item : items) {
            assertThat(item.get("id").asText()).isNotEqualTo(job2Id.toString());
            assertThat(item.get("id").asText()).isNotEqualTo(job3Id.toString());
        }

        // 2. Public detail endpoint returns published job
        mvc.perform(get("/api/v1/jobs/{id}", job1Id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(job1Id.toString()))
                .andExpect(jsonPath("$.organizationName").value("National Staffing"));

        // 3. Public detail endpoint returns 404 for draft job
        mvc.perform(get("/api/v1/jobs/{id}", job3Id))
                .andExpect(status().isNotFound());
    }

    @Test
    void validationErrorsOnInvalidInput() throws Exception {
        Auth employer = registerEmployer(unique("employer"));
        UUID orgId = createOrganization(employer, "Validation Test Org");

        // Negative budget min
        mvc.perform(post("/api/v1/organizations/{orgId}/jobs", orgId)
                        .header("Authorization", employer.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "title", "Test Job",
                                "description", "Description",
                                "jobType", "SHIFT",
                                "budgetMinPence", -500
                        ))))
                .andExpect(status().isBadRequest());

        // Invalid coordinates (> 90 lat)
        mvc.perform(post("/api/v1/organizations/{orgId}/jobs", orgId)
                        .header("Authorization", employer.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "title", "Test Job",
                                "description", "Description",
                                "jobType", "SHIFT",
                                "latitude", 95.0,
                                "longitude", 0.0
                        ))))
                .andExpect(status().isBadRequest());
    }

    private UUID createOrganization(Auth auth, String name) throws Exception {
        MvcResult result = mvc.perform(post("/api/v1/organizations").header("Authorization", auth.bearer())
                        .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of(
                                "name", name, "slug", slug(name), "description", "Jobs integration test"))))
                .andExpect(status().isCreated()).andReturn();
        return UUID.fromString(json.readTree(result.getResponse().getContentAsString()).get("id").asText());
    }

    private Auth registerEmployer(String email) throws Exception {
        String token = "mock:" + UUID.randomUUID() + ":" + email;
        MvcResult result = mvc.perform(post("/api/v1/auth/bootstrap")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("accountType", "employer"))))
                .andExpect(status().isCreated()).andReturn();
        JsonNode response = json.readTree(result.getResponse().getContentAsString());
        UUID id = UUID.fromString(response.get("user").get("id").asText());
        return new Auth(id, email, token);
    }

    private UUID createSkill(Auth admin, String name) throws Exception {
        MvcResult categoryResult = mvc.perform(post("/api/v1/admin/skill-categories")
                        .header("Authorization", admin.bearer()).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("name", name + " Category " + UUID.randomUUID().toString().substring(0, 4),
                                "slug", slug("category"), "description", "Test category"))))
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
        Auth admin = registerEmployer(unique("skill-admin"));
        jdbc.update("INSERT INTO user_roles (user_id, role) VALUES (?, 'PLATFORM_ADMIN')", admin.id());
        String uid = jdbc.queryForObject("SELECT firebase_uid FROM users WHERE email_normalized = ?", String.class, admin.email().toLowerCase());
        return new Auth(admin.id(), admin.email(), "mock:" + uid + ":" + admin.email());
    }

    private static String unique(String prefix) { return prefix + '-' + UUID.randomUUID() + "@example.test"; }
    private static String slug(String prefix) {
        return prefix.toLowerCase().replaceAll("[^a-z0-9]+", "-") + '-' + UUID.randomUUID().toString().substring(0, 8);
    }
    private record Auth(UUID id, String email, String token) {
        String bearer() { return "Bearer " + token; }
    }
}
