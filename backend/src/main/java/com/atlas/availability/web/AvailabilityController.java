package com.atlas.availability.web;

import com.atlas.availability.application.AvailabilityService;
import com.atlas.availability.application.AvailabilityService.OverrideCommand;
import com.atlas.availability.application.AvailabilityService.ResolvedDay;
import com.atlas.availability.application.AvailabilityService.RuleCommand;
import com.atlas.availability.infrastructure.AvailabilityRepository.OverrideRow;
import com.atlas.availability.infrastructure.AvailabilityRepository.RuleRow;
import com.atlas.identity.domain.AtlasPrincipal;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/workers/me/availability")
public class AvailabilityController {
    private final AvailabilityService service;

    public AvailabilityController(AvailabilityService service) {
        this.service = service;
    }

    @PostMapping("/rules")
    ResponseEntity<RuleRow> createRule(@AuthenticationPrincipal AtlasPrincipal principal,
                                       @Valid @RequestBody RuleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.createRule(userId(principal), request.command()));
    }

    @GetMapping("/rules")
    List<RuleRow> rules(@AuthenticationPrincipal AtlasPrincipal principal) {
        return service.rules(userId(principal));
    }

    @PutMapping("/rules/{ruleId}")
    RuleRow updateRule(@AuthenticationPrincipal AtlasPrincipal principal, @PathVariable UUID ruleId,
                       @Valid @RequestBody UpdateRuleRequest request) {
        return service.updateRule(userId(principal), ruleId, request.command(), request.version());
    }

    @DeleteMapping("/rules/{ruleId}")
    ResponseEntity<Void> deleteRule(@AuthenticationPrincipal AtlasPrincipal principal,
                                    @PathVariable UUID ruleId) {
        service.deleteRule(userId(principal), ruleId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/overrides")
    ResponseEntity<OverrideRow> createOverride(@AuthenticationPrincipal AtlasPrincipal principal,
                                               @Valid @RequestBody OverrideRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.createOverride(userId(principal), request.command()));
    }

    @GetMapping("/overrides")
    List<OverrideRow> overrides(@AuthenticationPrincipal AtlasPrincipal principal,
                                @RequestParam LocalDate from, @RequestParam LocalDate until) {
        return service.overrides(userId(principal), from, until);
    }

    @DeleteMapping("/overrides/{overrideId}")
    ResponseEntity<Void> deleteOverride(@AuthenticationPrincipal AtlasPrincipal principal,
                                        @PathVariable UUID overrideId) {
        service.deleteOverride(userId(principal), overrideId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/resolved")
    ResolvedDay resolved(@AuthenticationPrincipal AtlasPrincipal principal, @RequestParam LocalDate date) {
        return service.resolve(userId(principal), date);
    }

    private static UUID userId(AtlasPrincipal principal) {
        return principal.requireUserId();
    }

    public record RuleRequest(
            @Min(1) @Max(7) int dayOfWeek,
            @NotNull LocalTime startLocal,
            @NotNull LocalTime endLocal,
            @NotBlank @Size(max = 64) String timezone,
            LocalDate validFrom,
            LocalDate validUntil) {
        RuleCommand command() {
            return new RuleCommand(dayOfWeek, startLocal, endLocal, timezone, validFrom, validUntil);
        }
    }

    public record UpdateRuleRequest(
            @Min(0) long version,
            @Min(1) @Max(7) int dayOfWeek,
            @NotNull LocalTime startLocal,
            @NotNull LocalTime endLocal,
            @NotBlank @Size(max = 64) String timezone,
            LocalDate validFrom,
            LocalDate validUntil) {
        RuleCommand command() {
            return new RuleCommand(dayOfWeek, startLocal, endLocal, timezone, validFrom, validUntil);
        }
    }

    public record OverrideRequest(
            @NotNull LocalDate date,
            @NotBlank @Size(max = 16) String type,
            LocalTime startLocal,
            LocalTime endLocal,
            @NotBlank @Size(max = 64) String timezone,
            @Size(max = 500) String note) {
        OverrideCommand command() {
            return new OverrideCommand(date, type, startLocal, endLocal, timezone, note);
        }
    }
}
