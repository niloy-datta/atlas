package com.atlas.credential.storage;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.atlas.credential.config.CredentialStorageProperties;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import org.junit.jupiter.api.Test;
import org.springframework.util.unit.DataSize;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;
import org.testcontainers.containers.wait.strategy.Wait;

@Testcontainers
class MinioCredentialStorageIntegrationTests {
    private static final String ACCESS_KEY = "atlas-test-access";
    private static final String SECRET_KEY = "atlas-test-secret-key";

    @Container
    private static final GenericContainer<?> MINIO = new GenericContainer<>(DockerImageName.parse(
            "quay.io/minio/minio:RELEASE.2025-06-13T11-33-47Z"))
            .withEnv("MINIO_ROOT_USER", ACCESS_KEY)
            .withEnv("MINIO_ROOT_PASSWORD", SECRET_KEY)
            .withCommand("server", "/data")
            .withExposedPorts(9000)
            .waitingFor(Wait.forHttp("/minio/health/live").forPort(9000));

    @Test
    void presignedUploadInspectDownloadAndDeleteRoundTrip() throws Exception {
        CredentialStorageProperties properties = new CredentialStorageProperties(
                true,
                "http://" + MINIO.getHost() + ':' + MINIO.getMappedPort(9000),
                ACCESS_KEY,
                SECRET_KEY,
                "atlas-credential-tests",
                DataSize.ofMegabytes(1),
                Duration.ofMinutes(2));
        MinioCredentialStorage storage = new MinioCredentialStorage(properties);
        storage.ensureBucket();

        byte[] payload = "%PDF-1.7\nreal-minio-round-trip".getBytes(StandardCharsets.US_ASCII);
        String objectKey = "credentials/test/opaque-document-id";
        URI uploadUrl = storage.createUploadUrl(objectKey, "application/pdf", Duration.ofMinutes(2));
        HttpClient http = HttpClient.newHttpClient();
        HttpResponse<String> upload = http.send(HttpRequest.newBuilder(uploadUrl)
                .PUT(HttpRequest.BodyPublishers.ofByteArray(payload)).build(),
                HttpResponse.BodyHandlers.ofString());

        assertThat(upload.statusCode()).isBetween(200, 299);
        CredentialStorage.StoredObject stored = storage.inspect(objectKey, 8);
        assertThat(stored.sizeBytes()).isEqualTo(payload.length);
        assertThat(stored.prefix()).containsExactly(java.util.Arrays.copyOf(payload, 8));

        URI downloadUrl = storage.createDownloadUrl(objectKey, Duration.ofMinutes(2));
        HttpResponse<byte[]> download = http.send(HttpRequest.newBuilder(downloadUrl).GET().build(),
                HttpResponse.BodyHandlers.ofByteArray());
        assertThat(download.statusCode()).isEqualTo(200);
        assertThat(download.body()).containsExactly(payload);

        storage.delete(objectKey);
        assertThatThrownBy(() -> storage.inspect(objectKey, 8))
                .isInstanceOf(CredentialStorageException.class);
    }
}
