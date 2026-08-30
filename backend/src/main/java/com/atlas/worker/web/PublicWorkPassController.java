package com.atlas.worker.web;

import com.atlas.worker.application.WorkerProfileService;
import jakarta.validation.constraints.Pattern;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/v1/work-pass")
public class PublicWorkPassController {
    private final WorkerProfileService profiles;

    public PublicWorkPassController(WorkerProfileService profiles) { this.profiles = profiles; }

    @GetMapping("/{handle}")
    WorkerProfileService.PublicWorkPass workPass(
            @PathVariable @Pattern(regexp = "^[A-Za-z0-9][A-Za-z0-9-]{1,38}[A-Za-z0-9]$") String handle) {
        return profiles.publicWorkPass(handle);
    }
}
