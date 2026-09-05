package com.atlas.shift.domain;

import com.atlas.skill.domain.SkillProficiency;
import java.time.Instant;
import java.util.UUID;

public record ShiftSkillRequirement(
        UUID id,
        UUID shiftId,
        UUID skillId,
        String skillName,
        String categoryName,
        SkillProficiency minimumProficiency,
        boolean required,
        Instant createdAt
) {}

