package com.atlas.shared.cache;

import java.time.Duration;
import java.util.function.Supplier;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

@Component
public class ResilientRedisCache {
    private final StringRedisTemplate redis;
    private final ObjectMapper json;

    public ResilientRedisCache(StringRedisTemplate redis, ObjectMapper json) {
        this.redis = redis;
        this.json = json;
    }

    public <T> T getOrLoad(String key, Duration ttl, Class<T> type, Supplier<T> loader) {
        try {
            String cached = redis.opsForValue().get(key);
            if (cached != null) {
                return json.readValue(cached, type);
            }
        } catch (RuntimeException ignored) {
            // Redis is an optimization; source-of-truth reads must still succeed.
        }

        T value = loader.get();

        try {
            redis.opsForValue().set(key, json.writeValueAsString(value), ttl);
        } catch (RuntimeException ignored) {
            // Degrade cleanly when Redis is unavailable or serialization fails.
        }

        return value;
    }

    public void evict(String key) {
        try {
            redis.delete(key);
        } catch (RuntimeException ignored) {
            // Cache invalidation failure must not break the authoritative mutation.
        }
    }
}
