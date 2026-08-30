package com.atlas.identity.application;

import com.atlas.shared.error.ApiProblemException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class FixedWindowRateLimiter {
    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();
    private final Clock clock;

    public FixedWindowRateLimiter(Clock clock) { this.clock = clock; }

    public void check(String scope, String key, int limit, Duration duration) {
        Instant now = Instant.now(clock);
        Window window = windows.compute(scope + ':' + key, (ignored, current) -> {
            if (current == null || !current.endsAt().isAfter(now)) {
                return new Window(new AtomicInteger(1), now.plus(duration));
            }
            current.count().incrementAndGet();
            return current;
        });
        if (window.count().get() > limit) {
            throw new ApiProblemException(HttpStatus.TOO_MANY_REQUESTS, "RATE_LIMITED",
                    "Too many requests", "Try again after the current rate-limit window.");
        }
    }

    private record Window(AtomicInteger count, Instant endsAt) { }
}
