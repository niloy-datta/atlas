package com.atlas.messaging.infrastructure;

import com.atlas.messaging.domain.DomainEventEnvelope;
import com.atlas.outbox.infrastructure.OutboxRepository;
import java.time.Clock;
import java.time.Instant;
import java.util.concurrent.TimeUnit;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

@Component
@ConditionalOnProperty(name = "atlas.kafka.enabled", havingValue = "true")
public class OutboxKafkaPublisher {
    private final OutboxRepository outbox;
    private final KafkaTemplate<String, String> kafka;
    private final ObjectMapper json;
    private final Clock clock;
    private final String topic;

    public OutboxKafkaPublisher(OutboxRepository outbox,
                                KafkaTemplate<String, String> kafka,
                                ObjectMapper json,
                                Clock clock,
                                @Value("${atlas.kafka.topic}") String topic) {
        this.outbox = outbox;
        this.kafka = kafka;
        this.json = json;
        this.clock = clock;
        this.topic = topic;
    }

    @Scheduled(fixedDelayString = "${atlas.kafka.publish-delay-ms:1000}")
    public void publishPending() {
        for (var event : outbox.pending(100)) {
            try {
                DomainEventEnvelope envelope = new DomainEventEnvelope(
                        event.id(),
                        event.aggregateType(),
                        event.aggregateId(),
                        event.sequenceNo(),
                        event.eventType(),
                        event.payload(),
                        event.occurredAt());
                String encoded = json.writeValueAsString(envelope);

                kafka.send(topic, event.aggregateId().toString(), encoded)
                        .get(10, TimeUnit.SECONDS);

                outbox.markPublished(event.id(), Instant.now(clock));
            } catch (Exception exception) {
                outbox.markFailed(event.id(), truncate(rootMessage(exception)));
            }
        }
    }

    private static String rootMessage(Exception exception) {
        Throwable current = exception;
        while (current.getCause() != null) current = current.getCause();
        return current.getClass().getSimpleName() + ": " +
                (current.getMessage() == null ? "unknown Kafka publish error" : current.getMessage());
    }

    private static String truncate(String value) {
        return value.length() <= 2000 ? value : value.substring(0, 2000);
    }
}
