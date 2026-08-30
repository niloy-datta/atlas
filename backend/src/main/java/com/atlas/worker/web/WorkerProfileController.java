package com.atlas.worker.web;

import com.atlas.worker.application.WorkerProfileService;
import com.atlas.worker.application.WorkerProfileService.ProfileCommand;
import com.atlas.worker.domain.JobTypePreference;
import com.atlas.worker.domain.ProfileVisibility;
import com.atlas.worker.infrastructure.WorkerProfileRepository.LocationWrite;
import com.atlas.worker.infrastructure.WorkerProfileRepository.PreferencesWrite;
import com.atlas.worker.infrastructure.WorkerProfileRepository.PrivacyWrite;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/workers/me")
public class WorkerProfileController {
    private final WorkerProfileService profiles;

    public WorkerProfileController(WorkerProfileService profiles) { this.profiles = profiles; }

    @GetMapping("/profile")
    WorkerProfileService.PrivateProfile profile(@AuthenticationPrincipal Jwt jwt) {
        return profiles.privateProfile(userId(jwt));
    }

    @PutMapping("/profile")
    WorkerProfileService.PrivateProfile replace(@AuthenticationPrincipal Jwt jwt,
                                                @Valid @RequestBody ProfileRequest request) {
        LocationWrite location = request.location() == null ? null : new LocationWrite(
                request.location().latitude(), request.location().longitude(), trim(request.location().city()),
                trim(request.location().region()), request.location().countryCode().toUpperCase(java.util.Locale.ROOT));
        PreferencesWrite preferences = request.preferences() == null ? null : new PreferencesWrite(
                request.preferences().openToWork(), request.preferences().maxDistanceKm(),
                request.preferences().jobTypes() == null ? List.of() : List.copyOf(request.preferences().jobTypes()));
        PrivacyWrite privacy = request.privacy() == null ? null : new PrivacyWrite(
                request.privacy().showCoarseLocation(), request.privacy().showExperience());
        return profiles.replace(userId(jwt), new ProfileCommand(request.version(), request.handle(), request.fullName(),
                request.headline(), request.bio(), request.experienceYears(), request.visibility(),
                location, preferences, privacy));
    }

    @GetMapping("/work-pass")
    WorkerProfileService.PrivateWorkPass workPass(@AuthenticationPrincipal Jwt jwt) {
        return profiles.privateWorkPass(userId(jwt));
    }

    private static UUID userId(Jwt jwt) { return UUID.fromString(jwt.getSubject()); }
    private static String trim(String value) { return value == null ? null : value.trim(); }

    public record ProfileRequest(
            @Min(0) Long version,
            @Pattern(regexp = "^[A-Za-z0-9][A-Za-z0-9-]{1,38}[A-Za-z0-9]$") String handle,
            @Size(max = 120) String fullName,
            @Size(max = 160) String headline,
            @Size(max = 2000) String bio,
            @Min(0) @Max(80) Integer experienceYears,
            @NotNull ProfileVisibility visibility,
            @Valid LocationRequest location,
            @Valid PreferencesRequest preferences,
            PrivacyRequest privacy) { }

    public record LocationRequest(
            @DecimalMin("-90.0") @DecimalMax("90.0") double latitude,
            @DecimalMin("-180.0") @DecimalMax("180.0") double longitude,
            @Size(max = 120) String city,
            @Size(max = 120) String region,
            @NotBlank @Pattern(regexp = "^[A-Za-z]{2}$") String countryCode) { }

    public record PreferencesRequest(boolean openToWork, @Min(1) @Max(100) Integer maxDistanceKm,
                                     @Size(max = 3) List<@NotNull JobTypePreference> jobTypes) { }
    public record PrivacyRequest(boolean showCoarseLocation, boolean showExperience) { }
}
