package com.atlas.worker;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.atlas.TestcontainersConfiguration;
import java.util.List;
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
class WorkerProfileIntegrationTests {
    private final MockMvc mvc;
    private final ObjectMapper json;
    private final JdbcTemplate jdbc;

    @Autowired
    WorkerProfileIntegrationTests(MockMvc mvc, ObjectMapper json, JdbcTemplate jdbc) {
        this.mvc = mvc;
        this.json = json;
        this.jdbc = jdbc;
    }

    @Test
    void workerCreatesCompleteProfileAndPublicDtoNeverLeaksPreciseData() throws Exception {
        Auth worker = register("worker", unique("profile"));
        String handle = "worker-" + UUID.randomUUID().toString().substring(0, 8);
        Map<String, Object> complete = profile(null, handle, "PUBLIC", false, false);

        mvc.perform(put("/api/v1/workers/me/profile").header("Authorization", worker.bearer())
                        .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(complete)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completion.score").value(100))
                .andExpect(jsonPath("$.version").value(0))
                .andExpect(jsonPath("$.location.latitude").value(23.8103))
                .andExpect(jsonPath("$.location.longitude").value(90.4125));

        String publicBody = mvc.perform(get("/api/v1/work-pass/{handle}", handle.toUpperCase()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.handle").value(handle))
                .andExpect(jsonPath("$.experienceYears").doesNotExist())
                .andExpect(jsonPath("$.location").doesNotExist())
                .andReturn().getResponse().getContentAsString();
        assertThat(publicBody).doesNotContainIgnoringCase(
                "latitude", "longitude", "email", "phone", "address", "document", "credential", "session");

        String geographyType = jdbc.queryForObject("""
                SELECT GeometryType(search_point::geometry)
                  FROM worker_locations l JOIN worker_profiles p ON p.id = l.worker_profile_id
                 WHERE p.public_handle = ?
                """, String.class, handle);
        assertThat(geographyType).isEqualTo("POINT");
    }

    @Test
    void privacyVersionAndRoleBoundariesAreEnforced() throws Exception {
        Auth worker = register("worker", unique("privacy"));
        Auth employer = register("employer", unique("employer"));
        String handle = "private-" + UUID.randomUUID().toString().substring(0, 8);

        mvc.perform(put("/api/v1/workers/me/profile").header("Authorization", employer.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(profile(null, handle, "PRIVATE", true, true))))
                .andExpect(status().isForbidden());

        mvc.perform(put("/api/v1/workers/me/profile").header("Authorization", worker.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(profile(null, handle, "PRIVATE", true, true))))
                .andExpect(status().isOk());
        mvc.perform(get("/api/v1/work-pass/{handle}", handle)).andExpect(status().isNotFound());

        mvc.perform(put("/api/v1/workers/me/profile").header("Authorization", worker.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(profile(0L, handle, "PUBLIC", true, true))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.version").value(1));
        mvc.perform(get("/api/v1/work-pass/{handle}", handle))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.experienceYears").value(8))
                .andExpect(jsonPath("$.location.city").value("Dhaka"))
                .andExpect(jsonPath("$.location.latitude").doesNotExist());

        mvc.perform(put("/api/v1/workers/me/profile").header("Authorization", worker.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(profile(0L, handle, "PUBLIC", true, true))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("WORKER_PROFILE_VERSION_CONFLICT"));
    }

    @Test
    void databasePreventsDuplicateHandlesAcrossWorkers() throws Exception {
        Auth first = register("worker", unique("first"));
        Auth second = register("worker", unique("second"));
        String handle = "unique-" + UUID.randomUUID().toString().substring(0, 8);
        String request = json.writeValueAsString(profile(null, handle, "PUBLIC", true, true));
        mvc.perform(put("/api/v1/workers/me/profile").header("Authorization", first.bearer())
                        .contentType(MediaType.APPLICATION_JSON).content(request))
                .andExpect(status().isOk());
        mvc.perform(put("/api/v1/workers/me/profile").header("Authorization", second.bearer())
                        .contentType(MediaType.APPLICATION_JSON).content(request))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("WORKER_HANDLE_UNAVAILABLE"));
    }

    private Auth register(String kind, String email) throws Exception {
        String token = "mock:" + UUID.randomUUID() + ":" + email;
        String body = json.writeValueAsString(Map.of("accountType", kind));
        mvc.perform(post("/api/v1/auth/bootstrap")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated());
        return new Auth(token);
    }

    private Map<String, Object> profile(Long version, String handle, String visibility,
                                        boolean showLocation, boolean showExperience) {
        Map<String, Object> location = Map.of("latitude", 23.8103, "longitude", 90.4125,
                "city", "Dhaka", "region", "Dhaka Division", "countryCode", "BD");
        Map<String, Object> preferences = Map.of("openToWork", true, "maxDistanceKm", 25,
                "jobTypes", List.of("PERMANENT", "HOURLY_SHIFT"));
        Map<String, Object> privacy = Map.of("showCoarseLocation", showLocation,
                "showExperience", showExperience);
        java.util.HashMap<String, Object> body = new java.util.HashMap<>();
        if (version != null) body.put("version", version);
        body.put("handle", handle);
        body.put("fullName", "Sample Worker");
        body.put("headline", "Verified electrical technician");
        body.put("bio", "Eight years of verified field experience.");
        body.put("experienceYears", 8);
        body.put("visibility", visibility);
        body.put("location", location);
        body.put("preferences", preferences);
        body.put("privacy", privacy);
        return body;
    }

    private static String unique(String prefix) { return prefix + '-' + UUID.randomUUID() + "@example.test"; }
    private record Auth(String token) { String bearer() { return "Bearer " + token; } }
}
