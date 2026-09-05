package com.atlas.job.domain;

import com.atlas.skill.domain.SkillProficiency;
import java.time.Instant;
import java.util.UUID;

public record JobSkillRequirement(
        UUID id,
        UUID jobId,
        UUID skillId,
        String skillName,
        String categoryName,
        SkillProficiency minimumProficiency,
        boolean required,
        Instant createdAt
) {}
