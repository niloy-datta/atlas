package com.atlas.search.infrastructure;

import com.atlas.search.application.SearchProjectionStore;
import com.atlas.search.domain.ProjectionDocument;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.HashSet;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Component
@ConditionalOnProperty(name = "atlas.opensearch.enabled", havingValue = "true")
public class HttpOpenSearchProjectionStore implements SearchProjectionStore {
    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(3))
            .build();
    private final ObjectMapper json;
    private final String endpoint;
    private final String index;
    private final String authorization;

    public HttpOpenSearchProjectionStore(
            ObjectMapper json,
            @Value("${atlas.opensearch.endpoint}") String endpoint,
            @Value("${atlas.opensearch.index}") String index,
            @Value("${atlas.opensearch.username:}") String username,
            @Value("${atlas.opensearch.password:}") String password) {
        this.json = json;
        this.endpoint = endpoint.replaceAll("/+$", "");
        this.index = index;
        this.authorization = username == null || username.isBlank()
                ? null
                : "Basic " + Base64.getEncoder().encodeToString(
                        (username + ":" + password).getBytes(StandardCharsets.UTF_8));
    }

    @Override
    public void recreateIndex() {
        send("DELETE", "/" + index, null, Set.of(200, 404));
        String body = """
                {
                  "settings": {"index": {"number_of_shards": 1, "number_of_replicas": 0}},
                  "mappings": {
                    "dynamic": true,
                    "properties": {
                      "entityType": {"type": "keyword"},
                      "title": {"type": "text"},
                      "fullName": {"type": "text"},
                      "headline": {"type": "text"},
                      "handle": {"type": "keyword"},
                      "locationName": {"type": "text"}
                    }
                  }
                }
                """;
        send("PUT", "/" + index, body, Set.of(200));
    }

    @Override
    public void upsert(ProjectionDocument document) {
        try {
            send("PUT", "/" + index + "/_doc/" + encode(document.id()),
                    json.writeValueAsString(document.source()), Set.of(200, 201));
        } catch (JacksonException exception) {
            throw new IllegalStateException("Could not serialize OpenSearch projection", exception);
        }
    }

    @Override
    public void delete(String id) {
        send("DELETE", "/" + index + "/_doc/" + encode(id), null, Set.of(200, 404));
    }

    @Override
    public Set<String> ids() {
        String response = send("POST", "/" + index + "/_search",
                """
                {"size":10000,"_source":false,"query":{"match_all":{}}}
                """,
                Set.of(200, 404));
        if (response == null || response.isBlank()) return Set.of();
        try {
            JsonNode root = json.readTree(response);
            JsonNode hits = root.path("hits").path("hits");
            Set<String> ids = new HashSet<>();
            if (hits.isArray()) {
                hits.forEach(hit -> {
                    JsonNode id = hit.get("_id");
                    if (id != null) ids.add(id.asText());
                });
            }
            return Set.copyOf(ids);
        } catch (JacksonException exception) {
            throw new IllegalStateException("OpenSearch ID response is invalid JSON", exception);
        }
    }

    private String send(String method, String path, String body, Set<Integer> accepted) {
        HttpRequest.Builder request = HttpRequest.newBuilder(URI.create(endpoint + path))
                .timeout(Duration.ofSeconds(10))
                .header("Accept", "application/json");
        if (authorization != null) request.header("Authorization", authorization);
        if (body != null) request.header("Content-Type", "application/json");

        request.method(method, body == null
                ? HttpRequest.BodyPublishers.noBody()
                : HttpRequest.BodyPublishers.ofString(body));

        try {
            HttpResponse<String> response = http.send(
                    request.build(), HttpResponse.BodyHandlers.ofString());
            if (!accepted.contains(response.statusCode())) {
                throw new IllegalStateException(
                        "OpenSearch " + method + " " + path +
                        " returned " + response.statusCode() + ": " + response.body());
            }
            return response.body();
        } catch (IOException exception) {
            throw new IllegalStateException("OpenSearch request failed", exception);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("OpenSearch request interrupted", exception);
        }
    }

    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
