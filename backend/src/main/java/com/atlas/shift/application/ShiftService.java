package com.atlas.shift.application;

import com.atlas.job.domain.JobRow;
import com.atlas.job.infrastructure.JobRepository;
import com.atlas.organization.application.OrganizationAccessPolicy;
import com.atlas.organization.domain.OrganizationAction;
import com.atlas.shared.error.ApiProblemException;
import com.atlas.shift.domain.ShiftCredentialRequirement;
import com.atlas.shift.domain.ShiftDetailView;
import com.atlas.shift.domain.ShiftRow;
import com.atlas.shift.domain.ShiftSkillRequirement;
import com.atlas.shift.domain.ShiftStatus;
import com.atlas.shift.domain.ShiftSummaryView;
import com.atlas.shift.infrastructure.ShiftRepository;
import com.atlas.skill.domain.SkillProficiency;
import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ShiftService {
    private final ShiftRepository shiftRepository;
    private final JobRepository jobRepository;
    private final OrganizationAccessPolicy organizationAccessPolicy;

    public ShiftService(ShiftRepository shiftRepository,
                        JobRepository jobRepository,
                        OrganizationAccessPolicy organizationAccessPolicy) {
        this.shiftRepository = shiftRepository;
        this.jobRepository = jobRepository;
        this.organizationAccessPolicy = organizationAccessPolicy;
    }

    @Transactional
    public ShiftDetailView createDraft(UUID organizationId, CreateShiftDraftCommand cmd, UUID actorUserId) {
        organizationAccessPolicy.require(organizationId, actorUserId, OrganizationAction.PUBLISH_JOBS);

        if (cmd.jobId() != null) {
            validateJobBelongsToOrg(cmd.jobId(), organizationId);
        }

        validateShiftFields(cmd.title(), cmd.startTime(), cmd.endTime(), cmd.timezone(),
                cmd.capacity(), cmd.hourlyRatePence(), cmd.currency(), cmd.latitude(), cmd.longitude());

        UUID shiftId = UUID.randomUUID();
        Instant now = Instant.now();

        ShiftRow row = new ShiftRow(
                shiftId,
                cmd.jobId(),
                organizationId,
                cmd.title().trim(),
                cmd.description() != null ? cmd.description().trim() : null,
                cmd.startTime(),
                cmd.endTime(),
                cmd.timezone() != null ? cmd.timezone().trim() : "UTC",
                cmd.capacity(),
                cmd.hourlyRatePence(),
                cmd.currency() != null ? cmd.currency().trim().toUpperCase() : "GBP",
                ShiftStatus.DRAFT,
                cmd.locationName() != null ? cmd.locationName().trim() : null,
                cmd.formattedAddress() != null ? cmd.formattedAddress().trim() : null,
                cmd.latitude(),
                cmd.longitude(),
                0L,
                now,
                now
        );

        shiftRepository.insert(row);

        if (cmd.jobId() != null && cmd.inheritJobRequirements()) {
            shiftRepository.copyRequirementsFromJob(cmd.jobId(), shiftId, now);
        }

        return shiftRepository.findDetailById(shiftId)
                .orElseThrow(() -> new IllegalStateException("Shift not found immediately after insert"));
    }

    @Transactional
    public ShiftDetailView updateDraft(UUID organizationId, UUID shiftId, UpdateShiftDraftCommand cmd, UUID actorUserId) {
        organizationAccessPolicy.require(organizationId, actorUserId, OrganizationAction.PUBLISH_JOBS);

        if (cmd.jobId() != null) {
            validateJobBelongsToOrg(cmd.jobId(), organizationId);
        }

        validateShiftFields(cmd.title(), cmd.startTime(), cmd.endTime(), cmd.timezone(),
                cmd.capacity(), cmd.hourlyRatePence(), cmd.currency(), cmd.latitude(), cmd.longitude());

        ShiftRow existing = shiftRepository.findShiftRow(shiftId)
                .filter(s -> s.organizationId().equals(organizationId))
                .orElseThrow(() -> notFound(shiftId));

        if (existing.status() != ShiftStatus.DRAFT) {
            throw new ApiProblemException(HttpStatus.BAD_REQUEST, "INVALID_SHIFT_STATE",
                    "Shift not in DRAFT state", "Only shifts in DRAFT state can have their draft configuration updated.");
        }

        Instant now = Instant.now();
        ShiftRow updated = new ShiftRow(
                shiftId,
                cmd.jobId(),
                organizationId,
                cmd.title().trim(),
                cmd.description() != null ? cmd.description().trim() : null,
                cmd.startTime(),
                cmd.endTime(),
                cmd.timezone() != null ? cmd.timezone().trim() : "UTC",
                cmd.capacity(),
                cmd.hourlyRatePence(),
                cmd.currency() != null ? cmd.currency().trim().toUpperCase() : "GBP",
                ShiftStatus.DRAFT,
                cmd.locationName() != null ? cmd.locationName().trim() : null,
                cmd.formattedAddress() != null ? cmd.formattedAddress().trim() : null,
                cmd.latitude(),
                cmd.longitude(),
                cmd.version(),
                existing.createdAt(),
                now
        );

        int rows = shiftRepository.updateDraft(updated, cmd.version(), now);
        if (rows == 0) {
            throw new ApiProblemException(HttpStatus.CONFLICT, "CONCURRENT_MODIFICATION_CONFLICT",
                    "Concurrent modification", "The shift was modified concurrently. Please refresh and retry.");
        }

        return shiftRepository.findDetailById(shiftId).orElseThrow(() -> notFound(shiftId));
    }

    @Transactional
    public ShiftDetailView publishShift(UUID organizationId, UUID shiftId, long version, UUID actorUserId) {
        organizationAccessPolicy.require(organizationId, actorUserId, OrganizationAction.PUBLISH_JOBS);
        ShiftRow shift = shiftRepository.findShiftRow(shiftId)
                .filter(s -> s.organizationId().equals(organizationId))
                .orElseThrow(() -> notFound(shiftId));

        if (shift.status() != ShiftStatus.DRAFT) {
            throw new ApiProblemException(HttpStatus.BAD_REQUEST, "INVALID_STATE_TRANSITION",
                    "Invalid shift state", "Only DRAFT shifts can be published.");
        }

        if (shift.endTime().isBefore(Instant.now())) {
            throw new ApiProblemException(HttpStatus.BAD_REQUEST, "SHIFT_IN_PAST",
                    "Cannot publish past shift", "The shift end time is already in the past.");
        }

        return transitionStatus(organizationId, shiftId, ShiftStatus.PUBLISHED, version, actorUserId);
    }

    @Transactional
    public ShiftDetailView startShift(UUID organizationId, UUID shiftId, long version, UUID actorUserId) {
        return transitionStatus(organizationId, shiftId, ShiftStatus.IN_PROGRESS, version, actorUserId);
    }

    @Transactional
    public ShiftDetailView completeShift(UUID organizationId, UUID shiftId, long version, UUID actorUserId) {
        return transitionStatus(organizationId, shiftId, ShiftStatus.COMPLETED, version, actorUserId);
    }

    @Transactional
    public ShiftDetailView cancelShift(UUID organizationId, UUID shiftId, long version, UUID actorUserId) {
        return transitionStatus(organizationId, shiftId, ShiftStatus.CANCELLED, version, actorUserId);
    }

    @Transactional
    public ShiftDetailView addRequiredSkill(UUID organizationId, UUID shiftId, AddShiftSkillRequirementCommand cmd, UUID actorUserId) {
        organizationAccessPolicy.require(organizationId, actorUserId, OrganizationAction.PUBLISH_JOBS);
        ShiftRow shift = shiftRepository.findShiftRow(shiftId)
                .filter(s -> s.organizationId().equals(organizationId))
                .orElseThrow(() -> notFound(shiftId));

        if (shift.status() == ShiftStatus.COMPLETED || shift.status() == ShiftStatus.CANCELLED) {
            throw new ApiProblemException(HttpStatus.BAD_REQUEST, "INVALID_SHIFT_STATE",
                    "Shift requirements immutable", "Requirements cannot be modified on completed or cancelled shifts.");
        }

        UUID reqId = UUID.randomUUID();
        shiftRepository.addRequiredSkill(reqId, shiftId, cmd.skillId(), cmd.minimumProficiency(), cmd.required(), Instant.now());
        return shiftRepository.findDetailById(shiftId).orElseThrow(() -> notFound(shiftId));
    }

    @Transactional
    public ShiftDetailView removeRequiredSkill(UUID organizationId, UUID shiftId, UUID skillId, UUID actorUserId) {
        organizationAccessPolicy.require(organizationId, actorUserId, OrganizationAction.PUBLISH_JOBS);
        ShiftRow shift = shiftRepository.findShiftRow(shiftId)
                .filter(s -> s.organizationId().equals(organizationId))
                .orElseThrow(() -> notFound(shiftId));

        if (shift.status() == ShiftStatus.COMPLETED || shift.status() == ShiftStatus.CANCELLED) {
            throw new ApiProblemException(HttpStatus.BAD_REQUEST, "INVALID_SHIFT_STATE",
                    "Shift requirements immutable", "Requirements cannot be modified on completed or cancelled shifts.");
        }

        shiftRepository.removeRequiredSkill(shiftId, skillId);
        return shiftRepository.findDetailById(shiftId).orElseThrow(() -> notFound(shiftId));
    }

    @Transactional
    public ShiftDetailView addRequiredCredential(UUID organizationId, UUID shiftId, AddShiftCredentialRequirementCommand cmd, UUID actorUserId) {
        organizationAccessPolicy.require(organizationId, actorUserId, OrganizationAction.PUBLISH_JOBS);
        ShiftRow shift = shiftRepository.findShiftRow(shiftId)
                .filter(s -> s.organizationId().equals(organizationId))
                .orElseThrow(() -> notFound(shiftId));

        if (shift.status() == ShiftStatus.COMPLETED || shift.status() == ShiftStatus.CANCELLED) {
            throw new ApiProblemException(HttpStatus.BAD_REQUEST, "INVALID_SHIFT_STATE",
                    "Shift requirements immutable", "Requirements cannot be modified on completed or cancelled shifts.");
        }

        if (cmd.title() == null || cmd.title().isBlank()) {
            throw new ApiProblemException(HttpStatus.BAD_REQUEST, "INVALID_CREDENTIAL_TITLE",
                    "Invalid credential title", "Credential requirement title cannot be empty.");
        }

        String credType = cmd.credentialType() != null && !cmd.credentialType().isBlank()
                ? cmd.credentialType().trim().toUpperCase()
                : "CERTIFICATE";

        UUID reqId = UUID.randomUUID();
        shiftRepository.addRequiredCredential(reqId, shiftId, credType, cmd.title().trim(),
                cmd.issuer() != null ? cmd.issuer().trim() : null, cmd.required(), Instant.now());
        return shiftRepository.findDetailById(shiftId).orElseThrow(() -> notFound(shiftId));
    }

    @Transactional
    public ShiftDetailView removeRequiredCredential(UUID organizationId, UUID shiftId, UUID credentialRequirementId, UUID actorUserId) {
        organizationAccessPolicy.require(organizationId, actorUserId, OrganizationAction.PUBLISH_JOBS);
        ShiftRow shift = shiftRepository.findShiftRow(shiftId)
                .filter(s -> s.organizationId().equals(organizationId))
                .orElseThrow(() -> notFound(shiftId));

        if (shift.status() == ShiftStatus.COMPLETED || shift.status() == ShiftStatus.CANCELLED) {
            throw new ApiProblemException(HttpStatus.BAD_REQUEST, "INVALID_SHIFT_STATE",
                    "Shift requirements immutable", "Requirements cannot be modified on completed or cancelled shifts.");
        }

        shiftRepository.removeRequiredCredential(shiftId, credentialRequirementId);
        return shiftRepository.findDetailById(shiftId).orElseThrow(() -> notFound(shiftId));
    }

    @Transactional(readOnly = true)
    public ShiftDetailView getTenantShift(UUID organizationId, UUID shiftId, UUID actorUserId) {
        organizationAccessPolicy.require(organizationId, actorUserId, OrganizationAction.VIEW);
        return shiftRepository.findDetailById(shiftId)
                .filter(s -> s.organizationId().equals(organizationId))
                .orElseThrow(() -> notFound(shiftId));
    }

    @Transactional(readOnly = true)
    public PageResult<ShiftSummaryView> listTenantShifts(UUID organizationId, String statusFilter, UUID jobId,
                                                         Instant from, Instant to, int page, int size, UUID actorUserId) {
        organizationAccessPolicy.require(organizationId, actorUserId, OrganizationAction.VIEW);
        int validPage = Math.max(0, page);
        int validSize = Math.clamp(size, 1, 100);
        int offset = validPage * validSize;

        List<ShiftSummaryView> items = shiftRepository.listOrganizationShifts(organizationId, statusFilter, jobId, from, to, validSize, offset);
        long total = shiftRepository.countOrganizationShifts(organizationId, statusFilter, jobId, from, to);
        return new PageResult<>(items, total, validPage, validSize);
    }

    @Transactional(readOnly = true)
    public ShiftDetailView getPublicShift(UUID shiftId) {
        ShiftDetailView shift = shiftRepository.findDetailById(shiftId)
                .orElseThrow(() -> notFound(shiftId));

        if (shift.status() != ShiftStatus.PUBLISHED && shift.status() != ShiftStatus.IN_PROGRESS) {
            throw notFound(shiftId);
        }
        return shift;
    }

    @Transactional(readOnly = true)
    public PageResult<ShiftSummaryView> searchPublicShifts(String query, Double lat, Double lon, Double radiusKm,
                                                           Instant from, Instant to, Long minHourlyRatePence,
                                                           int page, int size) {
        int validPage = Math.max(0, page);
        int validSize = Math.clamp(size, 1, 100);
        int offset = validPage * validSize;

        if (lat != null || lon != null) {
            if (lat == null || lon == null || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
                throw new ApiProblemException(HttpStatus.BAD_REQUEST, "INVALID_COORDINATES",
                        "Invalid coordinates", "Latitude must be [-90, 90] and longitude must be [-180, 180].");
            }
        }

        List<ShiftSummaryView> items = shiftRepository.searchPublicShifts(query, lat, lon, radiusKm, from, to, minHourlyRatePence, validSize, offset);
        long total = shiftRepository.countPublicShifts(query, lat, lon, radiusKm, from, to, minHourlyRatePence);
        return new PageResult<>(items, total, validPage, validSize);
    }

    private ShiftDetailView transitionStatus(UUID organizationId, UUID shiftId, ShiftStatus targetStatus, long expectedVersion, UUID actorUserId) {
        organizationAccessPolicy.require(organizationId, actorUserId, OrganizationAction.PUBLISH_JOBS);
        ShiftRow shift = shiftRepository.findShiftRow(shiftId)
                .filter(s -> s.organizationId().equals(organizationId))
                .orElseThrow(() -> notFound(shiftId));

        if (!shift.status().canTransitionTo(targetStatus)) {
            throw new ApiProblemException(HttpStatus.BAD_REQUEST, "INVALID_STATE_TRANSITION",
                    "Invalid state transition",
                    String.format("Cannot transition shift from %s to %s", shift.status(), targetStatus));
        }

        Instant now = Instant.now();
        int rows = shiftRepository.updateStatus(shiftId, organizationId, targetStatus, expectedVersion, now);
        if (rows == 0) {
            throw new ApiProblemException(HttpStatus.CONFLICT, "CONCURRENT_MODIFICATION_CONFLICT",
                    "Concurrent modification", "The shift was modified concurrently. Please refresh and retry.");
        }

        return shiftRepository.findDetailById(shiftId).orElseThrow(() -> notFound(shiftId));
    }

    private void validateJobBelongsToOrg(UUID jobId, UUID organizationId) {
        JobRow job = jobRepository.findJobRow(jobId)
                .orElseThrow(() -> new ApiProblemException(HttpStatus.BAD_REQUEST, "INVALID_JOB",
                        "Referenced job not found", "The specified job does not exist."));
        if (!job.organizationId().equals(organizationId)) {
            throw new ApiProblemException(HttpStatus.BAD_REQUEST, "INVALID_JOB_TENANCY",
                    "Cross-organization job reference forbidden", "The specified job belongs to a different organization.");
        }
    }

    private void validateShiftFields(String title, Instant startTime, Instant endTime, String timezone,
                                     int capacity, long hourlyRatePence, String currency,
                                     Double lat, Double lon) {
        if (title == null || title.isBlank() || title.trim().length() > 160) {
            throw new ApiProblemException(HttpStatus.BAD_REQUEST, "INVALID_SHIFT_TITLE",
                    "Invalid title", "Shift title must be between 1 and 160 characters.");
        }
        if (startTime == null || endTime == null) {
            throw new ApiProblemException(HttpStatus.BAD_REQUEST, "INVALID_SHIFT_INTERVAL",
                    "Missing time interval", "Both start time and end time are required.");
        }
        if (!endTime.isAfter(startTime)) {
            throw new ApiProblemException(HttpStatus.BAD_REQUEST, "INVALID_SHIFT_INTERVAL",
                    "Invalid time interval", "End time must be after start time.");
        }
        if (timezone != null && !timezone.isBlank()) {
            try {
                ZoneId.of(timezone.trim());
            } catch (Exception e) {
                throw new ApiProblemException(HttpStatus.BAD_REQUEST, "INVALID_TIMEZONE",
                        "Invalid timezone", "Timezone must be a valid IANA zone identifier (e.g. UTC, Europe/London).");
            }
        }
        if (capacity < 1) {
            throw new ApiProblemException(HttpStatus.BAD_REQUEST, "INVALID_CAPACITY",
                    "Invalid capacity", "Capacity must be at least 1 worker.");
        }
        if (hourlyRatePence <= 0) {
            throw new ApiProblemException(HttpStatus.BAD_REQUEST, "INVALID_RATE",
                    "Invalid hourly rate", "Hourly rate must be greater than 0.");
        }
        if (currency != null && !currency.trim().matches("^[A-Za-z]{3}$")) {
            throw new ApiProblemException(HttpStatus.BAD_REQUEST, "INVALID_CURRENCY",
                    "Invalid currency", "Currency must be a 3-letter ISO code.");
        }
        if ((lat != null && lon == null) || (lat == null && lon != null)) {
            throw new ApiProblemException(HttpStatus.BAD_REQUEST, "INVALID_COORDINATES",
                    "Incomplete coordinates", "Both latitude and longitude must be provided together.");
        }
        if (lat != null && (lat < -90.0 || lat > 90.0 || lon < -180.0 || lon > 180.0)) {
            throw new ApiProblemException(HttpStatus.BAD_REQUEST, "INVALID_COORDINATES",
                    "Invalid coordinates", "Latitude must be [-90, 90] and longitude must be [-180, 180].");
        }
    }

    private static ApiProblemException notFound(UUID shiftId) {
        return new ApiProblemException(HttpStatus.NOT_FOUND, "SHIFT_NOT_FOUND",
                "Shift not found", "The requested shift was not found or is not accessible.");
    }

    public record CreateShiftDraftCommand(
            UUID jobId,
            String title,
            String description,
            Instant startTime,
            Instant endTime,
            String timezone,
            int capacity,
            long hourlyRatePence,
            String currency,
            String locationName,
            String formattedAddress,
            Double latitude,
            Double longitude,
            boolean inheritJobRequirements
    ) {}

    public record UpdateShiftDraftCommand(
            long version,
            UUID jobId,
            String title,
            String description,
            Instant startTime,
            Instant endTime,
            String timezone,
            int capacity,
            long hourlyRatePence,
            String currency,
            String locationName,
            String formattedAddress,
            Double latitude,
            Double longitude
    ) {}

    public record AddShiftSkillRequirementCommand(
            UUID skillId,
            SkillProficiency minimumProficiency,
            boolean required
    ) {}

    public record AddShiftCredentialRequirementCommand(
            String credentialType,
            String title,
            String issuer,
            boolean required
    ) {}

    public record PageResult<T>(
            List<T> items,
            long total,
            int page,
            int size
    ) {}
}

