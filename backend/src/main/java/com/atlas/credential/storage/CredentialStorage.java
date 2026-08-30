package com.atlas.credential.storage;

import java.net.URI;
import java.time.Duration;

public interface CredentialStorage {
    URI createUploadUrl(String objectKey, String contentType, Duration lifetime);
    URI createDownloadUrl(String objectKey, Duration lifetime);
    StoredObject inspect(String objectKey, int prefixLength);
    void delete(String objectKey);

    record StoredObject(long sizeBytes, byte[] prefix) { }
}
