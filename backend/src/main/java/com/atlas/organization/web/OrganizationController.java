package com.atlas.organization.web;

import com.atlas.organization.application.OrganizationService;
import com.atlas.organization.application.OrganizationService.LocationCommand;
import com.atlas.organization.domain.OrganizationRole;
import com.atlas.organization.infrastructure.OrganizationRepository.InvitationRow;
import com.atlas.organization.infrastructure.OrganizationRepository.LocationRow;
import com.atlas.organization.infrastructure.OrganizationRepository.MemberRow;
import com.atlas.organization.infrastructure.OrganizationRepository.OrganizationSummary;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
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
@RequestMapping("/api/v1/organizations")
public class OrganizationController {
    private final OrganizationService organizations;

    public OrganizationController(OrganizationService organizations) {
        this.organizations = organizations;
    }

    @PostMapping
    ResponseEntity<OrganizationService.OrganizationView> create(@AuthenticationPrincipal Jwt jwt,
                                                                 @Valid @RequestBody OrganizationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(organizations.create(userId(jwt), request.name(),
                request.slug(), request.description()));
    }

    @GetMapping
    List<OrganizationSummary> list(@AuthenticationPrincipal Jwt jwt) {
        return organizations.list(userId(jwt));
    }

    @GetMapping("/{organizationId}")
    OrganizationService.OrganizationView get(@PathVariable UUID organizationId, @AuthenticationPrincipal Jwt jwt) {
        return organizations.get(organizationId, userId(jwt));
    }

    @PutMapping("/{organizationId}")
    OrganizationService.OrganizationView update(@PathVariable UUID organizationId, @AuthenticationPrincipal Jwt jwt,
                                                @Valid @RequestBody OrganizationUpdateRequest request) {
        return organizations.update(organizationId, userId(jwt), request.version(), request.name(), request.slug(),
                request.description());
    }

    @GetMapping("/{organizationId}/members")
    List<MemberRow> members(@PathVariable UUID organizationId, @AuthenticationPrincipal Jwt jwt) {
        return organizations.members(organizationId, userId(jwt));
    }

    @PatchMapping("/{organizationId}/members/{memberId}/role")
    List<MemberRow> changeRole(@PathVariable UUID organizationId, @PathVariable UUID memberId,
                               @AuthenticationPrincipal Jwt jwt, @Valid @RequestBody RoleRequest request) {
        return organizations.changeRole(organizationId, userId(jwt), memberId, request.role());
    }

    @DeleteMapping("/{organizationId}/members/{memberId}")
    ResponseEntity<Void> removeMember(@PathVariable UUID organizationId, @PathVariable UUID memberId,
                                      @AuthenticationPrincipal Jwt jwt) {
        organizations.removeMember(organizationId, userId(jwt), memberId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{organizationId}/invitations")
    ResponseEntity<InvitationRow> invite(@PathVariable UUID organizationId, @AuthenticationPrincipal Jwt jwt,
                                         @Valid @RequestBody InvitationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(organizations.invite(organizationId, userId(jwt), request.email(), request.role()));
    }

    @PostMapping("/invitations/{invitationId}/accept")
    OrganizationService.OrganizationView accept(@PathVariable UUID invitationId, @AuthenticationPrincipal Jwt jwt) {
        return organizations.acceptInvitation(invitationId, userId(jwt));
    }

    @PostMapping("/{organizationId}/locations")
    ResponseEntity<LocationRow> createLocation(@PathVariable UUID organizationId, @AuthenticationPrincipal Jwt jwt,
                                               @Valid @RequestBody LocationRequest request) {
        LocationCommand command = new LocationCommand(request.name(), request.latitude(), request.longitude(),
                request.addressLine(), request.city(), request.region(), request.countryCode());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(organizations.createLocation(organizationId, userId(jwt), command));
    }

    @GetMapping("/{organizationId}/locations")
    List<LocationRow> locations(@PathVariable UUID organizationId, @AuthenticationPrincipal Jwt jwt) {
        return organizations.locations(organizationId, userId(jwt));
    }

    @PostMapping("/{organizationId}/verification-request")
    OrganizationService.OrganizationView requestVerification(@PathVariable UUID organizationId,
                                                              @AuthenticationPrincipal Jwt jwt) {
        return organizations.requestVerification(organizationId, userId(jwt));
    }

    private static UUID userId(Jwt jwt) { return UUID.fromString(jwt.getSubject()); }

    public record OrganizationRequest(
            @NotBlank @Size(max = 160) String name,
            @NotBlank @Pattern(regexp = "^[A-Za-z0-9][A-Za-z0-9-]{1,78}[A-Za-z0-9]$") String slug,
            @Size(max = 2000) String description) { }
    public record OrganizationUpdateRequest(
            @Min(0) long version,
            @NotBlank @Size(max = 160) String name,
            @NotBlank @Pattern(regexp = "^[A-Za-z0-9][A-Za-z0-9-]{1,78}[A-Za-z0-9]$") String slug,
            @Size(max = 2000) String description) { }
    public record RoleRequest(@NotNull OrganizationRole role) { }
    public record InvitationRequest(@NotBlank @Email @Size(max = 320) String email,
                                    @NotNull OrganizationRole role) { }
    public record LocationRequest(
            @NotBlank @Size(max = 120) String name,
            @DecimalMin("-90.0") @DecimalMax("90.0") double latitude,
            @DecimalMin("-180.0") @DecimalMax("180.0") double longitude,
            @Size(max = 240) String addressLine,
            @Size(max = 120) String city,
            @Size(max = 120) String region,
            @NotBlank @Pattern(regexp = "^[A-Za-z]{2}$") String countryCode) { }
}
