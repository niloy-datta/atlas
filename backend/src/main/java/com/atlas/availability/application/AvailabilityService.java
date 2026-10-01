package com.atlas.availability.application;

import com.atlas.availability.domain.AvailabilityWindowResolver;
import com.atlas.availability.domain.AvailabilityWindowResolver.ResolvedWindow;
import com.atlas.availability.infrastructure.AvailabilityRepository;
import com.atlas.availability.infrastructure.AvailabilityRepository.OverrideRow;
import com.atlas.availability.infrastructure.AvailabilityRepository.RuleRow;
import com.atlas.shared.error.ApiProblemException;
import java.time.Clock;
import java.time.DateTimeException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AvailabilityService {
    private final AvailabilityRepository availability;
    private final Clock clock;

    public AvailabilityService(AvailabilityRepository availability, Clock clock) {
        this.availability = availability;
        this.clock = clock;
    }

    @Transactional
    public RuleRow createRule(UUID workerUserId, RuleCommand command) {
        requireWorker(workerUserId);
        validateRule(command);
        Instant now = Instant.now(clock);
        RuleRow row = new RuleRow(UUID.randomUUID(), workerUserId, command.dayOfWeek(),
                command.startLocal(), command.endLocal(), normalizeZone(command.timezone()),
                command.validFrom(), command.validUntil(), 0, now, now);
        try {
            availability.insertRule(row);
        } catch (DataIntegrityViolationException exception) {
            throw conflict("AVAILABILITY_RULE_CONFLICT", "Availability rule conflict",
                    "An equivalent recurring availability rule already exists.");
        }
        return row;
    }

    @Transactional(readOnly = true)
    public List<RuleRow> rules(UUID workerUserId) {
        requireWorker(workerUserId);
        return availability.rules(workerUserId);
    }

    @Transactional
    public RuleRow updateRule(UUID workerUserId, UUID ruleId, RuleCommand command, long version) {
        requireWorker(workerUserId);
        validateRule(command);
        if (availability.findRule(workerUserId, ruleId).isEmpty()) throw ruleNotFound();
        try {
            int updated = availability.updateRule(workerUserId, ruleId, version, command.dayOfWeek(),
                    command.startLocal(), command.endLocal(), normalizeZone(command.timezone()),
                    command.validFrom(), command.validUntil(), Instant.now(clock));
            if (updated == 0) throw versionConflict();
        } catch (DataIntegrityViolationException exception) {
            throw conflict("AVAILABILITY_RULE_CONFLICT", "Availability rule conflict",
                    "An equivalent recurring availability rule already exists.");
        }
        return availability.findRule(workerUserId, ruleId).orElseThrow(AvailabilityService::ruleNotFound);
    }

    @Transactional
    public void deleteRule(UUID workerUserId, UUID ruleId) {
        requireWorker(workerUserId);
        if (availability.deleteRule(workerUserId, ruleId) == 0) throw ruleNotFound();
    }

    @Transactional
    public OverrideRow createOverride(UUID workerUserId, OverrideCommand command) {
        requireWorker(workerUserId);
        String type = command.type().trim().toUpperCase();
        if (!type.equals("AVAILABLE") && !type.equals("UNAVAILABLE")) throw invalidOverride();
        if (type.equals("UNAVAILABLE") && (command.startLocal() != null || command.endLocal() != null)) {
            throw invalidOverride();
        }
        if (type.equals("AVAILABLE")
                && (command.startLocal() == null || command.endLocal() == null
                || !command.endLocal().isAfter(command.startLocal()))) {
            throw invalidOverride();
        }
        OverrideRow row = new OverrideRow(UUID.randomUUID(), workerUserId, command.date(), type,
                command.startLocal(), command.endLocal(), normalizeZone(command.timezone()),
                clean(command.note()), Instant.now(clock));
        try {
            availability.insertOverride(row);
        } catch (DataIntegrityViolationException exception) {
            throw conflict("AVAILABILITY_OVERRIDE_CONFLICT", "Availability override conflict",
                    "An equivalent availability override already exists.");
        }
        return row;
    }

    @Transactional(readOnly = true)
    public List<OverrideRow> overrides(UUID workerUserId, LocalDate from, LocalDate until) {
        requireWorker(workerUserId);
        if (until.isBefore(from)) throw badRequest("AVAILABILITY_DATE_RANGE_INVALID",
                "Invalid availability date range", "The end date must not be before the start date.");
        return availability.overrides(workerUserId, from, until);
    }

    @Transactional
    public void deleteOverride(UUID workerUserId, UUID overrideId) {
        requireWorker(workerUserId);
        if (availability.deleteOverride(workerUserId, overrideId) == 0) {
            throw new ApiProblemException(HttpStatus.NOT_FOUND, "AVAILABILITY_OVERRIDE_NOT_FOUND",
                    "Availability override not found", "The requested availability override does not exist.");
        }
    }

    @Transactional(readOnly = true)
    public ResolvedDay resolve(UUID workerUserId, LocalDate date) {
        requireWorker(workerUserId);
        List<OverrideRow> overrides = availability.overridesForDate(workerUserId, date);
        if (overrides.stream().anyMatch(row -> row.type().equals("UNAVAILABLE"))) {
            return new ResolvedDay(date, "OVERRIDE", List.of());
        }
        List<ResolvedWindow> windows;
        if (!overrides.isEmpty()) {
            windows = overrides.stream()
                    .filter(row -> row.type().equals("AVAILABLE"))
                    .map(row -> AvailabilityWindowResolver.resolve(date, row.startLocal(), row.endLocal(),
                            zone(row.timezone())))
                    .toList();
            return new ResolvedDay(date, "OVERRIDE", windows);
        }
        windows = availability.rulesForDate(workerUserId, date).stream()
                .map(row -> AvailabilityWindowResolver.resolve(date, row.startLocal(), row.endLocal(),
                        zone(row.timezone())))
                .toList();
        return new ResolvedDay(date, "RECURRING", windows);
    }

    private void requireWorker(UUID workerUserId) {
        if (!availability.workerExists(workerUserId)) {
            throw new ApiProblemException(HttpStatus.NOT_FOUND, "WORKER_PROFILE_NOT_FOUND",
                    "Worker profile not found", "Create a worker profile before managing availability.");
        }
    }

    private static void validateRule(RuleCommand command) {
        if (command.dayOfWeek() < 1 || command.dayOfWeek() > 7
                || !command.endLocal().isAfter(command.startLocal())) {
            throw badRequest("AVAILABILITY_RULE_INVALID", "Invalid availability rule",
                    "Use ISO day-of-week 1-7 and an end time after the start time.");
        }
        if (command.validFrom() != null && command.validUntil() != null
                && command.validUntil().isBefore(command.validFrom())) {
            throw badRequest("AVAILABILITY_RULE_INVALID", "Invalid availability rule",
                    "The valid-until date must not be before valid-from.");
        }
        normalizeZone(command.timezone());
    }

    private static String normalizeZone(String value) {
        if (value == null || value.isBlank()) {
            throw badRequest("AVAILABILITY_TIMEZONE_INVALID", "Invalid timezone",
                    "Provide a valid IANA timezone.");
        }
        return zone(value.trim()).getId();
    }

    private static ZoneId zone(String value) {
        try {
            return ZoneId.of(value);
        } catch (DateTimeException exception) {
            throw badRequest("AVAILABILITY_TIMEZONE_INVALID", "Invalid timezone",
                    "Provide a valid IANA timezone.");
        }
    }

    private static String clean(String value) {
        if (value == null) return null;
        String cleaned = value.trim();
        return cleaned.isEmpty() ? null : cleaned;
    }

    private static ApiProblemException ruleNotFound() {
        return new ApiProblemException(HttpStatus.NOT_FOUND, "AVAILABILITY_RULE_NOT_FOUND",
                "Availability rule not found", "The requested recurring availability rule does not exist.");
    }

    private static ApiProblemException versionConflict() {
        return conflict("AVAILABILITY_RULE_VERSION_CONFLICT", "Availability rule changed",
                "Reload the availability rule and retry with its current version.");
    }

    private static ApiProblemException invalidOverride() {
        return badRequest("AVAILABILITY_OVERRIDE_INVALID", "Invalid availability override",
                "UNAVAILABLE overrides are full-day; AVAILABLE overrides require a valid start and end time.");
    }

    private static ApiProblemException conflict(String code, String title, String detail) {
        return new ApiProblemException(HttpStatus.CONFLICT, code, title, detail);
    }

    private static ApiProblemException badRequest(String code, String title, String detail) {
        return new ApiProblemException(HttpStatus.BAD_REQUEST, code, title, detail);
    }

    public record RuleCommand(int dayOfWeek, LocalTime startLocal, LocalTime endLocal,
                              String timezone, LocalDate validFrom, LocalDate validUntil) { }

    public record OverrideCommand(LocalDate date, String type, LocalTime startLocal,
                                  LocalTime endLocal, String timezone, String note) { }

    public record ResolvedDay(LocalDate date, String source, List<ResolvedWindow> windows) { }
}
