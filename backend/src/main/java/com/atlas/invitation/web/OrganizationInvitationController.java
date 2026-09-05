package com.atlas.invitation.web;

import com.atlas.identity.domain.AtlasPrincipal;
import com.atlas.invitation.application.InvitationService;
import com.atlas.invitation.domain.CreateInvitationCommand;
import com.atlas.invitation.domain.InvitationDetailView;
import com.atlas.invitation.domain.InvitationStatus;
import com.atlas.invitation.domain.InvitationSummaryView;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/organizations/{organizationId}")
public class OrganizationInvitationController {
    private final InvitationService invitationService;

    public OrganizationInvitationController(InvitationService invitationService) {
        this.invitationService = invitationService;
    }

    public record CreateInvitationRequest(
            @NotNull UUID workerId,
            @PositiveOrZero Long offeredRatePence,
            @Size(max = 2000) String message,
            Instant expiresAt
    ) {
        public CreateInvitationCommand toCommand() {
            return new CreateInvitationCommand(workerId, offeredRatePence, message, expiresAt);
        }
    }

    public record CancelRequest(long version) {}

    @GetMapping("/invitations")
    public ResponseEntity<List<InvitationSummaryView>> getInvitations(
            @PathVariable UUID organizationId,
            @RequestParam(required = false) InvitationStatus status,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(defaultValue = "0") int offset,
            @AuthenticationPrincipal AtlasPrincipal principal
    ) {
        List<InvitationSummaryView> invitations = invitationService.getOrganizationInvitations(
                organizationId, status, principal.requireUserId(), limit, offset);
        return ResponseEntity.ok(invitations);
    }

    @PostMapping("/jobs/{jobId}/invitations")
    public ResponseEntity<InvitationDetailView> inviteToJob(
            @PathVariable UUID organizationId,
            @PathVariable UUID jobId,
            @Valid @RequestBody CreateInvitationRequest request,
            @AuthenticationPrincipal AtlasPrincipal principal
    ) {
        InvitationDetailView detail = invitationService.createJobInvitation(
                organizationId, jobId, principal.requireUserId(), request.toCommand());
        return ResponseEntity.status(HttpStatus.CREATED).body(detail);
    }

    @PostMapping("/shifts/{shiftId}/invitations")
    public ResponseEntity<InvitationDetailView> inviteToShift(
            @PathVariable UUID organizationId,
            @PathVariable UUID shiftId,
            @Valid @RequestBody CreateInvitationRequest request,
            @AuthenticationPrincipal AtlasPrincipal principal
    ) {
        InvitationDetailView detail = invitationService.createShiftInvitation(
                organizationId, shiftId, principal.requireUserId(), request.toCommand());
        return ResponseEntity.status(HttpStatus.CREATED).body(detail);
    }

    @PostMapping("/invitations/{invitationId}/cancel")
    public ResponseEntity<InvitationDetailView> cancelInvitation(
            @PathVariable UUID organizationId,
            @PathVariable UUID invitationId,
            @RequestBody(required = false) CancelRequest request,
            @AuthenticationPrincipal AtlasPrincipal principal
    ) {
        long version = request != null ? request.version() : 0L;
        InvitationDetailView detail = invitationService.cancelByEmployer(
                organizationId, invitationId, principal.requireUserId(), version);
        return ResponseEntity.ok(detail);
    }
}
