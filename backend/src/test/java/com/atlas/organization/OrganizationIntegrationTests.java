package com.atlas.organization;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.atlas.TestcontainersConfiguration;
import com.atlas.identity.CapturingMailConfiguration;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Import({TestcontainersConfiguration.class, CapturingMailConfiguration.class})
@SpringBootTest
@AutoConfigureMockMvc
class OrganizationIntegrationTests {
    private static final String PASSWORD = "Correct-Horse-42!";
    private final MockMvc mvc;
    private final ObjectMapper json;
    private final JdbcTemplate jdbc;
    private final TransactionTemplate transactions;

    @Autowired
    OrganizationIntegrationTests(MockMvc mvc, ObjectMapper json, JdbcTemplate jdbc,
                                 PlatformTransactionManager transactionManager) {
        this.mvc = mvc;
        this.json = json;
        this.jdbc = jdbc;
        this.transactions = new TransactionTemplate(transactionManager);
    }

    @Test
    void creatorBecomesOwnerAndCanManageProfileAndPostgisLocation() throws Exception {
        Auth owner = registerEmployer(unique("owner"));
        UUID organizationId = createOrganization(owner, "Atlas Electric");

        mvc.perform(get("/api/v1/organizations/{id}", organizationId).header("Authorization", owner.bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentUserRole").value("OWNER"))
                .andExpect(jsonPath("$.verificationStatus").value("UNVERIFIED"));

        mvc.perform(put("/api/v1/organizations/{id}", organizationId).header("Authorization", owner.bearer())
                        .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of(
                                "version", 0, "name", "Atlas Electrical Services",
                                "slug", slug("atlas-updated"), "description", "Updated profile"))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.version").value(1));

        mvc.perform(post("/api/v1/organizations/{id}/locations", organizationId)
                        .header("Authorization", owner.bearer()).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "name", "Dhaka Office", "latitude", 23.8103, "longitude", 90.4125,
                                "addressLine", "Private operational address", "city", "Dhaka",
                                "region", "Dhaka Division", "countryCode", "bd"))))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.countryCode").value("BD"));

