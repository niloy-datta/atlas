package com.atlas.availability;

import static org.assertj.core.api.Assertions.assertThat;

import com.atlas.availability.domain.AvailabilityWindowResolver;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import org.junit.jupiter.api.Test;

class AvailabilityWindowResolverTests {
    @Test
    void springDstGapProducesRealElapsedDuration() {
        var window = AvailabilityWindowResolver.resolve(
                LocalDate.of(2026, 3, 29), LocalTime.of(0, 30), LocalTime.of(3, 30),
                ZoneId.of("Europe/London"));
        assertThat(window.durationMinutes()).isEqualTo(120);
    }

    @Test
    void autumnDstOverlapProducesRealElapsedDuration() {
        var window = AvailabilityWindowResolver.resolve(
                LocalDate.of(2026, 10, 25), LocalTime.of(0, 30), LocalTime.of(3, 30),
                ZoneId.of("Europe/London"));
        assertThat(window.durationMinutes()).isEqualTo(240);
    }

    @Test
    void nonDstTimezoneKeepsWallClockDuration() {
        var window = AvailabilityWindowResolver.resolve(
                LocalDate.of(2026, 10, 25), LocalTime.of(9, 0), LocalTime.of(17, 0),
                ZoneId.of("Asia/Dhaka"));
        assertThat(window.durationMinutes()).isEqualTo(480);
    }
}
