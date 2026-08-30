package com.atlas.shared.web;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/system")
public class SystemInfoController {

    private final SystemInfo systemInfo;

    public SystemInfoController(
            @Value("${spring.application.name}") String service,
            @Value("${info.app.version}") String version,
            @Value("${info.app.api-version}") String apiVersion) {
        this.systemInfo = new SystemInfo(service, version, apiVersion, "UP");
    }

    @GetMapping("/info")
    public SystemInfo info() {
        return systemInfo;
    }

    public record SystemInfo(String service, String version, String apiVersion, String status) {
    }
}

