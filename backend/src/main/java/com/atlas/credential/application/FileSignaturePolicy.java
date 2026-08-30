package com.atlas.credential.application;

import com.atlas.shared.error.ApiProblemException;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import org.springframework.http.HttpStatus;

public final class FileSignaturePolicy {
    private static final Set<String> ALLOWED = Set.of("application/pdf", "image/png", "image/jpeg");
    private static final Map<String, Set<String>> EXTENSIONS = Map.of(
            "application/pdf", Set.of("pdf"), "image/png", Set.of("png"), "image/jpeg", Set.of("jpg", "jpeg"));

    private FileSignaturePolicy() { }

    public static void validateDeclaration(String filename, String contentType) {
        String normalized = contentType.toLowerCase(Locale.ROOT);
        if (!ALLOWED.contains(normalized) || !EXTENSIONS.get(normalized).contains(extension(filename))) throw invalid();
    }

    public static String detect(byte[] bytes) {
        if (startsWith(bytes, "%PDF-".getBytes(StandardCharsets.US_ASCII))) return "application/pdf";
        if (startsWith(bytes, new byte[]{(byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a})) return "image/png";
        if (startsWith(bytes, new byte[]{(byte) 0xff, (byte) 0xd8, (byte) 0xff})) return "image/jpeg";
        throw invalid();
    }

    private static String extension(String filename) {
        int dot = filename.lastIndexOf('.');
        return dot < 0 ? "" : filename.substring(dot + 1).toLowerCase(Locale.ROOT);
    }

    private static boolean startsWith(byte[] value, byte[] prefix) {
        if (value.length < prefix.length) return false;
        for (int i = 0; i < prefix.length; i++) if (value[i] != prefix[i]) return false;
        return true;
    }

    private static ApiProblemException invalid() {
        return new ApiProblemException(HttpStatus.BAD_REQUEST, "CREDENTIAL_FILE_INVALID",
                "Credential file rejected", "The file type, extension, or detected signature is not allowed.");
    }
}
