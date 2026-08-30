package com.atlas.worker.application;

import com.atlas.shared.error.ApiProblemException;
import com.atlas.worker.domain.JobTypePreference;
import com.atlas.worker.domain.ProfileCompletionEngine;
import com.atlas.worker.domain.ProfileVisibility;
import com.atlas.worker.infrastructure.WorkerProfileRepository;
import com.atlas.worker.infrastructure.WorkerProfileRepository.LocationData;
import com.atlas.worker.infrastructure.WorkerProfileRepository.LocationWrite;
import com.atlas.worker.infrastructure.WorkerProfileRepository.PreferencesData;
import com.atlas.worker.infrastructure.WorkerProfileRepository.PreferencesWrite;
import com.atlas.worker.infrastructure.WorkerProfileRepository.PrivacyData;
import com.atlas.worker.infrastructure.WorkerProfileRepository.PrivacyWrite;
import com.atlas.worker.infrastructure.WorkerProfileRepository.ProfileData;
import com.atlas.worker.infrastructure.WorkerProfileRepository.ProfileWrite;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WorkerProfileService {
    private final WorkerProfileRepository profiles;
    private final ProfileCompletionEngine completionEngine;
    private final Clock clock;

    public WorkerProfileService(WorkerProfileRepository profiles, ProfileCompletionEngine completionEngine, Clock clock) {
        this.profiles = profiles;
        this.completionEngine = completionEngine;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public PrivateProfile privateProfile(UUID userId) {
        return toPrivate(profiles.findByUserId(userId).orElseThrow(WorkerProfileService::profileNotFound));
    }

    @Transactional(readOnly = true)
    public PrivateWorkPass privateWorkPass(UUID userId) {
        PrivateProfile profile = privateProfile(userId);
        return new PrivateWorkPass(1, profile);
    }

    @Transactional(readOnly = true)
    public PublicWorkPass publicWorkPass(String rawHandle) {
        String handle = normalizeHandle(rawHandle);
        ProfileData data = profiles.findPublicByHandle(handle).orElseThrow(WorkerProfileService::profileNotFound);
        CoarseLocation location = data.privacy().showCoarseLocation() && data.location() != null
                ? new CoarseLocation(data.location().city(), data.location().region(), data.location().countryCode())
                : null;
        Integer experience = data.privacy().showExperience() ? data.experienceYears() : null;
        return new PublicWorkPass(1, data.handle(), data.fullName(), data.headline(), data.bio(),
                experience, location, data.updatedAt());
    }

    @Transactional
    public PrivateProfile replace(UUID userId, ProfileCommand command) {
        ProfileData existing = profiles.findByUserId(userId).orElse(null);
        if (existing == null && command.expectedVersion() != null) {
            throw versionConflict();
        }
        if (existing != null && command.expectedVersion() == null) {
            throw versionConflict();
        }

        String handle = normalizeNullable(command.handle());
        String fullName = trimToNull(command.fullName());
        String headline = trimToNull(command.headline());
        String bio = trimToNull(command.bio());
        ProfileVisibility visibility = command.visibility();
        LocationWrite location = command.location();
        PreferencesWrite preferences = command.preferences();
        PrivacyWrite privacy = command.privacy() == null ? new PrivacyWrite(false, false) : command.privacy();
        ProfileCompletionEngine.Result completion = completionEngine.calculate(new ProfileCompletionEngine.Input(
                handle, fullName, headline, bio, command.experienceYears(), visibility,
                location != null, preferences != null));
        UUID profileId = existing == null ? UUID.randomUUID() : existing.id();
        ProfileWrite write = new ProfileWrite(profileId, userId, handle, fullName, headline, bio,
                command.experienceYears(), visibility, completion.score(), completion.version());
        Instant now = Instant.now(clock);

        try {
            if (existing == null) {
                profiles.insert(write, now);
            } else if (profiles.update(write, command.expectedVersion(), now) == 0) {
                throw versionConflict();
            }
            profiles.replaceLocation(profileId, location, now);
            profiles.replacePreferences(profileId, preferences, now);
            profiles.replacePrivacy(profileId, privacy, now);
        } catch (DataIntegrityViolationException exception) {
            throw new ApiProblemException(HttpStatus.CONFLICT, "WORKER_HANDLE_UNAVAILABLE",
                    "Public handle unavailable", "The requested public handle is already in use.");
        }
        return toPrivate(profiles.findByUserId(userId).orElseThrow(WorkerProfileService::profileNotFound));
    }

    private PrivateProfile toPrivate(ProfileData data) {
        ProfileCompletionEngine.Result completion = completionEngine.calculate(new ProfileCompletionEngine.Input(
                data.handle(), data.fullName(), data.headline(), data.bio(), data.experienceYears(), data.visibility(),
                data.location() != null, data.preferences() != null));
        PrivateLocation location = data.location() == null ? null : toPrivateLocation(data.location());
        WorkerPreferences preferences = data.preferences() == null ? null : toPreferences(data.preferences());
        PrivacySettings privacy = new PrivacySettings(
                data.privacy().showCoarseLocation(), data.privacy().showExperience());
        return new PrivateProfile(data.id(), data.handle(), data.fullName(), data.headline(), data.bio(),
                data.experienceYears(), data.visibility(), data.version(), location, preferences, privacy,
                new Completion(data.completionScore(), data.completionVersion(), completion.recommendations()),
                data.createdAt(), data.updatedAt());
    }

    private static PrivateLocation toPrivateLocation(LocationData data) {
        return new PrivateLocation(data.latitude(), data.longitude(), data.city(), data.region(), data.countryCode());
    }

    private static WorkerPreferences toPreferences(PreferencesData data) {
        return new WorkerPreferences(data.openToWork(), data.maxDistanceKm(), data.jobTypes());
    }

    private static String normalizeNullable(String value) {
        String trimmed = trimToNull(value);
        return trimmed == null ? null : normalizeHandle(trimmed);
    }

    private static String normalizeHandle(String value) { return value.trim().toLowerCase(Locale.ROOT); }
    private static String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
    private static ApiProblemException profileNotFound() {
        return new ApiProblemException(HttpStatus.NOT_FOUND, "WORKER_PROFILE_NOT_FOUND",
                "Worker profile not found", "The requested worker profile is not available.");
    }
    private static ApiProblemException versionConflict() {
        return new ApiProblemException(HttpStatus.CONFLICT, "WORKER_PROFILE_VERSION_CONFLICT",
                "Worker profile changed", "Reload the worker profile and retry with its current version.");
    }

    public record ProfileCommand(Long expectedVersion, String handle, String fullName, String headline, String bio,
                                 Integer experienceYears, ProfileVisibility visibility, LocationWrite location,
                                 PreferencesWrite preferences, PrivacyWrite privacy) { }
    public record PrivateProfile(UUID id, String handle, String fullName, String headline, String bio,
                                 Integer experienceYears, ProfileVisibility visibility, long version,
                                 PrivateLocation location, WorkerPreferences preferences, PrivacySettings privacy,
                                 Completion completion, Instant createdAt, Instant updatedAt) { }
    public record PrivateLocation(double latitude, double longitude, String city, String region, String countryCode) { }
    public record WorkerPreferences(boolean openToWork, Integer maxDistanceKm, List<JobTypePreference> jobTypes) { }
    public record PrivacySettings(boolean showCoarseLocation, boolean showExperience) { }
    public record Completion(int score, int version, List<String> recommendations) { }
    public record PrivateWorkPass(int schemaVersion, PrivateProfile profile) { }
    public record PublicWorkPass(int schemaVersion, String handle, String fullName, String headline, String bio,
                                 Integer experienceYears, CoarseLocation location, Instant updatedAt) { }
    public record CoarseLocation(String city, String region, String countryCode) { }
}
