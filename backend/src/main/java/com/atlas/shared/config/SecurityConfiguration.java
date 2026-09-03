package com.atlas.shared.config;

import com.atlas.identity.config.AuthProperties;
import com.atlas.identity.infrastructure.FirebaseAuthenticationFilter;
import java.util.Map;
import java.util.List;
import tools.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration(proxyBeanMethods = false)
public class SecurityConfiguration {
    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, FirebaseAuthenticationFilter firebaseAuthenticationFilter,
                                            ObjectMapper objectMapper) throws Exception {
        return http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> { })
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())
                .logout(logout -> logout.disable())
                .requestCache(cache -> cache.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .addFilterBefore(firebaseAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .exceptionHandling(errors -> errors
                        .authenticationEntryPoint((request, response, exception) -> writeProblem(
                                objectMapper, response, request.getRequestURI(), 401,
                                "AUTHENTICATION_REQUIRED", "Authentication required"))
                        .accessDeniedHandler((request, response, exception) -> writeProblem(
                                objectMapper, response, request.getRequestURI(), 403,
                                "ACCESS_DENIED", "Access denied")))
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers("/api/v1/system/info", "/api-docs", "/api-docs/**", "/swagger-ui/**", "/swagger-ui.html",
                                "/actuator/health", "/actuator/health/**", "/actuator/info").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/work-pass/*").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/skills", "/api/v1/skills/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/public/credentials/*").permitAll()
                        .requestMatchers("/api/v1/auth/bootstrap").authenticated()
                        .requestMatchers("/api/v1/auth/me").authenticated()
                        .requestMatchers("/api/v1/workers/me/**").hasRole("WORKER")
                        .requestMatchers("/api/v1/admin/**").hasRole("PLATFORM_ADMIN")
                        .requestMatchers("/api/v1/credential-documents/**").authenticated()
                        .requestMatchers("/api/v1/worker-skills/**").authenticated()
                        .requestMatchers("/api/v1/organizations/**")
                        .hasAnyRole("EMPLOYER_ADMIN", "EMPLOYER_MEMBER")
                        .requestMatchers("/api/v1/auth/**").authenticated()
                        .anyRequest().denyAll())
                .build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource(AuthProperties properties) {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(properties.allowedOrigins());
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "If-Match", "X-CSRF-TOKEN", "Idempotency-Key"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    private static void writeProblem(ObjectMapper mapper, jakarta.servlet.http.HttpServletResponse response,
                                     String instance, int status, String code, String title) throws java.io.IOException {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        mapper.writeValue(response.getOutputStream(), Map.of(
                "type", "https://atlas.example/problems/" + code.toLowerCase().replace('_', '-'),
                "title", title,
                "status", status,
                "code", code,
                "detail", title + ".",
                "instance", instance,
                "traceId", "unavailable"));
    }
}
