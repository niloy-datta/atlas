package com.atlas.observability;

import com.atlas.outbox.infrastructure.OutboxRepository;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import java.util.Locale;
import org.springframework.stereotype.Component;

@Component
public class AtlasOperationalMetrics {
    private final MeterRegistry registry;
    private final Counter kafkaPublished;
    private final Counter kafkaFailed;

    public AtlasOperationalMetrics(MeterRegistry registry, OutboxRepository outbox) {
        this.registry = registry;
        this.kafkaPublished = Counter.builder("atlas.kafka.publish")
                .tag("result", "success")
                .description("Kafka outbox events acknowledged by the broker")
                .register(registry);
        this.kafkaFailed = Counter.builder("atlas.kafka.publish")
                .tag("result", "failure")
                .description("Kafka outbox publish failures")
                .register(registry);

        Gauge.builder("atlas.outbox.pending", outbox, value -> (double) value.pendingCount())
                .description("Pending transactional outbox events")
                .register(registry);
    }

    public void kafkaPublished() {
        kafkaPublished.increment();
    }

    public void kafkaFailed() {
        kafkaFailed.increment();
    }

    public void malwareScan(String result) {
        registry.counter("atlas.credential.malware.scan",
                "result", result.toLowerCase(Locale.ROOT)).increment();
    }

    public void notificationCreated() {
        registry.counter("atlas.notification.created").increment();
    }
}
