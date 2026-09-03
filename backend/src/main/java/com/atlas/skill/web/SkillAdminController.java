package com.atlas.skill.web;

import com.atlas.skill.application.SkillService;
import com.atlas.skill.domain.SkillVerificationStatus;
import com.atlas.skill.infrastructure.SkillRepository.CategoryRow;
import com.atlas.skill.infrastructure.SkillRepository.SkillRow;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.atlas.identity.domain.AtlasPrincipal;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin")
public class SkillAdminController {
    private final SkillService skills;

    public SkillAdminController(SkillService skills) {
        this.skills = skills;
    }

    @PostMapping("/skill-categories")
    ResponseEntity<CategoryRow> createCategory(@Valid @RequestBody CatalogueRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(skills.createCategory(request.name(), request.slug(), request.description()));
    }

    @PostMapping("/skills")
    ResponseEntity<SkillRow> createSkill(@Valid @RequestBody SkillRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(skills.createSkill(request.categoryId(), request.name(), request.slug(), request.description()));
    }

    @PatchMapping("/skills/{skillId}/active")
    SkillRow setActive(@PathVariable UUID skillId, @RequestBody ActiveRequest request) {
        return skills.setSkillActive(skillId, request.active());
    }

    @PatchMapping("/worker-skills/{workerSkillId}/verification")
    SkillService.WorkerSkillView verify(@PathVariable UUID workerSkillId, @AuthenticationPrincipal AtlasPrincipal principal,
                                        @Valid @RequestBody VerificationRequest request) {
        return skills.transitionVerification(principal.requireUserId(), workerSkillId,
                request.status(), request.reason());
    }

    public record CatalogueRequest(
            @NotBlank @Size(max = 120) String name,
            @NotBlank @Pattern(regexp = "^[A-Za-z0-9][A-Za-z0-9-]{1,78}[A-Za-z0-9]$") String slug,
            @Size(max = 1000) String description) { }
    public record SkillRequest(
            @NotNull UUID categoryId,
            @NotBlank @Size(max = 120) String name,
            @NotBlank @Pattern(regexp = "^[A-Za-z0-9][A-Za-z0-9-]{1,78}[A-Za-z0-9]$") String slug,
            @Size(max = 1000) String description) { }
    public record ActiveRequest(boolean active) { }
    public record VerificationRequest(@NotNull SkillVerificationStatus status,
                                      @NotBlank @Size(max = 1000) String reason) { }
}
