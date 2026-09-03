package com.atlas.identity.infrastructure;

import com.atlas.identity.application.FirebaseTokenVerifier;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.FirebaseAuth;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;

@Configuration(proxyBeanMethods = false)
@EnableConfigurationProperties(FirebaseProperties.class)
public class FirebaseConfiguration {

    private static final Logger log = LoggerFactory.getLogger(FirebaseConfiguration.class);

    @Bean
    @ConditionalOnMissingBean(FirebaseApp.class)
    public FirebaseApp firebaseApp(FirebaseProperties properties) throws IOException {
        if (!FirebaseApp.getApps().isEmpty()) {
            return FirebaseApp.getInstance();
        }

        FirebaseOptions.Builder builder = FirebaseOptions.builder()
                .setProjectId(properties.projectId());

        // 1. Check explicit credentials path
        if (properties.credentialsPath() != null && !properties.credentialsPath().isBlank()) {
            Path path = Path.of(properties.credentialsPath());
            if (Files.exists(path)) {
                try (InputStream stream = new FileInputStream(path.toFile())) {
                    builder.setCredentials(GoogleCredentials.fromStream(stream));
                    log.info("Initialized FirebaseApp using credentials file from {}", properties.credentialsPath());
                    return FirebaseApp.initializeApp(builder.build());
                }
            } else {
                log.warn("Configured Firebase credentials path not found: {}", properties.credentialsPath());
            }
        }

        // 2. Check GOOGLE_APPLICATION_CREDENTIALS or Application Default Credentials
        try {
            GoogleCredentials credentials = GoogleCredentials.getApplicationDefault();
            builder.setCredentials(credentials);
            log.info("Initialized FirebaseApp using Google Application Default Credentials");
            return FirebaseApp.initializeApp(builder.build());
        } catch (IOException e) {
            log.info("Google Application Default Credentials not found ({})", e.getMessage());
        }

        // 3. Check emulator host or local development fallback
        String emulatorHost = System.getenv("FIREBASE_AUTH_EMULATOR_HOST");
        if (emulatorHost != null || properties.emulatorHost() != null) {
            log.info("Initializing FirebaseApp for emulator environment");
            builder.setCredentials(new EmulatorMockCredentials());
            return FirebaseApp.initializeApp(builder.build());
        }

        // 4. Standalone fallback for testing/local dev without cloud credentials
        log.warn("Initializing FirebaseApp with development credentials fallback");
        builder.setCredentials(new EmulatorMockCredentials());
        return FirebaseApp.initializeApp(builder.build());
    }

    @Bean
    @ConditionalOnMissingBean(FirebaseAuth.class)
    public FirebaseAuth firebaseAuth(FirebaseApp firebaseApp) {
        return FirebaseAuth.getInstance(firebaseApp);
    }

    @Bean
    @ConditionalOnMissingBean(FirebaseTokenVerifier.class)
    public FirebaseTokenVerifier firebaseTokenVerifier(FirebaseAuth firebaseAuth) {
        return new FirebaseAdminTokenVerifier(firebaseAuth);
    }

    private static class EmulatorMockCredentials extends GoogleCredentials {
        @Override
        public void refresh() {}
    }
}
