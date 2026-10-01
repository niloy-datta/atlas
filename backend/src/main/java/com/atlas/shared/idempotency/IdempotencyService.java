package com.atlas.shared.idempotency;

import com.atlas.shared.error.ApiProblemException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import java.util.UUID;
import java.util.function.Supplier;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

@Service
public class IdempotencyService {
    private static final Duration RETENTION = Duration.ofHours(24);

    private final IdempotencyRepository records;
    private final ObjectMapper json;
    private final Clock clock;

    public IdempotencyService(IdempotencyRepository records, ObjectMapper json, Clock clock) {
        this.records = records;
        this.json = json;
        this.clock = clock;
    }

    @Transactional
    public <T> Result<T> execute(UUID actorUserId, String operation, String rawKey,
                                 Object requestPayload, Class<T> responseType,
                                 Supplier<T> action) {
        String key = normalizeKey(rawKey);
        String requestHash = hash(requestPayload);
        Instant now = Instant.now(clock);
        UUID recordId = UUID.randomUUID();

        if (records.tryClaim(recordId, actorUserId, operation, key, requestHash,
                now, now.plus(RETENTION))) {
            T value = action.get();
            records.complete(recordId, write(value), Instant.now(clock));
            return new Result<>(value, false);
        }

        IdempotencyRepository.RecordRow existing = records.findForUpdate(actorUserId, operation, key)
                .orElseThrow(IdempotencyService::inProgress);
        if (!existing.requestHash().equals(requestHash)) {
            throw new ApiProblemException(HttpStatus.CONFLICT, "IDEMPOTENCY_KEY_REUSED",
                    "Idempotency key reused",
                    "This idempotency key was already used with a different request payload.");
        }
        if (!"COMPLETED".equals(existing.state()) || existing.responseBody() == null) {
            throw inProgress();
        }
        return new Result<>(read(existing.responseBody(), responseType), true);
    }

    private String hash(Object value) {
        try {
            byte[] encoded = json.writeValueAsBytes(value);
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(encoded));
        } catch (JacksonException | NoSuchAlgorithmException exception) {
            throw new IllegalStateException("Could not hash idempotent request", exception);
        }
    }

    private String write(Object value) {
        try {
            return json.writeValueAsString(value);
        } catch (JacksonException exception) {
            throw new IllegalStateException("Could not persist idempotent response", exception);
        }
    }

    private <T> T read(String value, Class<T> type) {
        try {
            return json.readValue(value.getBytes(StandardCharsets.UTF_8), type);
        } catch (JacksonException exception) {
            throw new IllegalStateException("Stored idempotent response is invalid", exception);
        }
    }

    private static String normalizeKey(String value) {
        if (value == null || value.isBlank() || value.length() > 160) {
            throw new ApiProblemException(HttpStatus.BAD_REQUEST, "IDEMPOTENCY_KEY_INVALID",
                    "Invalid idempotency key",
                    "Provide a non-empty Idempotency-Key header no longer than 160 characters.");
        }
        return value.trim();
    }

    private static ApiProblemException inProgress() {
        return new ApiProblemException(HttpStatus.CONFLICT, "IDEMPOTENCY_REQUEST_IN_PROGRESS",
                "Idempotent request in progress",
                "A request with this idempotency key is already being processed.");
    }

    public record Result<T>(T value, boolean replayed) { }
}
