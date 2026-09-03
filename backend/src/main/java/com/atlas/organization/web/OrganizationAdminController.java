package com.atlas.organization.web;

import com.atlas.organization.application.OrganizationService;
import com.atlas.organization.domain.OrganizationVerificationStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.atlas.identity.domain.AtlasPrincipal;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/organizations")
public class OrganizationAdminController {
    private final OrganizationService organizations;

    public OrganizationAdminController(OrganizationService organizations) {
        this.organizations = organizations;
    }

    @PatchMapping("/{organizationId}/verification")
    OrganizationService.OrganizationView transition(@PathVariable UUID organizationId,
                                                     @AuthenticationPrincipal AtlasPrincipal principal,
                                                     @Valid @RequestBody VerificationRequest request) {
        return organizations.transitionVerification(organizationId, principal.requireUserId(),
                request.status(), request.reason());
    }

    public record VerificationRequest(@NotNull OrganizationVerificationStatus status,
                                      @NotBlank @Size(max = 1000) String reason) { }
}
