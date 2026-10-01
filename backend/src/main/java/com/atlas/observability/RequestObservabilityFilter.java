package com.atlas.observability;

import io.micrometer.tracing.Span;
import io.micrometer.tracing.Tracer;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@Order(Ordered.LOWEST_PRECEDENCE - 50)
public class RequestObservabilityFilter extends OncePerRequestFilter {
    private static final Logger log = LoggerFactory.getLogger(RequestObservabilityFilter.class);
    private static final String REQUEST_ID_HEADER = "X-Request-ID";

    private final Tracer tracer;

    public RequestObservabilityFilter(Tracer tracer) {
        this.tracer = tracer;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {
        String requestId = requestId(request.getHeader(REQUEST_ID_HEADER));
        long started = System.nanoTime();
        response.setHeader(REQUEST_ID_HEADER, requestId);

        Span current = tracer.currentSpan();
        String traceId = current == null ? null : current.context().traceId();
        if (traceId != null && !traceId.isBlank()) response.setHeader("X-Trace-ID", traceId);

        MDC.put("requestId", requestId);
        if (traceId != null) MDC.put("traceId", traceId);

        try {
            filterChain.doFilter(request, response);
        } finally {
            long durationMs = (System.nanoTime() - started) / 1_000_000L;
            log.atInfo()
                    .addKeyValue("event", "http_request")
                    .addKeyValue("method", request.getMethod())
                    .addKeyValue("path", request.getRequestURI())
                    .addKeyValue("status", response.getStatus())
                    .addKeyValue("durationMs", durationMs)
                    .log("request_completed");
            MDC.remove("traceId");
            MDC.remove("requestId");
        }
    }

    private static String requestId(String supplied) {
        if (supplied != null) {
            String value = supplied.trim();
            if (!value.isEmpty() && value.length() <= 80 && value.matches("[A-Za-z0-9._:-]+")) {
                return value;
            }
        }
        return UUID.randomUUID().toString();
    }
}
