package com.atlas.credential.application;

import com.atlas.credential.config.CredentialStorageProperties;
import com.atlas.credential.domain.CredentialType;
import com.atlas.credential.domain.CredentialVerificationStatus;
import com.atlas.credential.domain.CredentialVisibility;
import com.atlas.credential.infrastructure.CredentialRepository;
import com.atlas.credential.infrastructure.CredentialRepository.CredentialRow;
import com.atlas.credential.infrastructure.CredentialRepository.DocumentRow;
import com.atlas.credential.infrastructure.CredentialRepository.ShareRow;
import com.atlas.credential.storage.CredentialStorage;
import com.atlas.credential.storage.CredentialStorageException;
import com.atlas.identity.application.IdentityReadService;
import com.atlas.shared.error.ApiProblemException;
import java.net.URI;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CredentialService {
    private final CredentialRepository credentials;
    private final CredentialStorage storage;
    private final CredentialStorageProperties properties;
    private final MalwareScanner malwareScanner;
    private final IdentityReadService identities;
    private final Clock clock;

    public CredentialService(CredentialRepository credentials, CredentialStorage storage,
                             CredentialStorageProperties properties, MalwareScanner malwareScanner,
                             IdentityReadService identities, Clock clock) {
        this.credentials = credentials;
        this.storage = storage;
        this.properties = properties;
        this.malwareScanner = malwareScanner;
        this.identities = identities;
        this.clock = clock;
    }

    @Transactional
    public CredentialView create(UUID workerId, CredentialCommand command) {
        validateDates(command.issuedOn(), command.expiresOn());
        return view(credentials.create(workerId, command.credentialType(), clean(command.title()),
                clean(command.issuer()), clean(command.credentialNumber()), command.issuedOn(), command.expiresOn(),
                command.visibility(), Instant.now(clock)));
    }

    @Transactional(readOnly = true)
    public List<CredentialView> list(UUID workerId) {
        return credentials.list(workerId).stream().map(this::view).toList();
    }

    @Transactional(readOnly = true)
    public CredentialView get(UUID workerId, UUID credentialId) {
        return view(requireOwned(credentialId, workerId));
    }

    @Transactional
    public CredentialView update(UUID workerId, UUID credentialId, long version, CredentialCommand command) {
        CredentialRow current = requireOwned(credentialId, workerId);
        validateDates(command.issuedOn(), command.expiresOn());
        Instant now = Instant.now(clock);
        if (credentials.update(credentialId, workerId, version, command.credentialType(), clean(command.title()),
                clean(command.issuer()), clean(command.credentialNumber()), command.issuedOn(), command.expiresOn(),
                command.visibility(), now) == 0) throw versionConflict();
        if (current.verificationStatus() != CredentialVerificationStatus.UNVERIFIED) {
            credentials.addHistory(credentialId, current.verificationStatus(), CredentialVerificationStatus.UNVERIFIED,
                    workerId, "Worker updated credential metadata", now);
        }
        return view(requireOwned(credentialId, workerId));
    }

    @Transactional
    public void delete(UUID workerId, UUID credentialId) {
        CredentialRow row = requireOwned(credentialId, workerId);
        if (row.verificationStatus() == CredentialVerificationStatus.VERIFIED) {
            throw conflict("VERIFIED_CREDENTIAL_REMOVAL_DENIED", "Verified credential cannot be removed",
                    "Request platform revocation before deleting a verified credential.");
        }
        List<DocumentRow> documents = credentials.documents(credentialId);
        for (DocumentRow document : documents) safeDelete(document.objectKey());
        credentials.delete(credentialId, workerId);
    }

    @Transactional
    public UploadAuthorization initiateUpload(UUID workerId, UUID credentialId, String filename,
                                              String contentType, long sizeBytes) {
        requireOwned(credentialId, workerId);
        String normalizedMime = contentType.trim().toLowerCase(Locale.ROOT);
        FileSignaturePolicy.validateDeclaration(filename, normalizedMime);
        if (sizeBytes <= 0 || sizeBytes > properties.maximumFileSize().toBytes()) {
            throw new ApiProblemException(HttpStatus.BAD_REQUEST, "CREDENTIAL_FILE_SIZE_INVALID",
                    "Credential file rejected", "The file size exceeds the configured credential limit.");
        }
        Instant now = Instant.now(clock);
        Instant expiresAt = now.plus(properties.signedUrlTtl());
        String objectKey = "credentials/" + UUID.randomUUID();
        URI url = storageCall(() -> storage.createUploadUrl(objectKey, normalizedMime, properties.signedUrlTtl()));
        DocumentRow document = credentials.initiateDocument(credentialId, objectKey, clean(filename), normalizedMime,
                sizeBytes, expiresAt, now);
        return new UploadAuthorization(document.id(), url, expiresAt, normalizedMime, sizeBytes);
    }

    @Transactional(noRollbackFor = ApiProblemException.class)
    public DocumentView completeUpload(UUID workerId, UUID credentialId, UUID documentId) {
        requireOwned(credentialId, workerId);
        DocumentRow document = credentials.findDocumentForUpdate(documentId)
                .filter(found -> found.credentialId().equals(credentialId)).orElseThrow(CredentialService::documentNotFound);
        Instant now = Instant.now(clock);
        if (!"INITIATED".equals(document.uploadStatus()) || !document.uploadExpiresAt().isAfter(now)) {
            throw conflict("CREDENTIAL_UPLOAD_EXPIRED", "Credential upload unavailable",
                    "The upload authorization is expired or already completed.");
        }
        CredentialStorage.StoredObject stored = storageCall(() -> storage.inspect(document.objectKey(), 2048));
        try {
            if (stored.sizeBytes() != document.declaredSizeBytes()
                    || stored.sizeBytes() > properties.maximumFileSize().toBytes()) {
                reject(document, null, "ERROR", now);
                throw invalidFile("The uploaded object size does not match the declared size.");
            }
            String detected = FileSignaturePolicy.detect(stored.prefix());
            if (!detected.equals(document.declaredMimeType())) {
                reject(document, detected, "ERROR", now);
                throw invalidFile("The uploaded file signature does not match its declared type.");
            }
            MalwareScanner.ScanResult scan = malwareScanner.scan(stored.prefix());
            if (scan == MalwareScanner.ScanResult.INFECTED) {
                reject(document, detected, "INFECTED", now);
                throw invalidFile("The uploaded file failed malware screening.");
            }
            credentials.completeDocument(document.id(), stored.sizeBytes(), detected, "CLEAN", true, now);
            return documentView(credentials.findDocument(document.id()).orElseThrow(CredentialService::documentNotFound));
        } catch (ApiProblemException exception) {
            safeDelete(document.objectKey());
            throw exception;
        }
    }

    @Transactional
    public CredentialView submit(UUID workerId, UUID credentialId) {
        CredentialRow current = credentials.findForUpdate(credentialId)
                .filter(row -> row.workerUserId().equals(workerId)).orElseThrow(CredentialService::credentialNotFound);
        current.verificationStatus().requireSubmission();
        if (credentials.cleanDocumentCount(credentialId) == 0) {
            throw conflict("CREDENTIAL_CLEAN_DOCUMENT_REQUIRED", "Clean credential document required",
                    "At least one completed, clean document is required before verification.");
        }
        Instant now = Instant.now(clock);
        credentials.updateStatus(credentialId, CredentialVerificationStatus.PENDING, now);
        credentials.addHistory(credentialId, current.verificationStatus(), CredentialVerificationStatus.PENDING,
                workerId, "Worker submitted credential for verification", now);
        return view(requireOwned(credentialId, workerId));
    }

    @Transactional
    public CredentialView transition(UUID adminId, UUID credentialId, CredentialVerificationStatus target,
                                     String reason) {
        CredentialRow current = credentials.findForUpdate(credentialId).orElseThrow(CredentialService::credentialNotFound);
        current.verificationStatus().requireAdminTransitionTo(target);
        if (target == CredentialVerificationStatus.VERIFIED && credentials.cleanDocumentCount(credentialId) == 0) {
            throw conflict("CREDENTIAL_CLEAN_DOCUMENT_REQUIRED", "Clean credential document required",
                    "A clean document is required for credential verification.");
        }
        Instant now = Instant.now(clock);
        credentials.updateStatus(credentialId, target, now);
        credentials.addHistory(credentialId, current.verificationStatus(), target, adminId, clean(reason), now);
        return view(credentials.find(credentialId).orElseThrow(CredentialService::credentialNotFound));
    }

    @Transactional
    public ShareRow grant(UUID workerId, UUID credentialId, UUID targetUserId, Instant expiresAt) {
        requireOwned(credentialId, workerId);
        if (workerId.equals(targetUserId)) throw shareInvalid();
        identities.require(targetUserId);
        Instant now = Instant.now(clock);
        if (!expiresAt.isAfter(now) || expiresAt.isAfter(now.plusSeconds(30L * 24 * 3600))) throw shareInvalid();
        try {
            return credentials.grant(credentialId, targetUserId, workerId, expiresAt, now);
        } catch (DataIntegrityViolationException exception) {
            throw conflict("CREDENTIAL_SHARE_CONFLICT", "Credential share conflict",
                    "An active share already exists for this account.");
        }
    }

    @Transactional
    public void revokeShare(UUID workerId, UUID shareId) {
        if (credentials.revokeShare(shareId, workerId, Instant.now(clock)) == 0) {
            throw new ApiProblemException(HttpStatus.NOT_FOUND, "CREDENTIAL_SHARE_NOT_FOUND",
                    "Credential share not found", "The credential share does not exist or is not accessible.");
        }
    }

    @Transactional(readOnly = true)
    public DownloadAuthorization authorizeDownload(UUID actorId, UUID documentId) {
        Instant now = Instant.now(clock);
        if (!credentials.canDownload(documentId, actorId, now)) throw documentNotFound();
        DocumentRow document = credentials.findDocument(documentId).orElseThrow(CredentialService::documentNotFound);
        URI url = storageCall(() -> storage.createDownloadUrl(document.objectKey(), properties.signedUrlTtl()));
        return new DownloadAuthorization(url, now.plus(properties.signedUrlTtl()), document.originalFilename(),
                document.detectedMimeType());
    }

    @Transactional(readOnly = true)
    public PublicCredential publicSummary(UUID credentialId) {
        CredentialRow row = credentials.publicSummary(credentialId).orElseThrow(CredentialService::credentialNotFound);
        return new PublicCredential(row.id(), row.credentialType(), row.title(), row.issuer(), row.issuedOn(),
                row.expiresOn(), row.verificationStatus());
    }

    private CredentialView view(CredentialRow row) {
        return new CredentialView(row.id(), row.credentialType(), row.title(), row.issuer(), row.credentialNumber(),
                row.issuedOn(), row.expiresOn(), row.visibility(), row.verificationStatus(), row.version(),
                credentials.documents(row.id()).stream().map(CredentialService::documentView).toList(),
                row.createdAt(), row.updatedAt());
    }

    private static DocumentView documentView(DocumentRow row) {
        return new DocumentView(row.id(), row.originalFilename(), row.declaredMimeType(), row.detectedMimeType(),
                row.actualSizeBytes(), row.uploadStatus(), row.malwareStatus(), row.createdAt(), row.completedAt());
    }

    private CredentialRow requireOwned(UUID credentialId, UUID workerId) {
        return credentials.find(credentialId).filter(row -> row.workerUserId().equals(workerId))
                .orElseThrow(CredentialService::credentialNotFound);
    }

    private void reject(DocumentRow document, String detectedMime, String malwareStatus, Instant now) {
        credentials.completeDocument(document.id(), document.declaredSizeBytes(), detectedMime, malwareStatus, false, now);
    }

    private void safeDelete(String objectKey) {
        try { storage.delete(objectKey); } catch (CredentialStorageException ignored) { }
    }

    private static void validateDates(LocalDate issued, LocalDate expires) {
        if (issued != null && expires != null && expires.isBefore(issued)) {
            throw new ApiProblemException(HttpStatus.BAD_REQUEST, "CREDENTIAL_DATE_INVALID",
                    "Credential dates invalid", "The expiry date cannot precede the issue date.");
        }
    }

    private static String clean(String value) {
        if (value == null) return null;
        String result = value.trim();
        return result.isEmpty() ? null : result;
    }

    private <T> T storageCall(StorageSupplier<T> supplier) {
        try { return supplier.get(); }
        catch (CredentialStorageException exception) {
            throw new ApiProblemException(HttpStatus.SERVICE_UNAVAILABLE, "CREDENTIAL_STORAGE_UNAVAILABLE",
                    "Credential storage unavailable", "Credential storage is temporarily unavailable.");
        }
    }

    private static ApiProblemException invalidFile(String detail) {
        return new ApiProblemException(HttpStatus.BAD_REQUEST, "CREDENTIAL_FILE_INVALID", "Credential file rejected", detail);
    }
    private static ApiProblemException credentialNotFound() {
        return new ApiProblemException(HttpStatus.NOT_FOUND, "CREDENTIAL_NOT_FOUND", "Credential not found",
                "The credential does not exist or is not accessible.");
    }
    private static ApiProblemException documentNotFound() {
        return new ApiProblemException(HttpStatus.NOT_FOUND, "CREDENTIAL_DOCUMENT_NOT_FOUND",
                "Credential document not found", "The credential document does not exist or is not accessible.");
    }
    private static ApiProblemException shareInvalid() {
        return new ApiProblemException(HttpStatus.BAD_REQUEST, "CREDENTIAL_SHARE_INVALID", "Credential share invalid",
                "The credential sharing target or expiry is invalid.");
    }
    private static ApiProblemException versionConflict() {
        return conflict("CREDENTIAL_VERSION_CONFLICT", "Credential update conflict",
                "The credential changed since it was read.");
    }
    private static ApiProblemException conflict(String code, String title, String detail) {
        return new ApiProblemException(HttpStatus.CONFLICT, code, title, detail);
    }

    @FunctionalInterface private interface StorageSupplier<T> { T get(); }

    public record CredentialCommand(CredentialType credentialType, String title, String issuer,
                                    String credentialNumber, LocalDate issuedOn, LocalDate expiresOn,
                                    CredentialVisibility visibility) { }
    public record CredentialView(UUID id, CredentialType credentialType, String title, String issuer,
                                 String credentialNumber, LocalDate issuedOn, LocalDate expiresOn,
                                 CredentialVisibility visibility, CredentialVerificationStatus verificationStatus,
                                 long version, List<DocumentView> documents, Instant createdAt, Instant updatedAt) { }
    public record DocumentView(UUID id, String originalFilename, String declaredMimeType, String detectedMimeType,
                               Long sizeBytes, String uploadStatus, String malwareStatus,
                               Instant createdAt, Instant completedAt) { }
    public record UploadAuthorization(UUID documentId, URI uploadUrl, Instant expiresAt,
                                      String requiredContentType, long requiredSizeBytes) { }
    public record DownloadAuthorization(URI downloadUrl, Instant expiresAt, String filename, String contentType) { }
    public record PublicCredential(UUID id, CredentialType credentialType, String title, String issuer,
                                   LocalDate issuedOn, LocalDate expiresOn,
                                   CredentialVerificationStatus verificationStatus) { }
}
