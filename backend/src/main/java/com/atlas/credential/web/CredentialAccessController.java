package com.atlas.credential.web;

import com.atlas.credential.application.CredentialService;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class CredentialAccessController {
    private final CredentialService credentials;

    public CredentialAccessController(CredentialService credentials) { this.credentials = credentials; }

    @GetMapping("/credential-documents/{documentId}/download")
    CredentialService.DownloadAuthorization download(@PathVariable UUID documentId, @AuthenticationPrincipal Jwt jwt) {
        return credentials.authorizeDownload(UUID.fromString(jwt.getSubject()), documentId);
    }

    @GetMapping("/public/credentials/{credentialId}")
    CredentialService.PublicCredential publicSummary(@PathVariable UUID credentialId) {
        return credentials.publicSummary(credentialId);
    }
}
