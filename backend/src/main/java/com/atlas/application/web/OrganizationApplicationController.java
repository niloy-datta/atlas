package com.atlas.application.web;

import com.atlas.application.application.ApplicationService;
import com.atlas.application.domain.ApplicationDetailView;
import com.atlas.application.domain.ApplicationStatus;
import com.atlas.application.domain.ApplicationSummaryView;
import com.atlas.identity.domain.AtlasPrincipal;
import java.util.List;
import java.util.UUID;
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
public class OrganizationApplicationController {
    private final ApplicationService applicationService;

    public OrganizationApplicationController(ApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    public record TransitionRequest(long version) {}

    @GetMapping("/applications")
    public ResponseEntity<List<ApplicationSummaryView>> getApplications(
            @PathVariable UUID organizationId,
            @RequestParam(required = false) ApplicationStatus status,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(defaultValue = "0") int offset,
            @AuthenticationPrincipal AtlasPrincipal principal
    ) {
        List<ApplicationSummaryView> applications = applicationService.getOrganizationApplications(
                organizationId, status, principal.requireUserId(), limit, offset);
        return ResponseEntity.ok(applications);
    }

    @GetMapping("/jobs/{jobId}/applications")
    public ResponseEntity<List<ApplicationSummaryView>> getJobApplications(
            @PathVariable UUID organizationId,
            @PathVariable UUID jobId,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(defaultValue = "0") int offset,
            @AuthenticationPrincipal AtlasPrincipal principal
    ) {
        List<ApplicationSummaryView> applications = applicationService.getJobApplications(
                organizationId, jobId, principal.requireUserId(), limit, offset);
        return ResponseEntity.ok(applications);
    }

    @GetMapping("/shifts/{shiftId}/applications")
    public ResponseEntity<List<ApplicationSummaryView>> getShiftApplications(
            @PathVariable UUID organizationId,
            @PathVariable UUID shiftId,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(defaultValue = "0") int offset,
            @AuthenticationPrincipal AtlasPrincipal principal
    ) {
        List<ApplicationSummaryView> applications = applicationService.getShiftApplications(
                organizationId, shiftId, principal.requireUserId(), limit, offset);
        return ResponseEntity.ok(applications);
    }

    @PostMapping("/applications/{applicationId}/review")
    public ResponseEntity<ApplicationDetailView> reviewApplication(
            @PathVariable UUID organizationId,
            @PathVariable UUID applicationId,
            @RequestBody(required = false) TransitionRequest request,
            @AuthenticationPrincipal AtlasPrincipal principal
    ) {
        long version = request != null ? request.version() : 0L;
        ApplicationDetailView view = applicationService.transitionByEmployer(
                organizationId, applicationId, ApplicationStatus.UNDER_REVIEW, principal.requireUserId(), version);
        return ResponseEntity.ok(view);
    }

    @PostMapping("/applications/{applicationId}/shortlist")
    public ResponseEntity<ApplicationDetailView> shortlistApplication(
            @PathVariable UUID organizationId,
            @PathVariable UUID applicationId,
            @RequestBody(required = false) TransitionRequest request,
            @AuthenticationPrincipal AtlasPrincipal principal
    ) {
        long version = request != null ? request.version() : 0L;
        ApplicationDetailView view = applicationService.transitionByEmployer(
                organizationId, applicationId, ApplicationStatus.SHORTLISTED, principal.requireUserId(), version);
        return ResponseEntity.ok(view);
    }

    @PostMapping("/applications/{applicationId}/accept")
    public ResponseEntity<ApplicationDetailView> acceptApplication(
            @PathVariable UUID organizationId,
            @PathVariable UUID applicationId,
            @RequestBody(required = false) TransitionRequest request,
            @AuthenticationPrincipal AtlasPrincipal principal
    ) {
        long version = request != null ? request.version() : 0L;
        ApplicationDetailView view = applicationService.transitionByEmployer(
                organizationId, applicationId, ApplicationStatus.ACCEPTED, principal.requireUserId(), version);
        return ResponseEntity.ok(view);
    }

    @PostMapping("/applications/{applicationId}/reject")
    public ResponseEntity<ApplicationDetailView> rejectApplication(
            @PathVariable UUID organizationId,
            @PathVariable UUID applicationId,
            @RequestBody(required = false) TransitionRequest request,
            @AuthenticationPrincipal AtlasPrincipal principal
    ) {
        long version = request != null ? request.version() : 0L;
        ApplicationDetailView view = applicationService.transitionByEmployer(
                organizationId, applicationId, ApplicationStatus.REJECTED, principal.requireUserId(), version);
        return ResponseEntity.ok(view);
    }
}
