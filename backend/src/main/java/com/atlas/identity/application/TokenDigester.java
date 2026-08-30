package com.atlas.identity.application;

import com.atlas.identity.config.AuthProperties;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.util.Base64;
import java.util.HexFormat;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.stereotype.Component;

@Component
public class TokenDigester {
    private final byte[] key;

    public TokenDigester(AuthProperties properties) {
        try {
            key = Base64.getDecoder().decode(properties.tokenHashSecret());
        } catch (IllegalArgumentException exception) {
            throw new IllegalStateException("ATLAS_TOKEN_HASH_SECRET must be valid Base64", exception);
        }
        if (key.length < 32) throw new IllegalStateException("ATLAS_TOKEN_HASH_SECRET must decode to at least 32 bytes");
    }

    public String digest(String rawToken) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(key, "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(rawToken.getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException("HMAC-SHA256 is unavailable", exception);
        }
    }
}
