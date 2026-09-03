package com.atlas.skill.web;

import com.atlas.skill.application.SkillService;
import com.atlas.skill.domain.EndorsementRelationship;
import com.atlas.skill.infrastructure.SkillRepository.EndorsementRow;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.atlas.identity.domain.AtlasPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/worker-skills")
public class SkillEndorsementController {
    private final SkillService skills;

    public SkillEndorsementController(SkillService skills) {
        this.skills = skills;
    }

    @PostMapping("/{workerSkillId}/endorsements")
    ResponseEntity<EndorsementRow> endorse(@PathVariable UUID workerSkillId, @AuthenticationPrincipal AtlasPrincipal principal,
                                           @Valid @RequestBody EndorsementRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(skills.endorse(principal.requireUserId(),
                workerSkillId, request.relationship(), request.comment()));
    }

    public record EndorsementRequest(@NotNull EndorsementRelationship relationship,
                                     @Size(max = 500) String comment) { }
}
