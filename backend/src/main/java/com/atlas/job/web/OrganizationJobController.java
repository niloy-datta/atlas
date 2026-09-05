package com.atlas.job.web;

import com.atlas.identity.domain.AtlasPrincipal;
import com.atlas.job.application.JobService;
import com.atlas.job.application.JobService.AddJobSkillRequirementCommand;
import com.atlas.job.application.JobService.CreateJobDraftCommand;
import com.atlas.job.application.JobService.PageResult;
import com.atlas.job.application.JobService.UpdateJobDraftCommand;
import com.atlas.job.domain.JobDetailView;
import com.atlas.job.domain.JobSummaryView;
import com.atlas.job.domain.JobType;
import com.atlas.skill.domain.SkillProficiency;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/organizations/{organizationId}/jobs")
public class OrganizationJobController {
    private final JobService jobService;

    public OrganizationJobController(JobService jobService) {
        this.jobService = jobService;
    }

    @PostMapping
    public ResponseEntity<JobDetailView> createDraft(
            @PathVariable UUID organizationId,
            @Valid @RequestBody CreateJobRequest request,
            @AuthenticationPrincipal AtlasPrincipal principal
    ) {
        JobDetailView created = jobService.createDraft(
                organizationId,
                new CreateJobDraftCommand(
                        request.title(),
                        request.description(),
                        request.jobType() != null ? request.jobType() : JobType.SHIFT,
                        request.locationName(),
                        request.formattedAddress(),
                        request.latitude(),
                        request.longitude(),
                        request.budgetMinPence(),
                        request.budgetMaxPence(),
                        request.currency()
                ),
                principal.userId()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public PageResult<JobSummaryView> list(
            @PathVariable UUID organizationId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal AtlasPrincipal principal
    ) {
        return jobService.listTenantJobs(organizationId, status, page, size, principal.userId());
    }

    @GetMapping("/{jobId}")
    public JobDetailView get(
            @PathVariable UUID organizationId,
            @PathVariable UUID jobId,
            @AuthenticationPrincipal AtlasPrincipal principal
    ) {
        return jobService.getTenantJob(organizationId, jobId, principal.userId());
    }

    @PutMapping("/{jobId}")
    public JobDetailView update(
            @PathVariable UUID organizationId,
            @PathVariable UUID jobId,
            @Valid @RequestBody UpdateJobRequest request,
            @AuthenticationPrincipal AtlasPrincipal principal
    ) {
        return jobService.updateDraft(
                organizationId,
                jobId,
                new UpdateJobDraftCommand(
                        request.version(),
                        request.title(),
                        request.description(),
                        request.jobType() != null ? request.jobType() : JobType.SHIFT,
                        request.locationName(),
                        request.formattedAddress(),
                        request.latitude(),
                        request.longitude(),
                        request.budgetMinPence(),
                        request.budgetMaxPence(),
                        request.currency()
                ),
                principal.userId()
        );
    }

    @PostMapping("/{jobId}/publish")
    public JobDetailView publish(
            @PathVariable UUID organizationId,
            @PathVariable UUID jobId,
            @RequestBody(required = false) VersionRequest request,
            @AuthenticationPrincipal AtlasPrincipal principal
    ) {
        long version = request != null ? request.version() : 0L;
        return jobService.publishJob(organizationId, jobId, version, principal.userId());
    }

    @PostMapping("/{jobId}/pause")
    public JobDetailView pause(
            @PathVariable UUID organizationId,
            @PathVariable UUID jobId,
            @RequestBody(required = false) VersionRequest request,
            @AuthenticationPrincipal AtlasPrincipal principal
    ) {
        long version = request != null ? request.version() : 0L;
        return jobService.pauseJob(organizationId, jobId, version, principal.userId());
    }

    @PostMapping("/{jobId}/resume")
    public JobDetailView resume(
            @PathVariable UUID organizationId,
            @PathVariable UUID jobId,
            @RequestBody(required = false) VersionRequest request,
            @AuthenticationPrincipal AtlasPrincipal principal
    ) {
        long version = request != null ? request.version() : 0L;
        return jobService.resumeJob(organizationId, jobId, version, principal.userId());
    }

    @PostMapping("/{jobId}/close")
    public JobDetailView close(
            @PathVariable UUID organizationId,
            @PathVariable UUID jobId,
            @RequestBody(required = false) VersionRequest request,
            @AuthenticationPrincipal AtlasPrincipal principal
    ) {
        long version = request != null ? request.version() : 0L;
        return jobService.closeJob(organizationId, jobId, version, principal.userId());
    }

    @PostMapping("/{jobId}/cancel")
    public JobDetailView cancel(
            @PathVariable UUID organizationId,
            @PathVariable UUID jobId,
            @RequestBody(required = false) VersionRequest request,
            @AuthenticationPrincipal AtlasPrincipal principal
    ) {
        long version = request != null ? request.version() : 0L;
        return jobService.cancelJob(organizationId, jobId, version, principal.userId());
    }

    @PostMapping("/{jobId}/skills")
    public JobDetailView addSkillRequirement(
            @PathVariable UUID organizationId,
            @PathVariable UUID jobId,
            @Valid @RequestBody AddSkillRequirementRequest request,
            @AuthenticationPrincipal AtlasPrincipal principal
    ) {
        return jobService.addRequiredSkill(
                organizationId,
                jobId,
                new AddJobSkillRequirementCommand(
                        request.skillId(),
                        request.minimumProficiency() != null ? request.minimumProficiency() : SkillProficiency.BEGINNER,
                        request.required() != null ? request.required() : true
                ),
                principal.userId()
        );
    }

    @DeleteMapping("/{jobId}/skills/{skillId}")
    public JobDetailView removeSkillRequirement(
            @PathVariable UUID organizationId,
            @PathVariable UUID jobId,
            @PathVariable UUID skillId,
            @AuthenticationPrincipal AtlasPrincipal principal
    ) {
        return jobService.removeRequiredSkill(organizationId, jobId, skillId, principal.userId());
    }

    @PostMapping("/{jobId}/credentials")
    public JobDetailView addCredentialRequirement(
            @PathVariable UUID organizationId,
            @PathVariable UUID jobId,
            @Valid @RequestBody AddCredentialRequirementRequest request,
            @AuthenticationPrincipal AtlasPrincipal principal
    ) {
        return jobService.addRequiredCredential(
                organizationId,
                jobId,
                new JobService.AddJobCredentialRequirementCommand(
                        request.credentialType(),
                        request.title(),
                        request.issuer(),
                        request.required() != null ? request.required() : true
                ),
                principal.userId()
        );
    }

    @DeleteMapping("/{jobId}/credentials/{credentialRequirementId}")
    public JobDetailView removeCredentialRequirement(
            @PathVariable UUID organizationId,
            @PathVariable UUID jobId,
            @PathVariable UUID credentialRequirementId,
            @AuthenticationPrincipal AtlasPrincipal principal
    ) {
        return jobService.removeRequiredCredential(organizationId, jobId, credentialRequirementId, principal.userId());
    }

    public record CreateJobRequest(
            @NotBlank @Size(max = 160) String title,
            @NotBlank @Size(max = 4000) String description,
            @NotNull JobType jobType,
            @Size(max = 160) String locationName,
            @Size(max = 255) String formattedAddress,
            @DecimalMin("-90.0") @DecimalMax("90.0") Double latitude,
            @DecimalMin("-180.0") @DecimalMax("180.0") Double longitude,
            @PositiveOrZero Long budgetMinPence,
            @PositiveOrZero Long budgetMaxPence,
            String currency
    ) {}

    public record UpdateJobRequest(
            long version,
            @NotBlank @Size(max = 160) String title,
            @NotBlank @Size(max = 4000) String description,
            @NotNull JobType jobType,
            @Size(max = 160) String locationName,
            @Size(max = 255) String formattedAddress,
            @DecimalMin("-90.0") @DecimalMax("90.0") Double latitude,
            @DecimalMin("-180.0") @DecimalMax("180.0") Double longitude,
            @PositiveOrZero Long budgetMinPence,
            @PositiveOrZero Long budgetMaxPence,
            String currency
    ) {}

    public record VersionRequest(long version) {}

    public record AddSkillRequirementRequest(
            @NotNull UUID skillId,
            SkillProficiency minimumProficiency,
            Boolean required
    ) {}

    public record AddCredentialRequirementRequest(
            String credentialType,
            @NotBlank @Size(max = 160) String title,
            @Size(max = 160) String issuer,
            Boolean required
    ) {}
}
