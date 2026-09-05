package com.atlas.application.web;

import com.atlas.application.application.ApplicationService;
import com.atlas.application.domain.ApplicationDetailView;
import com.atlas.application.domain.ApplicationSummaryView;
import com.atlas.application.domain.ApplyCommand;
import com.atlas.identity.domain.AtlasPrincipal;
import jakarta.validation.Valid;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class WorkerApplicationController {
    private final ApplicationService applicationService;

    public WorkerApplicationController(ApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    public record ApplyRequest(
            @Size(max = 2000) String coverNote,
            @PositiveOrZero Long proposedRatePence
    ) {
        public ApplyCommand toCommand() {
            return new ApplyCommand(coverNote, proposedRatePence);
        }
    }

    public record WithdrawRequest(long version) {}

    @PostMapping("/api/v1/jobs/{jobId}/applications")
    public ResponseEntity<ApplicationDetailView> applyToJob(
            @PathVariable UUID jobId,
            @Valid @RequestBody(required = false) ApplyRequest request,
            @AuthenticationPrincipal AtlasPrincipal principal
    ) {
        ApplyCommand cmd = request != null ? request.toCommand() : new ApplyCommand(null, null);
        ApplicationDetailView view = applicationService.applyToJob(jobId, principal.requireUserId(), cmd);
        return ResponseEntity.status(HttpStatus.CREATED).body(view);
    }

    @PostMapping("/api/v1/shifts/{shiftId}/applications")
    public ResponseEntity<ApplicationDetailView> applyToShift(
            @PathVariable UUID shiftId,
            @Valid @RequestBody(required = false) ApplyRequest request,
            @AuthenticationPrincipal AtlasPrincipal principal
    ) {
        ApplyCommand cmd = request != null ? request.toCommand() : new ApplyCommand(null, null);
        ApplicationDetailView view = applicationService.applyToShift(shiftId, principal.requireUserId(), cmd);
        return ResponseEntity.status(HttpStatus.CREATED).body(view);
    }

    @GetMapping("/api/v1/workers/me/applications")
    public ResponseEntity<List<ApplicationSummaryView>> getMyApplications(
            @AuthenticationPrincipal AtlasPrincipal principal,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(defaultValue = "0") int offset
    ) {
        List<ApplicationSummaryView> applications = applicationService.getWorkerApplications(
                principal.requireUserId(), limit, offset);
        return ResponseEntity.ok(applications);
    }

    @GetMapping("/api/v1/applications/{applicationId}")
    public ResponseEntity<ApplicationDetailView> getApplicationDetail(
            @PathVariable UUID applicationId,
            @AuthenticationPrincipal AtlasPrincipal principal
    ) {
        ApplicationDetailView view = applicationService.getApplicationDetail(
                applicationId, principal.requireUserId());
        return ResponseEntity.ok(view);
    }

    @PostMapping("/api/v1/applications/{applicationId}/withdraw")
    public ResponseEntity<ApplicationDetailView> withdraw(
            @PathVariable UUID applicationId,
            @RequestBody(required = false) WithdrawRequest request,
            @AuthenticationPrincipal AtlasPrincipal principal
    ) {
        long version = request != null ? request.version() : 0L;
        ApplicationDetailView view = applicationService.withdraw(
                applicationId, principal.requireUserId(), version);
        return ResponseEntity.ok(view);
    }
}
