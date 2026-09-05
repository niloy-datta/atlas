package com.atlas.invitation.web;

import com.atlas.identity.domain.AtlasPrincipal;
import com.atlas.invitation.application.InvitationService;
import com.atlas.invitation.domain.InvitationDetailView;
import com.atlas.invitation.domain.InvitationSummaryView;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class WorkerInvitationController {
    private final InvitationService invitationService;

    public WorkerInvitationController(InvitationService invitationService) {
        this.invitationService = invitationService;
    }

    public record ActionRequest(long version) {}

    @GetMapping("/api/v1/workers/me/invitations")
    public ResponseEntity<List<InvitationSummaryView>> getMyInvitations(
            @AuthenticationPrincipal AtlasPrincipal principal,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(defaultValue = "0") int offset
    ) {
        List<InvitationSummaryView> invitations = invitationService.getWorkerInvitations(
                principal.requireUserId(), limit, offset);
        return ResponseEntity.ok(invitations);
    }

    @GetMapping("/api/v1/invitations/{invitationId}")
    public ResponseEntity<InvitationDetailView> getInvitation(
            @PathVariable UUID invitationId,
            @AuthenticationPrincipal AtlasPrincipal principal
    ) {
        InvitationDetailView detail = invitationService.getOrExpire(invitationId, principal.requireUserId());
        return ResponseEntity.ok(detail);
    }

    @PostMapping("/api/v1/invitations/{invitationId}/accept")
    public ResponseEntity<InvitationDetailView> accept(
            @PathVariable UUID invitationId,
            @RequestBody(required = false) ActionRequest request,
            @AuthenticationPrincipal AtlasPrincipal principal
    ) {
        long version = request != null ? request.version() : 0L;
        InvitationDetailView detail = invitationService.accept(
                invitationId, principal.requireUserId(), version);
        return ResponseEntity.ok(detail);
    }

    @PostMapping("/api/v1/invitations/{invitationId}/decline")
    public ResponseEntity<InvitationDetailView> decline(
            @PathVariable UUID invitationId,
            @RequestBody(required = false) ActionRequest request,
            @AuthenticationPrincipal AtlasPrincipal principal
    ) {
        long version = request != null ? request.version() : 0L;
        InvitationDetailView detail = invitationService.decline(
                invitationId, principal.requireUserId(), version);
        return ResponseEntity.ok(detail);
    }
}
