package com.atlas.identity.config;

import java.time.Clock;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
public class IdentitySecurityBeans {
    @Bean
    Clock clock() {
        return Clock.systemUTC();
    }
}
