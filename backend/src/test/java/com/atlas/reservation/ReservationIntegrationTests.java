package com.atlas.reservation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.atlas.TestcontainersConfiguration;
import com.atlas.reservation.application.ReservationService;
import com.atlas.shared.error.ApiProblemException;
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
class ReservationIntegrationTests {
    private final MockMvc mvc;
    private final ObjectMapper json;
    private final JdbcTemplate jdbc;
    private final ReservationService reservations;

    @Autowired
    ReservationIntegrationTests(MockMvc mvc, ObjectMapper json, JdbcTemplate jdbc,
                                ReservationService reservations) {
        this.mvc = mvc;
        this.json = json;
        this.jdbc = jdbc;
        this.reservations = reservations;
    }

    @Test
    void concurrentReservationsNeverExceedCapacity() throws Exception {
        Auth owner = bootstrap("employer");
        UUID orgId = createOrganization(owner);
        UUID shiftId = createPublishedShift(orgId, 2);
        List<UUID> workers = new ArrayList<>();
        for (int i = 0; i < 8; i++) workers.add(createWorker());

        CountDownLatch ready = new CountDownLatch(workers.size());
        CountDownLatch start = new CountDownLatch(1);
        ExecutorService executor = Executors.newFixedThreadPool(workers.size());
        List<Future<Boolean>> results = new ArrayList<>();

        for (UUID workerId : workers) {
            results.add(executor.submit(() -> {
                ready.countDown();
                start.await();
                try {
                    reservations.reserve(orgId, shiftId, owner.id(), workerId);
                    return true;
                } catch (ApiProblemException exception) {
                    return false;
                }
            }));
        }

        ready.await();
        start.countDown();
        int successes = 0;
        for (Future<Boolean> result : results) if (result.get()) successes++;
        executor.shutdownNow();

        Integer active = jdbc.queryForObject("""
                SELECT count(*) FROM shift_reservations
                 WHERE shift_id = ? AND status = 'CONFIRMED'
                """, Integer.class, shiftId);

        assertThat(successes).isEqualTo(2);
        assertThat(active).isEqualTo(2);
    }

    @Test
    void duplicateReservationIsRejectedAndConfirmedReservationCanBeCancelled() throws Exception {
        Auth owner = bootstrap("employer");
        UUID orgId = createOrganization(owner);
        UUID shiftId = createPublishedShift(orgId, 2);
        UUID worker = createWorker();

        MvcResult created = mvc.perform(post("/api/v1/organizations/{org}/shifts/{shift}/reservations",
                        orgId, shiftId)
                        .header("Authorization", owner.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("workerId", worker))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("CONFIRMED"))
                .andReturn();

        mvc.perform(post("/api/v1/organizations/{org}/shifts/{shift}/reservations", orgId, shiftId)
                        .header("Authorization", owner.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("workerId", worker))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("RESERVATION_DUPLICATE"));

        UUID reservationId = UUID.fromString(json.readTree(created.getResponse().getContentAsString())
                .get("id").asText());
        mvc.perform(post("/api/v1/organizations/{org}/shifts/{shift}/reservations/{reservation}/cancel",
                        orgId, shiftId, reservationId)
                        .header("Authorization", owner.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("version", 0))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"))
                .andExpect(jsonPath("$.version").value(1));
    }

    private UUID createPublishedShift(UUID orgId, int capacity) {
        UUID shiftId = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO shifts
                    (id, job_id, organization_id, title, description, start_time, end_time,
                     timezone, capacity, hourly_rate_pence, currency, status,
                     location_name, formatted_address, location, version, created_at, updated_at)
                VALUES (?, NULL, ?, 'Capacity Shift', 'Reservation test',
                        now() + interval '1 day', now() + interval '9 hours' + interval '1 day',
                        'Asia/Dhaka', ?, 50000, 'BDT', 'PUBLISHED',
                        'Dhaka', 'Dhaka, Bangladesh',
                        ST_SetSRID(ST_MakePoint(90.4125, 23.8103), 4326)::geography,
                        0, now(), now())
                """, shiftId, orgId, capacity);
        return shiftId;
    }

    private UUID createWorker() throws Exception {
        Auth worker = bootstrap("worker");
        UUID profileId = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO worker_profiles
                    (id, user_id, public_handle, full_name, headline, bio, experience_years,
                     visibility, completion_score, completion_version, version, created_at, updated_at)
                VALUES (?, ?, ?, 'Reservation Worker', 'Worker', 'Reservation test', 2,
                        'PRIVATE', 50, 1, 0, now(), now())
                """, profileId, worker.id(), "reserve-" + profileId.toString().substring(0, 8));
        return worker.id();
    }

    private UUID createOrganization(Auth auth) throws Exception {
        MvcResult result = mvc.perform(post("/api/v1/organizations")
                        .header("Authorization", auth.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "name", "Reservation Employer " + UUID.randomUUID().toString().substring(0, 4),
                                "slug", "reservation-" + UUID.randomUUID().toString().substring(0, 8),
                                "description", "Reservation integration test"))))
                .andExpect(status().isCreated()).andReturn();
        return UUID.fromString(json.readTree(result.getResponse().getContentAsString()).get("id").asText());
    }

    private Auth bootstrap(String accountType) throws Exception {
        String email = "reservation-owner-" + UUID.randomUUID() + "@example.test";
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
