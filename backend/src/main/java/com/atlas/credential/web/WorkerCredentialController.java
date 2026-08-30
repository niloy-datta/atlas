package com.atlas.credential.web;

import com.atlas.credential.application.CredentialService;
import com.atlas.credential.application.CredentialService.CredentialCommand;
import com.atlas.credential.domain.CredentialType;
import com.atlas.credential.domain.CredentialVisibility;
import com.atlas.credential.infrastructure.CredentialRepository.ShareRow;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/workers/me/credentials")
public class WorkerCredentialController {
    private final CredentialService credentials;

    public WorkerCredentialController(CredentialService credentials) { this.credentials = credentials; }

    @GetMapping
    List<CredentialService.CredentialView> list(@AuthenticationPrincipal Jwt jwt) {
        return credentials.list(userId(jwt));
    }

    @PostMapping
    ResponseEntity<CredentialService.CredentialView> create(@AuthenticationPrincipal Jwt jwt,
                                                            @Valid @RequestBody CredentialRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(credentials.create(userId(jwt), command(request)));
    }

    @GetMapping("/{credentialId}")
    CredentialService.CredentialView get(@PathVariable UUID credentialId, @AuthenticationPrincipal Jwt jwt) {
        return credentials.get(userId(jwt), credentialId);
    }

    @PutMapping("/{credentialId}")
    CredentialService.CredentialView update(@PathVariable UUID credentialId, @AuthenticationPrincipal Jwt jwt,
                                            @Valid @RequestBody CredentialUpdateRequest request) {
        return credentials.update(userId(jwt), credentialId, request.version(), command(request.credential()));
    }

    @DeleteMapping("/{credentialId}")
    ResponseEntity<Void> delete(@PathVariable UUID credentialId, @AuthenticationPrincipal Jwt jwt) {
        credentials.delete(userId(jwt), credentialId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{credentialId}/uploads")
    ResponseEntity<CredentialService.UploadAuthorization> initiateUpload(@PathVariable UUID credentialId,
                                                                         @AuthenticationPrincipal Jwt jwt,
                                                                         @Valid @RequestBody UploadRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(credentials.initiateUpload(userId(jwt), credentialId,
                request.filename(), request.contentType(), request.sizeBytes()));
    }

    @PostMapping("/{credentialId}/documents/{documentId}/complete")
    CredentialService.DocumentView complete(@PathVariable UUID credentialId, @PathVariable UUID documentId,
                                            @AuthenticationPrincipal Jwt jwt) {
        return credentials.completeUpload(userId(jwt), credentialId, documentId);
    }

    @PostMapping("/{credentialId}/submit")
    CredentialService.CredentialView submit(@PathVariable UUID credentialId, @AuthenticationPrincipal Jwt jwt) {
        return credentials.submit(userId(jwt), credentialId);
    }

    @PostMapping("/{credentialId}/shares")
    ResponseEntity<ShareRow> share(@PathVariable UUID credentialId, @AuthenticationPrincipal Jwt jwt,
                                  @Valid @RequestBody ShareRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(credentials.grant(userId(jwt), credentialId, request.targetUserId(), request.expiresAt()));
    }

    @DeleteMapping("/shares/{shareId}")
    ResponseEntity<Void> revokeShare(@PathVariable UUID shareId, @AuthenticationPrincipal Jwt jwt) {
        credentials.revokeShare(userId(jwt), shareId);
        return ResponseEntity.noContent().build();
    }

    private static CredentialCommand command(CredentialRequest request) {
        return new CredentialCommand(request.credentialType(), request.title(), request.issuer(),
                request.credentialNumber(), request.issuedOn(), request.expiresOn(), request.visibility());
    }
    private static UUID userId(Jwt jwt) { return UUID.fromString(jwt.getSubject()); }

    public record CredentialRequest(@NotNull CredentialType credentialType, @NotBlank @Size(max = 160) String title,
                                    @NotBlank @Size(max = 160) String issuer,
                                    @Size(max = 160) String credentialNumber, LocalDate issuedOn, LocalDate expiresOn,
                                    @NotNull CredentialVisibility visibility) { }
    public record CredentialUpdateRequest(@Min(0) long version, @Valid @NotNull CredentialRequest credential) { }
    public record UploadRequest(@NotBlank @Size(max = 240) String filename,
                                @NotBlank @Size(max = 100) String contentType, @Min(1) long sizeBytes) { }
    public record ShareRequest(@NotNull UUID targetUserId, @NotNull @Future Instant expiresAt) { }
}
