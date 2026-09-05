package com.atlas.shift.web;

import com.atlas.identity.domain.AtlasPrincipal;
import com.atlas.shift.application.ShiftService;
import com.atlas.shift.application.ShiftService.AddShiftCredentialRequirementCommand;
import com.atlas.shift.application.ShiftService.AddShiftSkillRequirementCommand;
import com.atlas.shift.application.ShiftService.CreateShiftDraftCommand;
import com.atlas.shift.application.ShiftService.PageResult;
import com.atlas.shift.application.ShiftService.UpdateShiftDraftCommand;
import com.atlas.shift.domain.ShiftDetailView;
import com.atlas.shift.domain.ShiftSummaryView;
import com.atlas.skill.domain.SkillProficiency;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.time.Instant;
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
@RequestMapping("/api/v1/organizations/{organizationId}/shifts")
public class OrganizationShiftController {
    private final ShiftService shiftService;

    public OrganizationShiftController(ShiftService shiftService) {
        this.shiftService = shiftService;
    }

    @PostMapping
    public ResponseEntity<ShiftDetailView> createDraft(
            @PathVariable UUID organizationId,
            @Valid @RequestBody CreateShiftRequest request,
            @AuthenticationPrincipal AtlasPrincipal principal
    ) {
        ShiftDetailView created = shiftService.createDraft(
                organizationId,
                new CreateShiftDraftCommand(
                        request.jobId(),
                        request.title(),
                        request.description(),
                        request.startTime(),
                        request.endTime(),
                        request.timezone() != null ? request.timezone() : "UTC",
                        request.capacity() != null ? request.capacity() : 1,
                        request.hourlyRatePence(),
                        request.currency() != null ? request.currency() : "GBP",
                        request.locationName(),
                        request.formattedAddress(),
                        request.latitude(),
                        request.longitude(),
                        Boolean.TRUE.equals(request.inheritJobRequirements())
                ),
                principal.userId()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public PageResult<ShiftSummaryView> list(
            @PathVariable UUID organizationId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) UUID jobId,
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal AtlasPrincipal principal
    ) {
        return shiftService.listTenantShifts(organizationId, status, jobId, from, to, page, size, principal.userId());
    }

    @GetMapping("/{shiftId}")
    public ShiftDetailView get(
            @PathVariable UUID organizationId,
            @PathVariable UUID shiftId,
            @AuthenticationPrincipal AtlasPrincipal principal
    ) {
        return shiftService.getTenantShift(organizationId, shiftId, principal.userId());
    }

    @PutMapping("/{shiftId}")
    public ShiftDetailView update(
            @PathVariable UUID organizationId,
            @PathVariable UUID shiftId,
            @Valid @RequestBody UpdateShiftRequest request,
            @AuthenticationPrincipal AtlasPrincipal principal
    ) {
        return shiftService.updateDraft(
                organizationId,
                shiftId,
                new UpdateShiftDraftCommand(
                        request.version(),
                        request.jobId(),
                        request.title(),
                        request.description(),
                        request.startTime(),
                        request.endTime(),
                        request.timezone() != null ? request.timezone() : "UTC",
                        request.capacity() != null ? request.capacity() : 1,
                        request.hourlyRatePence(),
                        request.currency() != null ? request.currency() : "GBP",
                        request.locationName(),
                        request.formattedAddress(),
                        request.latitude(),
                        request.longitude()
                ),
                principal.userId()
        );
    }

    @PostMapping("/{shiftId}/publish")
    public ShiftDetailView publish(
            @PathVariable UUID organizationId,
            @PathVariable UUID shiftId,
            @RequestBody(required = false) VersionRequest request,
            @AuthenticationPrincipal AtlasPrincipal principal
    ) {
        long version = request != null ? request.version() : 0L;
        return shiftService.publishShift(organizationId, shiftId, version, principal.userId());
    }

    @PostMapping("/{shiftId}/start")
    public ShiftDetailView start(
            @PathVariable UUID organizationId,
            @PathVariable UUID shiftId,
            @RequestBody(required = false) VersionRequest request,
            @AuthenticationPrincipal AtlasPrincipal principal
    ) {
        long version = request != null ? request.version() : 0L;
        return shiftService.startShift(organizationId, shiftId, version, principal.userId());
    }

    @PostMapping("/{shiftId}/complete")
    public ShiftDetailView complete(
            @PathVariable UUID organizationId,
            @PathVariable UUID shiftId,
            @RequestBody(required = false) VersionRequest request,
            @AuthenticationPrincipal AtlasPrincipal principal
    ) {
        long version = request != null ? request.version() : 0L;
        return shiftService.completeShift(organizationId, shiftId, version, principal.userId());
    }

    @PostMapping("/{shiftId}/cancel")
    public ShiftDetailView cancel(
            @PathVariable UUID organizationId,
            @PathVariable UUID shiftId,
            @RequestBody(required = false) VersionRequest request,
            @AuthenticationPrincipal AtlasPrincipal principal
    ) {
        long version = request != null ? request.version() : 0L;
        return shiftService.cancelShift(organizationId, shiftId, version, principal.userId());
    }

    @PostMapping("/{shiftId}/skills")
    public ShiftDetailView addSkillRequirement(
            @PathVariable UUID organizationId,
            @PathVariable UUID shiftId,
            @Valid @RequestBody AddSkillRequirementRequest request,
            @AuthenticationPrincipal AtlasPrincipal principal
    ) {
        return shiftService.addRequiredSkill(
                organizationId,
                shiftId,
                new AddShiftSkillRequirementCommand(
                        request.skillId(),
                        request.minimumProficiency() != null ? request.minimumProficiency() : SkillProficiency.BEGINNER,
                        request.required() != null ? request.required() : true
                ),
                principal.userId()
        );
    }

    @DeleteMapping("/{shiftId}/skills/{skillId}")
    public ShiftDetailView removeSkillRequirement(
            @PathVariable UUID organizationId,
            @PathVariable UUID shiftId,
            @PathVariable UUID skillId,
            @AuthenticationPrincipal AtlasPrincipal principal
    ) {
        return shiftService.removeRequiredSkill(organizationId, shiftId, skillId, principal.userId());
    }

    @PostMapping("/{shiftId}/credentials")
    public ShiftDetailView addCredentialRequirement(
            @PathVariable UUID organizationId,
            @PathVariable UUID shiftId,
            @Valid @RequestBody AddCredentialRequirementRequest request,
            @AuthenticationPrincipal AtlasPrincipal principal
    ) {
        return shiftService.addRequiredCredential(
                organizationId,
                shiftId,
                new AddShiftCredentialRequirementCommand(
                        request.credentialType(),
                        request.title(),
                        request.issuer(),
                        request.required() != null ? request.required() : true
                ),
                principal.userId()
        );
    }

    @DeleteMapping("/{shiftId}/credentials/{credentialRequirementId}")
    public ShiftDetailView removeCredentialRequirement(
            @PathVariable UUID organizationId,
            @PathVariable UUID shiftId,
            @PathVariable UUID credentialRequirementId,
            @AuthenticationPrincipal AtlasPrincipal principal
    ) {
        return shiftService.removeRequiredCredential(organizationId, shiftId, credentialRequirementId, principal.userId());
    }

    public record CreateShiftRequest(
            UUID jobId,
            @NotBlank @Size(max = 160) String title,
            @Size(max = 4000) String description,
            @NotNull Instant startTime,
            @NotNull Instant endTime,
            @Size(max = 64) String timezone,
            @NotNull @Min(1) Integer capacity,
            @NotNull @Positive Long hourlyRatePence,
            String currency,
            @Size(max = 160) String locationName,
            @Size(max = 255) String formattedAddress,
            @DecimalMin("-90.0") @DecimalMax("90.0") Double latitude,
            @DecimalMin("-180.0") @DecimalMax("180.0") Double longitude,
            Boolean inheritJobRequirements
    ) {}

    public record UpdateShiftRequest(
            long version,
            UUID jobId,
            @NotBlank @Size(max = 160) String title,
            @Size(max = 4000) String description,
            @NotNull Instant startTime,
            @NotNull Instant endTime,
            @Size(max = 64) String timezone,
            @NotNull @Min(1) Integer capacity,
            @NotNull @Positive Long hourlyRatePence,
            String currency,
            @Size(max = 160) String locationName,
            @Size(max = 255) String formattedAddress,
            @DecimalMin("-90.0") @DecimalMax("90.0") Double latitude,
            @DecimalMin("-180.0") @DecimalMax("180.0") Double longitude
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
