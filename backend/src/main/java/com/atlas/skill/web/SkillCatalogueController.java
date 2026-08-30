package com.atlas.skill.web;

import com.atlas.skill.application.SkillService;
import com.atlas.skill.infrastructure.SkillRepository.CategoryRow;
import com.atlas.skill.infrastructure.SkillRepository.SkillRow;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/skills")
public class SkillCatalogueController {
    private final SkillService skills;

    public SkillCatalogueController(SkillService skills) {
        this.skills = skills;
    }

    @GetMapping("/categories")
    List<CategoryRow> categories() {
        return skills.categories();
    }

    @GetMapping
    List<SkillRow> search(@RequestParam(required = false) String query,
                          @RequestParam(required = false) UUID categoryId,
                          @RequestParam(defaultValue = "20") @Min(1) @Max(100) int limit) {
        return skills.search(query, categoryId, limit);
    }
}
