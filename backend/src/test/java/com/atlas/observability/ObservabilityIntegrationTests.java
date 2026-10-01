package com.atlas.observability;

import static org.assertj.core.api.Assertions.assertThat;

import com.atlas.TestcontainersConfiguration;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.tracing.Tracer;
import io.opentelemetry.api.OpenTelemetry;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
class ObservabilityIntegrationTests {
    private final OpenTelemetry openTelemetry;
    private final Tracer tracer;
    private final MeterRegistry registry;
    private final AtlasOperationalMetrics metrics;

    @Autowired
    ObservabilityIntegrationTests(OpenTelemetry openTelemetry,
                                  Tracer tracer,
                                  MeterRegistry registry,
                                  AtlasOperationalMetrics metrics) {
        this.openTelemetry = openTelemetry;
        this.tracer = tracer;
        this.registry = registry;
        this.metrics = metrics;
    }

    @Test
    void openTelemetryTracingAndOperationalMetricsAreAvailable() {
        assertThat(openTelemetry).isNotNull();
        assertThat(tracer).isNotNull();

        metrics.kafkaPublished();
        metrics.kafkaFailed();
        metrics.malwareScan("CLEAN");
        metrics.notificationCreated();

        assertThat(registry.find("atlas.kafka.publish").counters()).hasSize(2);
        assertThat(registry.find("atlas.credential.malware.scan")
                .tag("result", "clean").counter()).isNotNull();
        assertThat(registry.find("atlas.notification.created").counter()).isNotNull();
        assertThat(registry.find("atlas.outbox.pending").gauge()).isNotNull();
    }

    @Test
    void sensitiveDataRedactorRemovesBearerSecretsAndEmails() {
        String input = "Authorization=Bearer abc.def.ghi password=hunter2 user=niloy@example.com";

        String redacted = SensitiveDataRedactor.redact(input);

        assertThat(redacted)
                .doesNotContain("abc.def.ghi", "hunter2", "niloy@example.com")
                .contains("[REDACTED]", "[REDACTED_EMAIL]");
    }
}
