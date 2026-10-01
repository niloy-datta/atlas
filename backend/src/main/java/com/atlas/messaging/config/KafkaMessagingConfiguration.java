package com.atlas.messaging.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.scheduling.annotation.EnableScheduling;

@Configuration
@EnableKafka
@EnableScheduling
@ConditionalOnProperty(name = "atlas.kafka.enabled", havingValue = "true")
public class KafkaMessagingConfiguration {
}
