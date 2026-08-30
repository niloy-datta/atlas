package com.atlas.credential.infrastructure;

import com.atlas.credential.domain.CredentialType;
import com.atlas.credential.domain.CredentialVerificationStatus;
import com.atlas.credential.domain.CredentialVisibility;
import java.sql.Date;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class CredentialRepository {
    private final JdbcTemplate jdbc;

    public CredentialRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public CredentialRow create(UUID workerId, CredentialType type, String title, String issuer, String number,
                                LocalDate issuedOn, LocalDate expiresOn, CredentialVisibility visibility, Instant now) {
        CredentialRow row = new CredentialRow(UUID.randomUUID(), workerId, type, title, issuer, number, issuedOn,
                expiresOn, visibility, CredentialVerificationStatus.UNVERIFIED, 0, now, now);
        jdbc.update("""
                INSERT INTO credentials
                    (id, worker_user_id, credential_type, title, issuer, credential_number, issued_on, expires_on,
                     visibility, verification_status, version, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'UNVERIFIED', 0, ?, ?)
                """, row.id(), workerId, type.name(), title, issuer, number, date(issuedOn), date(expiresOn),
                visibility.name(), Timestamp.from(now), Timestamp.from(now));
        addHistory(row.id(), null, CredentialVerificationStatus.UNVERIFIED, workerId, "Worker created credential", now);
        return row;
    }

    public List<CredentialRow> list(UUID workerId) {
        return jdbc.query(credentialSelect() + " WHERE worker_user_id = ? ORDER BY created_at, id",
                (rs, n) -> credential(rs), workerId);
    }

    public Optional<CredentialRow> find(UUID credentialId) {
        return jdbc.query(credentialSelect() + " WHERE id = ?", (rs, n) -> credential(rs), credentialId)
                .stream().findFirst();
    }

    public Optional<CredentialRow> findForUpdate(UUID credentialId) {
        return jdbc.query(credentialSelect() + " WHERE id = ? FOR UPDATE", (rs, n) -> credential(rs), credentialId)
                .stream().findFirst();
    }

    public int update(UUID credentialId, UUID workerId, long version, CredentialType type, String title,
                      String issuer, String number, LocalDate issuedOn, LocalDate expiresOn,
                      CredentialVisibility visibility, Instant now) {
        return jdbc.update("""
                UPDATE credentials SET credential_type = ?, title = ?, issuer = ?, credential_number = ?,
                       issued_on = ?, expires_on = ?, visibility = ?, verification_status = 'UNVERIFIED',
                       version = version + 1, updated_at = ?
                 WHERE id = ? AND worker_user_id = ? AND version = ?
                """, type.name(), title, issuer, number, date(issuedOn), date(expiresOn), visibility.name(),
                Timestamp.from(now), credentialId, workerId, version);
    }

    public int delete(UUID credentialId, UUID workerId) {
        return jdbc.update("DELETE FROM credentials WHERE id = ? AND worker_user_id = ?", credentialId, workerId);
    }

    public DocumentRow initiateDocument(UUID credentialId, String objectKey, String filename, String mimeType,
                                        long size, Instant expiresAt, Instant now) {
        DocumentRow row = new DocumentRow(UUID.randomUUID(), credentialId, objectKey, filename, mimeType, null,
                size, null, "INITIATED", "PENDING", expiresAt, now, null);
        jdbc.update("""
                INSERT INTO credential_document_objects
                    (id, credential_id, object_key, original_filename, declared_mime_type, declared_size_bytes,
                     upload_status, malware_status, upload_expires_at, created_at)
                VALUES (?, ?, ?, ?, ?, ?, 'INITIATED', 'PENDING', ?, ?)
                """, row.id(), credentialId, objectKey, filename, mimeType, size,
                Timestamp.from(expiresAt), Timestamp.from(now));
        return row;
    }

    public List<DocumentRow> documents(UUID credentialId) {
        return jdbc.query(documentSelect() + " WHERE credential_id = ? ORDER BY created_at, id",
                (rs, n) -> document(rs), credentialId);
    }

    public Optional<DocumentRow> findDocumentForUpdate(UUID documentId) {
        return jdbc.query(documentSelect() + " WHERE id = ? FOR UPDATE", (rs, n) -> document(rs), documentId)
                .stream().findFirst();
    }

    public Optional<DocumentRow> findDocument(UUID documentId) {
        return jdbc.query(documentSelect() + " WHERE id = ?", (rs, n) -> document(rs), documentId)
                .stream().findFirst();
    }

    public void completeDocument(UUID documentId, long actualSize, String detectedMime, String malwareStatus,
                                 boolean accepted, Instant now) {
        jdbc.update("""
                UPDATE credential_document_objects
                   SET actual_size_bytes = ?, detected_mime_type = ?, malware_status = ?, upload_status = ?,
                       completed_at = ? WHERE id = ?
                """, actualSize, detectedMime, malwareStatus, accepted ? "UPLOADED" : "REJECTED",
                Timestamp.from(now), documentId);
    }

    public int cleanDocumentCount(UUID credentialId) {
        return jdbc.queryForObject("""
                SELECT count(*) FROM credential_document_objects
                 WHERE credential_id = ? AND upload_status = 'UPLOADED' AND malware_status = 'CLEAN'
                """, Integer.class, credentialId);
    }

    public void updateStatus(UUID credentialId, CredentialVerificationStatus status, Instant now) {
        jdbc.update("""
                UPDATE credentials SET verification_status = ?, version = version + 1, updated_at = ? WHERE id = ?
                """, status.name(), Timestamp.from(now), credentialId);
    }

    public void addHistory(UUID credentialId, CredentialVerificationStatus from,
                           CredentialVerificationStatus to, UUID actorId, String reason, Instant now) {
        jdbc.update("""
                INSERT INTO credential_verification_history
                    (id, credential_id, from_status, to_status, actor_user_id, reason, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """, UUID.randomUUID(), credentialId, from == null ? null : from.name(), to.name(), actorId,
                reason, Timestamp.from(now));
    }

    public ShareRow grant(UUID credentialId, UUID targetId, UUID actorId, Instant expiresAt, Instant now) {
        ShareRow row = new ShareRow(UUID.randomUUID(), credentialId, targetId, expiresAt, null, now);
        jdbc.update("""
                INSERT INTO credential_sharing_grants
                    (id, credential_id, granted_to_user_id, granted_by_user_id, expires_at, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """, row.id(), credentialId, targetId, actorId, Timestamp.from(expiresAt), Timestamp.from(now));
        return row;
    }

    public int revokeShare(UUID shareId, UUID workerId, Instant now) {
        return jdbc.update("""
                UPDATE credential_sharing_grants g SET revoked_at = ?
                 FROM credentials c
                 WHERE g.id = ? AND g.credential_id = c.id AND c.worker_user_id = ? AND g.revoked_at IS NULL
                """, Timestamp.from(now), shareId, workerId);
    }

    public boolean canDownload(UUID documentId, UUID actorId, Instant now) {
        return Boolean.TRUE.equals(jdbc.queryForObject("""
                SELECT EXISTS (
                    SELECT 1 FROM credential_document_objects d
                    JOIN credentials c ON c.id = d.credential_id
                    WHERE d.id = ? AND d.upload_status = 'UPLOADED' AND d.malware_status = 'CLEAN'
                      AND (c.worker_user_id = ? OR EXISTS (
                          SELECT 1 FROM credential_sharing_grants g
                           WHERE g.credential_id = c.id AND g.granted_to_user_id = ?
                             AND g.revoked_at IS NULL AND g.expires_at > ?
                      ))
                )
                """, Boolean.class, documentId, actorId, actorId, Timestamp.from(now)));
    }

    public Optional<CredentialRow> publicSummary(UUID credentialId) {
        return jdbc.query(credentialSelect() + """
                 WHERE id = ? AND visibility = 'PUBLIC_SUMMARY' AND verification_status = 'VERIFIED'
                """, (rs, n) -> credential(rs), credentialId).stream().findFirst();
    }

    private static String credentialSelect() {
        return """
                SELECT id, worker_user_id, credential_type, title, issuer, credential_number, issued_on, expires_on,
                       visibility, verification_status, version, created_at, updated_at FROM credentials
                """;
    }

    private static String documentSelect() {
        return """
                SELECT id, credential_id, object_key, original_filename, declared_mime_type, detected_mime_type,
                       declared_size_bytes, actual_size_bytes, upload_status, malware_status, upload_expires_at,
                       created_at, completed_at FROM credential_document_objects
                """;
    }

    private static CredentialRow credential(java.sql.ResultSet rs) throws java.sql.SQLException {
        return new CredentialRow(rs.getObject("id", UUID.class), rs.getObject("worker_user_id", UUID.class),
                CredentialType.valueOf(rs.getString("credential_type")), rs.getString("title"), rs.getString("issuer"),
                rs.getString("credential_number"), localDate(rs.getDate("issued_on")), localDate(rs.getDate("expires_on")),
                CredentialVisibility.valueOf(rs.getString("visibility")),
                CredentialVerificationStatus.valueOf(rs.getString("verification_status")), rs.getLong("version"),
                rs.getTimestamp("created_at").toInstant(), rs.getTimestamp("updated_at").toInstant());
    }

    private static DocumentRow document(java.sql.ResultSet rs) throws java.sql.SQLException {
        return new DocumentRow(rs.getObject("id", UUID.class), rs.getObject("credential_id", UUID.class),
                rs.getString("object_key"), rs.getString("original_filename"), rs.getString("declared_mime_type"),
                rs.getString("detected_mime_type"), rs.getLong("declared_size_bytes"),
                rs.getObject("actual_size_bytes", Long.class), rs.getString("upload_status"),
                rs.getString("malware_status"), rs.getTimestamp("upload_expires_at").toInstant(),
                rs.getTimestamp("created_at").toInstant(),
                rs.getTimestamp("completed_at") == null ? null : rs.getTimestamp("completed_at").toInstant());
    }

    private static Date date(LocalDate value) { return value == null ? null : Date.valueOf(value); }
    private static LocalDate localDate(Date value) { return value == null ? null : value.toLocalDate(); }

    public record CredentialRow(UUID id, UUID workerUserId, CredentialType credentialType, String title,
                                String issuer, String credentialNumber, LocalDate issuedOn, LocalDate expiresOn,
                                CredentialVisibility visibility, CredentialVerificationStatus verificationStatus,
                                long version, Instant createdAt, Instant updatedAt) { }
    public record DocumentRow(UUID id, UUID credentialId, String objectKey, String originalFilename,
                              String declaredMimeType, String detectedMimeType, long declaredSizeBytes,
                              Long actualSizeBytes, String uploadStatus, String malwareStatus,
                              Instant uploadExpiresAt, Instant createdAt, Instant completedAt) { }
    public record ShareRow(UUID id, UUID credentialId, UUID grantedToUserId, Instant expiresAt,
                           Instant revokedAt, Instant createdAt) { }
}