        String geometryType = jdbc.queryForObject("""
                SELECT GeometryType(search_point::geometry) FROM organization_locations WHERE organization_id = ?
                """, String.class, organizationId);
        assertThat(geometryType).isEqualTo("POINT");
    }

    @Test
    void tenantIsolationAndOwnerInvariantPreventUnauthorizedChanges() throws Exception {
        Auth ownerA = registerEmployer(unique("owner-a"));
        Auth ownerB = registerEmployer(unique("owner-b"));
        UUID organizationA = createOrganization(ownerA, "Organization A");
        UUID organizationB = createOrganization(ownerB, "Organization B");

        mvc.perform(get("/api/v1/organizations/{id}", organizationA).header("Authorization", ownerB.bearer()))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("ORGANIZATION_NOT_FOUND"));
        mvc.perform(post("/api/v1/organizations/{id}/locations", organizationA)
                        .header("Authorization", ownerB.bearer()).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("name", "Intrusion", "latitude", 0,
                                "longitude", 0, "countryCode", "BD"))))
                .andExpect(status().isNotFound());
        mvc.perform(delete("/api/v1/organizations/{id}/members/{memberId}", organizationA, ownerA.id())
                        .header("Authorization", ownerA.bearer()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("ORGANIZATION_LAST_OWNER_REQUIRED"));

        assertThat(jdbc.queryForObject("SELECT count(*) FROM organization_members WHERE organization_id = ?",
                Integer.class, organizationA)).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM organization_members WHERE organization_id = ?",
                Integer.class, organizationB)).isEqualTo(1);

        assertThatThrownBy(() -> transactions.executeWithoutResult(ignored -> jdbc.update(
                "DELETE FROM organization_members WHERE organization_id = ?", organizationA)))
                .hasRootCauseInstanceOf(java.sql.SQLException.class)
                .rootCause().hasMessageContaining("must retain at least one owner");
        assertThat(jdbc.queryForObject("SELECT count(*) FROM organization_members WHERE organization_id = ?",
                Integer.class, organizationA)).isEqualTo(1);
    }

    @Test
    void invitationsAreBoundToEmailAndAdminsCannotEscalateToOwner() throws Exception {
        Auth owner = registerEmployer(unique("owner-invite"));
        String memberEmail = unique("member");
        String wrongEmail = unique("wrong");
        Auth member = registerEmployer(memberEmail);
        Auth wrongUser = registerEmployer(wrongEmail);
        UUID organizationId = createOrganization(owner, "Invitation Organization");

        MvcResult invitationResult = mvc.perform(post("/api/v1/organizations/{id}/invitations", organizationId)
                        .header("Authorization", owner.bearer()).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("email", memberEmail, "role", "ADMIN"))))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.status").value("PENDING")).andReturn();
        UUID invitationId = UUID.fromString(json.readTree(invitationResult.getResponse().getContentAsString())
                .get("id").asText());

        mvc.perform(post("/api/v1/organizations/invitations/{id}/accept", invitationId)
                        .header("Authorization", wrongUser.bearer()))
                .andExpect(status().isNotFound());
        mvc.perform(post("/api/v1/organizations/invitations/{id}/accept", invitationId)
                        .header("Authorization", member.bearer()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.currentUserRole").value("ADMIN"));

        mvc.perform(patch("/api/v1/organizations/{id}/members/{memberId}/role", organizationId, member.id())
                        .header("Authorization", member.bearer()).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("role", "OWNER"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("ORGANIZATION_PRIVILEGE_ESCALATION_DENIED"));
        mvc.perform(delete("/api/v1/organizations/{id}/members/{memberId}", organizationId, owner.id())
                        .header("Authorization", member.bearer()))
                .andExpect(status().isForbidden());
    }

    @Test
    void onlyPlatformAdminCanCompleteVerificationAndTransitionsAreExplicit() throws Exception {
        Auth owner = registerEmployer(unique("verification-owner"));
        Auth platformAdmin = registerEmployer(unique("platform-admin"));
        UUID organizationId = createOrganization(owner, "Verified Organization");

        mvc.perform(post("/api/v1/organizations/{id}/verification-request", organizationId)
                        .header("Authorization", owner.bearer()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.verificationStatus").value("PENDING"));

        mvc.perform(patch("/api/v1/admin/organizations/{id}/verification", organizationId)
                        .header("Authorization", owner.bearer()).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("status", "VERIFIED", "reason", "Evidence checked"))))
                .andExpect(status().isForbidden());

        jdbc.update("INSERT INTO user_roles (user_id, role) VALUES (?, 'PLATFORM_ADMIN')", platformAdmin.id());
        platformAdmin = login(platformAdmin.email());
        mvc.perform(patch("/api/v1/admin/organizations/{id}/verification", organizationId)
                        .header("Authorization", platformAdmin.bearer()).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("status", "VERIFIED", "reason", "Evidence checked"))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.verificationStatus").value("VERIFIED"));
        mvc.perform(patch("/api/v1/admin/organizations/{id}/verification", organizationId)
                        .header("Authorization", platformAdmin.bearer()).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("status", "PENDING", "reason", "Invalid rollback"))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("ORGANIZATION_VERIFICATION_TRANSITION_INVALID"));

        assertThat(jdbc.queryForObject("SELECT count(*) FROM organization_verification_history WHERE organization_id = ?",
                Integer.class, organizationId)).isEqualTo(2);
    }

    private UUID createOrganization(Auth auth, String name) throws Exception {
        MvcResult result = mvc.perform(post("/api/v1/organizations").header("Authorization", auth.bearer())
                        .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of(
                                "name", name, "slug", slug(name), "description", "Tenant isolation test"))))
                .andExpect(status().isCreated()).andReturn();
        return UUID.fromString(json.readTree(result.getResponse().getContentAsString()).get("id").asText());
    }

    private Auth registerEmployer(String email) throws Exception {
        MvcResult result = mvc.perform(post("/api/v1/auth/register/employer")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("email", email, "password", PASSWORD))))
                .andExpect(status().isCreated()).andReturn();
        return auth(result, email);
    }

    private Auth login(String email) throws Exception {
        MvcResult result = mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("email", email, "password", PASSWORD))))
                .andExpect(status().isOk()).andReturn();
        return auth(result, email);
    }

    private Auth auth(MvcResult result, String email) throws Exception {
        JsonNode response = json.readTree(result.getResponse().getContentAsString());
        return new Auth(UUID.fromString(response.get("user").get("id").asText()), email,
                response.get("accessToken").asText());
    }

    private static String unique(String prefix) { return prefix + '-' + UUID.randomUUID() + "@example.test"; }
    private static String slug(String prefix) {
        return prefix.toLowerCase().replaceAll("[^a-z0-9]+", "-") + '-' + UUID.randomUUID().toString().substring(0, 8);
    }
    private record Auth(UUID id, String email, String token) {
        String bearer() { return "Bearer " + token; }
    }
}
