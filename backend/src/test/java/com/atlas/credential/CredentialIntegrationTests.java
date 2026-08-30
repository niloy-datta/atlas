package com.atlas.credential;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.atlas.TestcontainersConfiguration;
import com.atlas.TestcontainersConfiguration.InMemoryCredentialStorage;
import com.atlas.identity.CapturingMailConfiguration;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
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

@Import({TestcontainersConfiguration.class, CapturingMailConfiguration.class})
@SpringBootTest
@AutoConfigureMockMvc
class CredentialIntegrationTests {
    private static final String PASSWORD = "Correct-Horse-42!";
    private final MockMvc mvc;
    private final ObjectMapper json;
    private final JdbcTemplate jdbc;
    private final InMemoryCredentialStorage storage;

    @Autowired
    CredentialIntegrationTests(MockMvc mvc, ObjectMapper json, JdbcTemplate jdbc,
                               InMemoryCredentialStorage storage) {
        this.mvc = mvc;
        this.json = json;
        this.jdbc = jdbc;
        this.storage = storage;
    }

    @Test
    void secureCredentialLifecycleNeverLeaksObjectMetadata() throws Exception {
        Auth worker = register("worker", unique("credential-worker"));
        Auth otherWorker = register("worker", unique("credential-other"));
        Auth admin = platformAdmin();
        UUID credentialId = createCredential(worker, "PUBLIC_SUMMARY");

        mvc.perform(get("/api/v1/workers/me/credentials/{id}", credentialId)
                        .header("Authorization", otherWorker.bearer()))
                .andExpect(status().isNotFound());
        mvc.perform(post("/api/v1/workers/me/credentials/{id}/uploads", credentialId)
                        .header("Authorization", worker.bearer()).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("filename", "license.exe",
                                "contentType", "application/pdf", "sizeBytes", 20))))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("CREDENTIAL_FILE_INVALID"));

        byte[] pdf = "%PDF-1.7\ncredential-proof".getBytes(StandardCharsets.US_ASCII);
        MvcResult uploadResult = mvc.perform(post("/api/v1/workers/me/credentials/{id}/uploads", credentialId)
                        .header("Authorization", worker.bearer()).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("filename", "license.pdf",
                                "contentType", "application/pdf", "sizeBytes", pdf.length))))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.uploadUrl").isNotEmpty()).andReturn();
        String uploadBody = uploadResult.getResponse().getContentAsString();
        assertThat(uploadBody).doesNotContain("objectKey");
        UUID documentId = UUID.fromString(json.readTree(uploadBody).get("documentId").asText());
        String objectKey = jdbc.queryForObject(
                "SELECT object_key FROM credential_document_objects WHERE id = ?", String.class, documentId);
        storage.put(objectKey, pdf);

        mvc.perform(post("/api/v1/workers/me/credentials/{credentialId}/documents/{documentId}/complete",
                        credentialId, documentId).header("Authorization", worker.bearer()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.malwareStatus").value("CLEAN"));
        mvc.perform(post("/api/v1/workers/me/credentials/{id}/submit", credentialId)
                        .header("Authorization", worker.bearer()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.verificationStatus").value("PENDING"));
        mvc.perform(patch("/api/v1/admin/credentials/{id}/verification", credentialId)
                        .header("Authorization", worker.bearer()).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("status", "VERIFIED", "reason", "Self verify"))))
                .andExpect(status().isForbidden());
        mvc.perform(patch("/api/v1/admin/credentials/{id}/verification", credentialId)
                        .header("Authorization", admin.bearer()).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("status", "VERIFIED", "reason", "Document checked"))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.verificationStatus").value("VERIFIED"));

        String publicBody = mvc.perform(get("/api/v1/public/credentials/{id}", credentialId))
                .andExpect(status().isOk()).andExpect(jsonPath("$.title").value("Electrical License"))
                .andReturn().getResponse().getContentAsString();
        assertThat(publicBody).doesNotContainIgnoringCase(
                "credentialNumber", "documents", "objectKey", "download", "workerUserId");
        String privateBody = mvc.perform(get("/api/v1/workers/me/credentials/{id}", credentialId)
                        .header("Authorization", worker.bearer())).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertThat(privateBody).doesNotContain("objectKey", "credentials/");
    }

    @Test
    void downloadRequiresOwnerOrUnexpiredUnrevokedGrant() throws Exception {
        Auth worker = register("worker", unique("share-owner"));
        Auth target = register("employer", unique("share-target"));
        UUID credentialId = createCredential(worker, "PRIVATE");
        UUID documentId = uploadCleanPdf(worker, credentialId);

        mvc.perform(get("/api/v1/credential-documents/{id}/download", documentId)
                        .header("Authorization", target.bearer()))
                .andExpect(status().isNotFound());
        MvcResult shareResult = mvc.perform(post("/api/v1/workers/me/credentials/{id}/shares", credentialId)
                        .header("Authorization", worker.bearer()).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("targetUserId", target.id(),
                                "expiresAt", Instant.now().plusSeconds(3600)))))
                .andExpect(status().isCreated()).andReturn();
        UUID shareId = UUID.fromString(json.readTree(shareResult.getResponse().getContentAsString()).get("id").asText());
        mvc.perform(get("/api/v1/credential-documents/{id}/download", documentId)
                        .header("Authorization", target.bearer()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.downloadUrl").isNotEmpty())
                .andExpect(jsonPath("$.expiresAt").isNotEmpty());
        mvc.perform(delete("/api/v1/workers/me/credentials/shares/{id}", shareId)
                        .header("Authorization", worker.bearer())).andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/credential-documents/{id}/download", documentId)
                        .header("Authorization", target.bearer()))
                .andExpect(status().isNotFound());

        jdbc.update("""
                INSERT INTO credential_sharing_grants
                    (id, credential_id, granted_to_user_id, granted_by_user_id, expires_at, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """, UUID.randomUUID(), credentialId, target.id(), worker.id(),
                java.sql.Timestamp.from(Instant.now().minusSeconds(10)),
                java.sql.Timestamp.from(Instant.now().minusSeconds(100)));
        mvc.perform(get("/api/v1/credential-documents/{id}/download", documentId)
                        .header("Authorization", target.bearer())).andExpect(status().isNotFound());
    }

    @Test
    void signatureMismatchAndMalwareAreRejectedBeforeVerification() throws Exception {
        Auth worker = register("worker", unique("invalid-upload"));
        UUID credentialId = createCredential(worker, "PRIVATE");
        UUID mismatched = initiate(worker, credentialId, "proof.pdf", "application/pdf",
                new byte[]{(byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a});
        mvc.perform(post("/api/v1/workers/me/credentials/{credentialId}/documents/{documentId}/complete",
                        credentialId, mismatched).header("Authorization", worker.bearer()))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("CREDENTIAL_FILE_INVALID"));

        byte[] infected = "%PDF-1.7 EICAR-STANDARD-ANTIVIRUS-TEST-FILE".getBytes(StandardCharsets.US_ASCII);
        UUID infectedId = initiate(worker, credentialId, "infected.pdf", "application/pdf", infected);
        mvc.perform(post("/api/v1/workers/me/credentials/{credentialId}/documents/{documentId}/complete",
                        credentialId, infectedId).header("Authorization", worker.bearer()))
                .andExpect(status().isBadRequest());
        assertThat(jdbc.queryForObject(
                "SELECT malware_status FROM credential_document_objects WHERE id = ?", String.class, infectedId))
                .isEqualTo("INFECTED");
        mvc.perform(post("/api/v1/workers/me/credentials/{id}/submit", credentialId)
                        .header("Authorization", worker.bearer()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CREDENTIAL_CLEAN_DOCUMENT_REQUIRED"));
    }

    @Test
    void verificationTransitionsAndVersionConflictsAreDeterministic() throws Exception {
        Auth worker = register("worker", unique("credential-transition"));
        Auth admin = platformAdmin();
        UUID credentialId = createCredential(worker, "PRIVATE");
        mvc.perform(patch("/api/v1/admin/credentials/{id}/verification", credentialId)
                        .header("Authorization", admin.bearer()).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("status", "VERIFIED", "reason", "Illegal jump"))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CREDENTIAL_VERIFICATION_TRANSITION_INVALID"));
        mvc.perform(post("/api/v1/workers/me/credentials/{id}/submit", credentialId)
                        .header("Authorization", worker.bearer()))
                .andExpect(status().isConflict());
    }

    private UUID uploadCleanPdf(Auth worker, UUID credentialId) throws Exception {
        byte[] pdf = "%PDF-1.7 clean credential".getBytes(StandardCharsets.US_ASCII);
        UUID documentId = initiate(worker, credentialId, "proof.pdf", "application/pdf", pdf);
        mvc.perform(post("/api/v1/workers/me/credentials/{credentialId}/documents/{documentId}/complete",
                        credentialId, documentId).header("Authorization", worker.bearer())).andExpect(status().isOk());
        return documentId;
    }

    private UUID initiate(Auth worker, UUID credentialId, String filename, String mime, byte[] bytes) throws Exception {
        MvcResult result = mvc.perform(post("/api/v1/workers/me/credentials/{id}/uploads", credentialId)
                        .header("Authorization", worker.bearer()).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("filename", filename, "contentType", mime,
                                "sizeBytes", bytes.length))))
                .andExpect(status().isCreated()).andReturn();
        UUID documentId = UUID.fromString(json.readTree(result.getResponse().getContentAsString())
                .get("documentId").asText());
        String key = jdbc.queryForObject("SELECT object_key FROM credential_document_objects WHERE id = ?",
                String.class, documentId);
        storage.put(key, bytes);
        return documentId;
    }

    private UUID createCredential(Auth worker, String visibility) throws Exception {
        MvcResult result = mvc.perform(post("/api/v1/workers/me/credentials")
                        .header("Authorization", worker.bearer()).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "credentialType", "LICENSE", "title", "Electrical License",
                                "issuer", "National Licensing Board", "credentialNumber", "PRIVATE-12345",
                                "issuedOn", "2025-01-01", "expiresOn", "2028-01-01", "visibility", visibility))))
                .andExpect(status().isCreated()).andReturn();
        return UUID.fromString(json.readTree(result.getResponse().getContentAsString()).get("id").asText());
    }

    private Auth platformAdmin() throws Exception {
        Auth admin = register("employer", unique("credential-admin"));
        jdbc.update("INSERT INTO user_roles (user_id, role) VALUES (?, 'PLATFORM_ADMIN')", admin.id());
        return login(admin.email());
    }

    private Auth register(String kind, String email) throws Exception {
        MvcResult result = mvc.perform(post("/api/v1/auth/register/" + kind).contentType(MediaType.APPLICATION_JSON)
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
    private record Auth(UUID id, String email, String token) { String bearer() { return "Bearer " + token; } }
}
