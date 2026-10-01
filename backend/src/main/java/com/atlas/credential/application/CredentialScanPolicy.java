package com.atlas.credential.application;

public final class CredentialScanPolicy {
    private CredentialScanPolicy() { }

    public static Decision decide(MalwareScanner.ScanOutcome outcome) {
        return outcome.result() == MalwareScanner.ScanResult.CLEAN
                ? Decision.ACCEPT
                : Decision.QUARANTINE;
    }

    public enum Decision {
        ACCEPT,
        QUARANTINE
    }
}
