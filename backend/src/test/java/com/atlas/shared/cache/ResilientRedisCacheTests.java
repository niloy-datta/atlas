package com.atlas.shared.cache;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import tools.jackson.databind.ObjectMapper;

class ResilientRedisCacheTests {
    @Test
    void cacheHitAvoidsAuthoritativeLoader() {
        StringRedisTemplate redis = mock(StringRedisTemplate.class);
        @SuppressWarnings("unchecked")
        ValueOperations<String, String> values = mock(ValueOperations.class);
        when(redis.opsForValue()).thenReturn(values);
        when(values.get("atlas:test")).thenReturn("\"cached\"");

        AtomicInteger loads = new AtomicInteger();
        ResilientRedisCache cache = new ResilientRedisCache(redis, new ObjectMapper());

        String result = cache.getOrLoad("atlas:test", Duration.ofMinutes(1), String.class, () -> {
            loads.incrementAndGet();
            return "database";
        });

        assertThat(result).isEqualTo("cached");
        assertThat(loads).hasValue(0);
    }

    @Test
    void redisOutageDegradesToAuthoritativeLoader() {
        StringRedisTemplate redis = mock(StringRedisTemplate.class);
        @SuppressWarnings("unchecked")
        ValueOperations<String, String> values = mock(ValueOperations.class);
        when(redis.opsForValue()).thenReturn(values);
        when(values.get("atlas:test")).thenThrow(new RedisConnectionFailureException("redis down"));

        AtomicInteger loads = new AtomicInteger();
        ResilientRedisCache cache = new ResilientRedisCache(redis, new ObjectMapper());

        String result = cache.getOrLoad("atlas:test", Duration.ofMinutes(1), String.class, () -> {
            loads.incrementAndGet();
            return "database";
        });

        assertThat(result).isEqualTo("database");
        assertThat(loads).hasValue(1);
        verify(values).set(eq("atlas:test"), eq("\"database\""), any(Duration.class));
    }

    @Test
    void invalidationFailureDoesNotBreakAuthoritativeMutation() {
        StringRedisTemplate redis = mock(StringRedisTemplate.class);
        when(redis.delete("atlas:public:job:1"))
                .thenThrow(new RedisConnectionFailureException("redis down"));

        ResilientRedisCache cache = new ResilientRedisCache(redis, new ObjectMapper());
        cache.evict("atlas:public:job:1");

        verify(redis).delete("atlas:public:job:1");
    }
}
