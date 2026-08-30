package com.atlas.credential.config;

import com.atlas.credential.storage.CredentialStorage;
import com.atlas.credential.storage.MinioCredentialStorage;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
@ConditionalOnProperty(name = "atlas.credential-storage.enabled", havingValue = "true", matchIfMissing = true)
public class CredentialStorageConfiguration {
    @Bean
    @ConditionalOnMissingBean(CredentialStorage.class)
    CredentialStorage credentialStorage(CredentialStorageProperties properties) {
        return new MinioCredentialStorage(properties);
    }
}
