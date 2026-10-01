package com.atlas.credential;

import static org.assertj.core.api.Assertions.assertThat;

import com.atlas.credential.application.CredentialScanPolicy;
import com.atlas.credential.application.LocalMalwareScanner;
import com.atlas.credential.application.MalwareScanner;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;

class CredentialScanPolicyTests {
    @Test
    void scannerErrorFailsClosedToQuarantine() {
        var outcome = MalwareScanner.ScanOutcome.error("CLAMAV", "scanner unavailable");
        assertThat(CredentialScanPolicy.decide(outcome))
                .isEqualTo(CredentialScanPolicy.Decision.QUARANTINE);
    }

    @Test
    void infectedContentFailsClosedToQuarantine() {
        var outcome = MalwareScanner.ScanOutcome.infected("CLAMAV", "Eicar-Test-Signature FOUND");
        assertThat(CredentialScanPolicy.decide(outcome))
                .isEqualTo(CredentialScanPolicy.Decision.QUARANTINE);
    }

    @Test
    void localScannerChecksFullContentNotOnlyInitialPrefix() {
        byte[] prefix = "%PDF-1.7\n".getBytes(StandardCharsets.US_ASCII);
        byte[] padding = new byte[4096];
        byte[] signature = "EICAR-STANDARD-ANTIVIRUS-TEST-FILE".getBytes(StandardCharsets.US_ASCII);
        byte[] content = new byte[prefix.length + padding.length + signature.length];
        System.arraycopy(prefix, 0, content, 0, prefix.length);
        System.arraycopy(padding, 0, content, prefix.length, padding.length);
        System.arraycopy(signature, 0, content, prefix.length + padding.length, signature.length);

        var outcome = new LocalMalwareScanner().scan(content);

        assertThat(outcome.result()).isEqualTo(MalwareScanner.ScanResult.INFECTED);
        assertThat(CredentialScanPolicy.decide(outcome))
                .isEqualTo(CredentialScanPolicy.Decision.QUARANTINE);
    }
}
