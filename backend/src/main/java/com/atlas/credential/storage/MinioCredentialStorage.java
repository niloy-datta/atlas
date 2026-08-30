package com.atlas.credential.storage;

import com.atlas.credential.config.CredentialStorageProperties;
import io.minio.BucketExistsArgs;
import io.minio.GetObjectArgs;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.Http.Method;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.RemoveObjectArgs;
import io.minio.StatObjectArgs;
import jakarta.annotation.PostConstruct;
import java.io.InputStream;
import java.net.URI;
import java.time.Duration;
import java.util.Map;

public class MinioCredentialStorage implements CredentialStorage {
    private final MinioClient client;
    private final CredentialStorageProperties properties;

    public MinioCredentialStorage(CredentialStorageProperties properties) {
        this.properties = properties;
        this.client = MinioClient.builder().endpoint(properties.endpoint())
                .credentials(properties.accessKey(), properties.secretKey()).build();
    }

    @PostConstruct
    void ensureBucket() {
        try {
            if (!client.bucketExists(BucketExistsArgs.builder().bucket(properties.bucket()).build())) {
                client.makeBucket(MakeBucketArgs.builder().bucket(properties.bucket()).build());
            }
        } catch (Exception exception) {
            throw storageFailure("Credential storage bucket initialization failed.", exception);
        }
    }

    @Override
    public URI createUploadUrl(String objectKey, String contentType, Duration lifetime) {
        try {
            return URI.create(client.getPresignedObjectUrl(GetPresignedObjectUrlArgs.builder()
                    .method(Method.PUT).bucket(properties.bucket()).object(objectKey)
                    .expiry(expirySeconds(lifetime)).extraQueryParams(Map.of()).build()));
        } catch (Exception exception) {
            throw storageFailure("Credential upload authorization failed.", exception);
        }
    }

    @Override
    public URI createDownloadUrl(String objectKey, Duration lifetime) {
        try {
            return URI.create(client.getPresignedObjectUrl(GetPresignedObjectUrlArgs.builder()
                    .method(Method.GET).bucket(properties.bucket()).object(objectKey)
                    .expiry(expirySeconds(lifetime)).build()));
        } catch (Exception exception) {
            throw storageFailure("Credential download authorization failed.", exception);
        }
    }

    @Override
    public StoredObject inspect(String objectKey, int prefixLength) {
        try {
            long size = client.statObject(StatObjectArgs.builder().bucket(properties.bucket()).object(objectKey).build())
                    .size();
            byte[] prefix;
            try (InputStream stream = client.getObject(GetObjectArgs.builder().bucket(properties.bucket())
                    .object(objectKey).offset(0L).length((long) Math.min(prefixLength, size)).build())) {
                prefix = stream.readAllBytes();
            }
            return new StoredObject(size, prefix);
        } catch (Exception exception) {
            throw storageFailure("Credential object inspection failed.", exception);
        }
    }

    @Override
    public void delete(String objectKey) {
        try {
            client.removeObject(RemoveObjectArgs.builder().bucket(properties.bucket()).object(objectKey).build());
        } catch (Exception exception) {
            throw storageFailure("Credential object deletion failed.", exception);
        }
    }

    private static int expirySeconds(Duration duration) {
        return Math.toIntExact(Math.max(1, duration.toSeconds()));
    }

    private static CredentialStorageException storageFailure(String message, Exception cause) {
        return new CredentialStorageException(message, cause);
    }
}
