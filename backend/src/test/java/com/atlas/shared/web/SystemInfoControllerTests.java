package com.atlas.shared.web;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class SystemInfoControllerTests {

    @Test
    void exposesOnlyStableSafeServiceMetadata() {
        SystemInfoController controller = new SystemInfoController("atlas-backend", "0.0.1", "v1");

        SystemInfoController.SystemInfo result = controller.info();

        assertThat(result.service()).isEqualTo("atlas-backend");
        assertThat(result.version()).isEqualTo("0.0.1");
        assertThat(result.apiVersion()).isEqualTo("v1");
        assertThat(result.status()).isEqualTo("UP");
    }
}

