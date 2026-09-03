package com.atlas.skill.web;

import com.atlas.skill.application.SkillService;
import com.atlas.skill.domain.SkillEvidenceType;
import com.atlas.skill.domain.SkillProficiency;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.atlas.identity.domain.AtlasPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/workers/me/skills")
public class WorkerSkillController {
    private final SkillService skills;

    public WorkerSkillController(SkillService skills) {
        this.skills = skills;
    }

    @GetMapping
    List<SkillService.WorkerSkillView> list(@AuthenticationPrincipal AtlasPrincipal principal) {
        return skills.workerSkills(userId(principal));
    }

    @PostMapping
    ResponseEntity<SkillService.WorkerSkillView> declare(@AuthenticationPrincipal AtlasPrincipal principal,
                                                         @Valid @RequestBody DeclarationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(skills.declare(userId(principal), request.skillId(), request.proficiency()));
    }

    @PatchMapping("/{workerSkillId}")
    SkillService.WorkerSkillView update(@PathVariable UUID workerSkillId, @AuthenticationPrincipal AtlasPrincipal principal,
                                        @Valid @RequestBody ProficiencyRequest request) {
        return skills.updateProficiency(userId(principal), workerSkillId, request.version(), request.proficiency());
    }

    @DeleteMapping("/{workerSkillId}")
    ResponseEntity<Void> remove(@PathVariable UUID workerSkillId, @AuthenticationPrincipal AtlasPrincipal principal) {
        skills.remove(userId(principal), workerSkillId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{workerSkillId}/evidence")
    SkillService.WorkerSkillView submitEvidence(@PathVariable UUID workerSkillId, @AuthenticationPrincipal AtlasPrincipal principal,
                                                @Valid @RequestBody EvidenceRequest request) {
        return skills.submitEvidence(userId(principal), workerSkillId, request.evidenceType(), request.evidenceReference());
    }

    private static UUID userId(AtlasPrincipal principal) { return principal.requireUserId(); }

    public record DeclarationRequest(@NotNull UUID skillId, @NotNull SkillProficiency proficiency) { }
    public record ProficiencyRequest(@Min(0) long version, @NotNull SkillProficiency proficiency) { }
    public record EvidenceRequest(@NotNull SkillEvidenceType evidenceType,
                                  @NotBlank @Size(max = 500) String evidenceReference) { }
}
