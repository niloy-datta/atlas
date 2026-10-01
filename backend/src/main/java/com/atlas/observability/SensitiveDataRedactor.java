package com.atlas.observability;

import java.util.regex.Pattern;

public final class SensitiveDataRedactor {
    private static final Pattern BEARER =
            Pattern.compile("(?i)bearer\\s+[A-Za-z0-9._~+/-]+=*");
    private static final Pattern SECRET_FIELD =
            Pattern.compile("(?i)(password|secret|token|authorization|credentialNumber)\\s*[=:]\\s*[^,\\s]+");
    private static final Pattern EMAIL =
            Pattern.compile("[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}");

    private SensitiveDataRedactor() { }

    public static String redact(String value) {
        if (value == null) return null;
        String redacted = BEARER.matcher(value).replaceAll("Bearer [REDACTED]");
        redacted = SECRET_FIELD.matcher(redacted).replaceAll("$1=[REDACTED]");
        return EMAIL.matcher(redacted).replaceAll("[REDACTED_EMAIL]");
    }
}
