package com.atlas.identity;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.atlas.identity.application.FixedWindowRateLimiter;
import com.atlas.shared.error.ApiProblemException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import org.junit.jupiter.api.Test;

class FixedWindowRateLimiterTests {
    @Test
    void rejectsAboveLimitAndResetsAfterWindow() {
        MutableClock clock = new MutableClock(Instant.parse("2026-08-30T10:00:00Z"));
        FixedWindowRateLimiter limiter = new FixedWindowRateLimiter(clock);
        limiter.check("login", "actor", 2, Duration.ofMinutes(15));
        limiter.check("login", "actor", 2, Duration.ofMinutes(15));
        assertThatThrownBy(() -> limiter.check("login", "actor", 2, Duration.ofMinutes(15)))
                .isInstanceOf(ApiProblemException.class)
                .extracting(exception -> ((ApiProblemException) exception).code())
                .isEqualTo("RATE_LIMITED");
        clock.advance(Duration.ofMinutes(16));
        assertThatCode(() -> limiter.check("login", "actor", 2, Duration.ofMinutes(15)))
                .doesNotThrowAnyException();
    }

    private static final class MutableClock extends Clock {
        private Instant instant;
        private MutableClock(Instant instant) { this.instant = instant; }
        void advance(Duration duration) { instant = instant.plus(duration); }
        @Override public ZoneId getZone() { return ZoneId.of("UTC"); }
        @Override public Clock withZone(ZoneId zone) { return this; }
        @Override public Instant instant() { return instant; }
    }
}
