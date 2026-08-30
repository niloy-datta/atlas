package com.atlas.credential.web;

import com.atlas.credential.application.CredentialService;
import com.atlas.credential.domain.CredentialVerificationStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/credentials")
public class CredentialAdminController {
    private final CredentialService credentials;

    public CredentialAdminController(CredentialService credentials) { this.credentials = credentials; }

    @PatchMapping("/{credentialId}/verification")
    CredentialService.CredentialView transition(@PathVariable UUID credentialId, @AuthenticationPrincipal Jwt jwt,
                                                @Valid @RequestBody VerificationRequest request) {
        return credentials.transition(UUID.fromString(jwt.getSubject()), credentialId, request.status(), request.reason());
    }

    public record VerificationRequest(@NotNull CredentialVerificationStatus status,
                                      @NotBlank @Size(max = 1000) String reason) { }
}
