package com.atlas.messaging.infrastructure;

import com.atlas.messaging.application.ConsumerEventProcessor;
import com.atlas.messaging.domain.DomainEventEnvelope;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

@Component
@ConditionalOnProperty(name = "atlas.kafka.enabled", havingValue = "true")
public class KafkaDomainEventListener {
    private final ConsumerEventProcessor processor;
    private final ObjectMapper json;
    private final String consumerName;

    public KafkaDomainEventListener(ConsumerEventProcessor processor,
                                    ObjectMapper json,
                                    @Value("${atlas.kafka.consumer-group}") String consumerName) {
        this.processor = processor;
        this.json = json;
        this.consumerName = consumerName;
    }

    @KafkaListener(
            topics = "${atlas.kafka.topic}",
            groupId = "${atlas.kafka.consumer-group}")
    public void onEvent(String payload) {
        DomainEventEnvelope envelope;
        try {
            envelope = json.readValue(payload, DomainEventEnvelope.class);
        } catch (JacksonException exception) {
            throw new IllegalArgumentException("Kafka domain event envelope is invalid JSON", exception);
        }

        processor.process(consumerName, envelope, ignored -> {
            // Phase 20 establishes the durable idempotent consumption boundary.
            // Phase 21 attaches the notification projection inside this transaction.
        });
    }
}
