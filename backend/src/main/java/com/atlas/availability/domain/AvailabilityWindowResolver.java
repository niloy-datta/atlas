package com.atlas.availability.domain;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;

public final class AvailabilityWindowResolver {
    private AvailabilityWindowResolver() { }

    public static ResolvedWindow resolve(LocalDate date, LocalTime start, LocalTime end, ZoneId zone) {
        if (!end.isAfter(start)) {
            throw new IllegalArgumentException("Availability end time must be after start time");
        }
        ZonedDateTime startsAt = ZonedDateTime.ofLocal(LocalDateTime.of(date, start), zone, null);
        ZonedDateTime endsAt = ZonedDateTime.ofLocal(LocalDateTime.of(date, end), zone, null);
        if (!endsAt.toInstant().isAfter(startsAt.toInstant())) {
            throw new IllegalArgumentException("Resolved availability interval must be positive");
        }
        return new ResolvedWindow(startsAt.toInstant(), endsAt.toInstant(), zone.getId(),
                Duration.between(startsAt.toInstant(), endsAt.toInstant()).toMinutes());
    }

    public record ResolvedWindow(Instant startsAt, Instant endsAt, String timezone, long durationMinutes) { }
}
