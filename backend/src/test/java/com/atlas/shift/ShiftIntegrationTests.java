package com.atlas.shift;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.atlas.TestcontainersConfiguration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
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
class ShiftIntegrationTests {
    private final MockMvc mvc;
    private final ObjectMapper json;
    private final JdbcTemplate jdbc;

    @Autowired
    ShiftIntegrationTests(MockMvc mvc, ObjectMapper json, JdbcTemplate jdbc) {
        this.mvc = mvc;
        this.json = json;
        this.jdbc = jdbc;
    }

    @Test
    void createShiftDraftAndManageRequirements() throws Exception {
        Auth employer = registerEmployer(unique("employer"));
        UUID orgId = createOrganization(employer, "Apex Logistics Ltd");

        // 1. Create a parent Job
        MvcResult jobResult = mvc.perform(post("/api/v1/organizations/{orgId}/jobs", orgId)
                        .header("Authorization", employer.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "title", "Warehouse Logistics Operative",
                                "description", "Warehouse picking and pallet truck operations.",
                                "jobType", "SHIFT",
                                "currency", "GBP"
                        ))))
                .andExpect(status().isCreated()).andReturn();
        UUID jobId = UUID.fromString(json.readTree(jobResult.getResponse().getContentAsString()).get("id").asText());

        // Add skill to job
        Auth admin = platformAdmin();
        UUID forkliftSkillId = createSkill(admin, "Forklift Operations");
        mvc.perform(post("/api/v1/organizations/{orgId}/jobs/{jobId}/skills", orgId, jobId)
                        .header("Authorization", employer.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "skillId", forkliftSkillId,
                                "minimumProficiency", "INTERMEDIATE",
                                "required", true
                        ))))
                .andExpect(status().isOk());

        // 2. Create Shift Draft with inheritJobRequirements=true
        Instant start = Instant.now().plus(2, ChronoUnit.DAYS).truncatedTo(ChronoUnit.HOURS);
        Instant end = start.plus(8, ChronoUnit.HOURS);

        MvcResult shiftResult = mvc.perform(post("/api/v1/organizations/{orgId}/shifts", orgId)
                        .header("Authorization", employer.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.ofEntries(
                                Map.entry("jobId", jobId.toString()),
                                Map.entry("title", "Night Shift Operative"),
                                Map.entry("description", "Overnight pallet distribution shift."),
                                Map.entry("startTime", start.toString()),
                                Map.entry("endTime", end.toString()),
                                Map.entry("timezone", "Europe/London"),
                                Map.entry("capacity", 4),
                                Map.entry("hourlyRatePence", 1850),
                                Map.entry("currency", "GBP"),
                                Map.entry("locationName", "Apex Distribution Centre"),
                                Map.entry("formattedAddress", "10 Apex Way, London SE1"),
                                Map.entry("latitude", 51.5012),
                                Map.entry("longitude", -0.0834),
                                Map.entry("inheritJobRequirements", true)
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Night Shift Operative"))
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andExpect(jsonPath("$.capacity").value(4))
                .andExpect(jsonPath("$.hourlyRatePence").value(1850))
                .andExpect(jsonPath("$.requiredSkills[0].skillName").value("Forklift Operations"))
                .andReturn();

        UUID shiftId = UUID.fromString(json.readTree(shiftResult.getResponse().getContentAsString()).get("id").asText());

        // 3. Add a direct shift credential requirement
        mvc.perform(post("/api/v1/organizations/{orgId}/shifts/{shiftId}/credentials", orgId, shiftId)
                        .header("Authorization", employer.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "credentialType", "LICENSE",
                                "title", "Counterbalance Forklift License (RTITB)",
                                "issuer", "RTITB",
                                "required", true
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.requiredCredentials[0].title").value("Counterbalance Forklift License (RTITB)"));

        // 4. Update Shift Draft
        mvc.perform(put("/api/v1/organizations/{orgId}/shifts/{shiftId}", orgId, shiftId)
                        .header("Authorization", employer.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.ofEntries(
                                Map.entry("version", 0),
                                Map.entry("jobId", jobId),
                                Map.entry("title", "Night Shift Operative - Senior"),
                                Map.entry("startTime", start.toString()),
                                Map.entry("endTime", end.toString()),
                                Map.entry("timezone", "Europe/London"),
                                Map.entry("capacity", 6),
                                Map.entry("hourlyRatePence", 2000),
                                Map.entry("currency", "GBP"),
                                Map.entry("locationName", "Apex Distribution Centre"),
                                Map.entry("formattedAddress", "10 Apex Way, London SE1"),
                                Map.entry("latitude", 51.5012),
                                Map.entry("longitude", -0.0834)
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Night Shift Operative - Senior"))
                .andExpect(jsonPath("$.capacity").value(6))
                .andExpect(jsonPath("$.hourlyRatePence").value(2000));

        // 5. Remove Skill Requirement
        mvc.perform(delete("/api/v1/organizations/{orgId}/shifts/{shiftId}/skills/{skillId}", orgId, shiftId, forkliftSkillId)
                        .header("Authorization", employer.bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.requiredSkills").isEmpty());
    }

    @Test
    void shiftLifecycleTransitions() throws Exception {
        Auth employer = registerEmployer(unique("employer"));
        UUID orgId = createOrganization(employer, "CareFirst Services");

        Instant start = Instant.now().plus(1, ChronoUnit.DAYS);
        Instant end = start.plus(6, ChronoUnit.HOURS);

        MvcResult draftResult = mvc.perform(post("/api/v1/organizations/{orgId}/shifts", orgId)
                        .header("Authorization", employer.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "title", "Healthcare Assistant Day Shift",
                                "startTime", start.toString(),
                                "endTime", end.toString(),
                                "capacity", 2,
                                "hourlyRatePence", 1600,
                                "currency", "GBP"
                        ))))
                .andExpect(status().isCreated()).andReturn();

        JsonNode shiftNode = json.readTree(draftResult.getResponse().getContentAsString());
        UUID shiftId = UUID.fromString(shiftNode.get("id").asText());
        long version = shiftNode.get("version").asLong();

        // 1. DRAFT -> PUBLISHED
        MvcResult pubResult = mvc.perform(post("/api/v1/organizations/{orgId}/shifts/{shiftId}/publish", orgId, shiftId)
                        .header("Authorization", employer.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("version", version))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PUBLISHED"))
                .andReturn();
        version = json.readTree(pubResult.getResponse().getContentAsString()).get("version").asLong();

        // 2. PUBLISHED -> IN_PROGRESS
        MvcResult startResult = mvc.perform(post("/api/v1/organizations/{orgId}/shifts/{shiftId}/start", orgId, shiftId)
                        .header("Authorization", employer.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("version", version))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"))
                .andReturn();
        version = json.readTree(startResult.getResponse().getContentAsString()).get("version").asLong();

        // 3. IN_PROGRESS -> COMPLETED
        mvc.perform(post("/api/v1/organizations/{orgId}/shifts/{shiftId}/complete", orgId, shiftId)
                        .header("Authorization", employer.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("version", version))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"));
    }

    @Test
    void tenantBoundaryIsolationPreventsCrossTenantAccess() throws Exception {
        Auth employerA = registerEmployer(unique("employerA"));
        UUID orgA = createOrganization(employerA, "Alpha Security");

        Auth employerB = registerEmployer(unique("employerB"));
        UUID orgB = createOrganization(employerB, "Beta Stewarding");

        Instant start = Instant.now().plus(3, ChronoUnit.DAYS);
        Instant end = start.plus(4, ChronoUnit.HOURS);

        MvcResult draftResult = mvc.perform(post("/api/v1/organizations/{orgId}/shifts", orgA)
                        .header("Authorization", employerA.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "title", "Stadium Security Guard",
                                "startTime", start.toString(),
                                "endTime", end.toString(),
                                "capacity", 5,
                                "hourlyRatePence", 1750,
                                "currency", "GBP"
                        ))))
                .andExpect(status().isCreated()).andReturn();

        UUID shiftAId = UUID.fromString(json.readTree(draftResult.getResponse().getContentAsString()).get("id").asText());

        // Employer B tries to view Org A's shift -> 404
        mvc.perform(get("/api/v1/organizations/{orgId}/shifts/{shiftId}", orgB, shiftAId)
                        .header("Authorization", employerB.bearer()))
                .andExpect(status().isNotFound());

        // Employer B tries to publish Org A's shift -> 404
        mvc.perform(post("/api/v1/organizations/{orgId}/shifts/{shiftId}/publish", orgB, shiftAId)
                        .header("Authorization", employerB.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("version", 0))))
                .andExpect(status().isNotFound());
    }

    @Test
    void postgisSpatialAndIntervalDiscovery() throws Exception {
        Auth employer = registerEmployer(unique("employer"));
        UUID orgId = createOrganization(employer, "National Events Group");

        Instant tomorrow = Instant.now().plus(1, ChronoUnit.DAYS).truncatedTo(ChronoUnit.HOURS);
        Instant nextWeek = Instant.now().plus(7, ChronoUnit.DAYS).truncatedTo(ChronoUnit.HOURS);

        // Shift 1: London Central (51.5074, -0.1278) Tomorrow -> PUBLISHED
        MvcResult shift1 = mvc.perform(post("/api/v1/organizations/{orgId}/shifts", orgId)
                        .header("Authorization", employer.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "title", "London Stadium Steward Shift",
                                "startTime", tomorrow.toString(),
                                "endTime", tomorrow.plus(6, ChronoUnit.HOURS).toString(),
                                "capacity", 10,
                                "hourlyRatePence", 2000,
                                "currency", "GBP",
                                "latitude", 51.5074,
                                "longitude", -0.1278
                        ))))
                .andExpect(status().isCreated()).andReturn();
        UUID shift1Id = UUID.fromString(json.readTree(shift1.getResponse().getContentAsString()).get("id").asText());
        mvc.perform(post("/api/v1/organizations/{orgId}/shifts/{shiftId}/publish", orgId, shift1Id)
                        .header("Authorization", employer.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("version", 0))))
                .andExpect(status().isOk());

        // Shift 2: Birmingham (52.4862, -1.8904) Next Week -> PUBLISHED
        MvcResult shift2 = mvc.perform(post("/api/v1/organizations/{orgId}/shifts", orgId)
                        .header("Authorization", employer.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "title", "Birmingham Arena Steward Shift",
                                "startTime", nextWeek.toString(),
                                "endTime", nextWeek.plus(6, ChronoUnit.HOURS).toString(),
                                "capacity", 8,
                                "hourlyRatePence", 1500,
                                "currency", "GBP",
                                "latitude", 52.4862,
                                "longitude", -1.8904
                        ))))
                .andExpect(status().isCreated()).andReturn();
        UUID shift2Id = UUID.fromString(json.readTree(shift2.getResponse().getContentAsString()).get("id").asText());
        mvc.perform(post("/api/v1/organizations/{orgId}/shifts/{shiftId}/publish", orgId, shift2Id)
                        .header("Authorization", employer.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("version", 0))))
                .andExpect(status().isOk());

        // 1. Spatial Discovery near London (15km radius)
        MvcResult searchRes = mvc.perform(get("/api/v1/shifts")
                        .param("lat", "51.5074")
                        .param("lon", "-0.1278")
                        .param("radiusKm", "15"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].id").value(shift1Id.toString()))
                .andExpect(jsonPath("$.items[0].distanceMeters").isNumber())
                .andReturn();

        JsonNode items = json.readTree(searchRes.getResponse().getContentAsString()).get("items");
        for (JsonNode item : items) {
            assertThat(item.get("id").asText()).isNotEqualTo(shift2Id.toString());
        }

        // 2. Interval Discovery for tomorrow window
        mvc.perform(get("/api/v1/shifts")
                        .param("from", tomorrow.minus(1, ChronoUnit.HOURS).toString())
                        .param("to", tomorrow.plus(12, ChronoUnit.HOURS).toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].id").value(shift1Id.toString()));

        // 3. Minimum rate filter (min 1800 pence -> should return shift1 £20/h, not shift2 £15/h)
        mvc.perform(get("/api/v1/shifts")
                        .param("minHourlyRatePence", "1800"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].id").value(shift1Id.toString()));

        // 4. Public detail endpoint returns published shift
        mvc.perform(get("/api/v1/shifts/{id}", shift1Id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(shift1Id.toString()))
                .andExpect(jsonPath("$.organizationName").value("National Events Group"));
    }

    @Test
    void validationErrorsOnInvalidIntervalAndCapacity() throws Exception {
        Auth employer = registerEmployer(unique("employer"));
        UUID orgId = createOrganization(employer, "Validation Test Org");

        Instant start = Instant.now().plus(2, ChronoUnit.DAYS);
        Instant invalidEnd = start.minus(1, ChronoUnit.HOURS); // End before start

        // End before start
        mvc.perform(post("/api/v1/organizations/{orgId}/shifts", orgId)
                        .header("Authorization", employer.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "title", "Invalid Shift",
                                "startTime", start.toString(),
                                "endTime", invalidEnd.toString(),
                                "capacity", 1,
                                "hourlyRatePence", 1500
                        ))))
                .andExpect(status().isBadRequest());

        // Zero capacity
        mvc.perform(post("/api/v1/organizations/{orgId}/shifts", orgId)
                        .header("Authorization", employer.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "title", "Invalid Shift",
                                "startTime", start.toString(),
                                "endTime", start.plus(4, ChronoUnit.HOURS).toString(),
                                "capacity", 0,
                                "hourlyRatePence", 1500
                        ))))
                .andExpect(status().isBadRequest());

        // Negative rate
        mvc.perform(post("/api/v1/organizations/{orgId}/shifts", orgId)
                        .header("Authorization", employer.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "title", "Invalid Shift",
                                "startTime", start.toString(),
                                "endTime", start.plus(4, ChronoUnit.HOURS).toString(),
                                "capacity", 1,
                                "hourlyRatePence", -100
                        ))))
                .andExpect(status().isBadRequest());
    }

    private UUID createOrganization(Auth auth, String name) throws Exception {
        MvcResult result = mvc.perform(post("/api/v1/organizations").header("Authorization", auth.bearer())
                        .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of(
                                "name", name, "slug", slug(name), "description", "Shifts integration test"))))
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
