package com.atlas;

import com.atlas.credential.storage.CredentialStorage;
import com.atlas.credential.storage.CredentialStorageException;
import java.net.URI;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

@TestConfiguration(proxyBeanMethods = false)
public class TestcontainersConfiguration {

	@Bean
	@ServiceConnection
	PostgreSQLContainer postgresContainer() {
		DockerImageName image = DockerImageName.parse("postgis/postgis:18-3.6-alpine")
				.asCompatibleSubstituteFor("postgres");
		return new PostgreSQLContainer(image);
	}

	@Bean
	@ServiceConnection(name = "redis")
	GenericContainer<?> redisContainer() {
		return new GenericContainer<>(DockerImageName.parse("redis:8.2.9-alpine")).withExposedPorts(6379);
	}

	@Bean
	InMemoryCredentialStorage credentialStorage() {
		return new InMemoryCredentialStorage();
	}

	public static final class InMemoryCredentialStorage implements CredentialStorage {
		private final Map<String, byte[]> objects = new ConcurrentHashMap<>();

		@Override
		public URI createUploadUrl(String objectKey, String contentType, Duration lifetime) {
			return URI.create("https://storage.test/upload/" + objectKey + "?ttl=" + lifetime.toSeconds());
		}

		@Override
		public URI createDownloadUrl(String objectKey, Duration lifetime) {
			return URI.create("https://storage.test/download/" + objectKey + "?ttl=" + lifetime.toSeconds());
		}

		@Override
		public StoredObject inspect(String objectKey, int prefixLength) {
			byte[] value = objects.get(objectKey);
			if (value == null) throw new CredentialStorageException("Object not found", new IllegalStateException());
			return new StoredObject(value.length, java.util.Arrays.copyOf(value, Math.min(value.length, prefixLength)));
		}

		@Override
		public void delete(String objectKey) { objects.remove(objectKey); }

		public void put(String objectKey, byte[] value) { objects.put(objectKey, value.clone()); }
	}

	@Bean
	@org.springframework.context.annotation.Primary
	com.atlas.identity.application.FirebaseTokenVerifier mockFirebaseTokenVerifier() {
		return new com.atlas.identity.application.FirebaseTokenVerifier() {
			@Override
			public com.atlas.identity.application.FirebaseVerifiedUser verify(String idToken) {
				return verify(idToken, false);
			}

			@Override
			public com.atlas.identity.application.FirebaseVerifiedUser verify(String idToken, boolean checkRevoked) {
				if (idToken == null || idToken.isBlank()) {
					throw new com.atlas.shared.error.ApiProblemException(
							org.springframework.http.HttpStatus.UNAUTHORIZED,
							"MISSING_BEARER_TOKEN", "Missing Bearer Token", "Firebase ID token is required.");
				}
				if (idToken.startsWith("mock:")) {
					String[] parts = idToken.substring(5).split(":", 2);
					String uid = parts[0];
					String email = parts.length > 1 ? parts[1] : uid + "@example.test";
					return new com.atlas.identity.application.FirebaseVerifiedUser(uid, email, true, "Mock User", Map.of());
				}
				if ("invalid-token".equals(idToken)) {
					throw new com.atlas.shared.error.ApiProblemException(
							org.springframework.http.HttpStatus.UNAUTHORIZED,
							"INVALID_FIREBASE_TOKEN", "Invalid Firebase ID Token", "Firebase token validation failed.");
				}
				if ("expired-token".equals(idToken)) {
					throw new com.atlas.shared.error.ApiProblemException(
							org.springframework.http.HttpStatus.UNAUTHORIZED,
							"FIREBASE_TOKEN_EXPIRED", "Firebase ID Token Expired", "Firebase ID token has expired.");
				}
				if ("revoked-token".equals(idToken)) {
					throw new com.atlas.shared.error.ApiProblemException(
							org.springframework.http.HttpStatus.UNAUTHORIZED,
							"FIREBASE_TOKEN_REVOKED", "Firebase ID Token Revoked", "Firebase ID token has been revoked.");
				}
				return new com.atlas.identity.application.FirebaseVerifiedUser(idToken, idToken + "@example.test", true, "Mock User", Map.of());
			}
		};
	}
}
