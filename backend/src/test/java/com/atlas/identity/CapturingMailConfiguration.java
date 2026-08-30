package com.atlas.identity;

import com.atlas.identity.application.PasswordRecoveryMailer;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

@TestConfiguration(proxyBeanMethods = false)
public class CapturingMailConfiguration {
    @Bean
    @Primary
    CapturingPasswordRecoveryMailer capturingPasswordRecoveryMailer() {
        return new CapturingPasswordRecoveryMailer();
    }

    public static class CapturingPasswordRecoveryMailer implements PasswordRecoveryMailer {
        private final ConcurrentHashMap<String, Message> messages = new ConcurrentHashMap<>();

        @Override
        public void sendPasswordReset(String email, String rawToken, Instant expiresAt) {
            messages.put(email, new Message(rawToken, expiresAt));
        }

        public Message messageFor(String email) { return messages.get(email); }
        public record Message(String token, Instant expiresAt) { }
    }
}
