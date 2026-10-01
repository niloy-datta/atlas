package com.atlas.workforce.web;

import com.atlas.identity.domain.AtlasPrincipal;
import com.atlas.workforce.application.WorkforcePoolService;
import com.atlas.workforce.infrastructure.WorkforcePoolRepository.MemberRow;
import com.atlas.workforce.infrastructure.WorkforcePoolRepository.PoolRow;
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
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/organizations/{organizationId}/workforce-pools")
public class WorkforcePoolController {
    private final WorkforcePoolService pools;

    public WorkforcePoolController(WorkforcePoolService pools) {
        this.pools = pools;
    }

    @PostMapping
    ResponseEntity<PoolRow> create(@PathVariable UUID organizationId,
                                   @AuthenticationPrincipal AtlasPrincipal principal,
                                   @Valid @RequestBody CreatePoolRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(pools.create(organizationId, userId(principal), request.name(), request.description()));
    }

    @GetMapping
    List<PoolRow> list(@PathVariable UUID organizationId,
                       @AuthenticationPrincipal AtlasPrincipal principal) {
        return pools.list(organizationId, userId(principal));
    }

    @GetMapping("/{poolId}")
    PoolRow get(@PathVariable UUID organizationId, @PathVariable UUID poolId,
                @AuthenticationPrincipal AtlasPrincipal principal) {
        return pools.get(organizationId, poolId, userId(principal));
    }

    @PutMapping("/{poolId}")
    PoolRow update(@PathVariable UUID organizationId, @PathVariable UUID poolId,
                   @AuthenticationPrincipal AtlasPrincipal principal,
                   @Valid @RequestBody UpdatePoolRequest request) {
        return pools.update(organizationId, poolId, userId(principal), request.version(),
                request.name(), request.description());
    }

    @DeleteMapping("/{poolId}")
    ResponseEntity<Void> delete(@PathVariable UUID organizationId, @PathVariable UUID poolId,
                                @AuthenticationPrincipal AtlasPrincipal principal) {
        pools.delete(organizationId, poolId, userId(principal));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{poolId}/members")
    ResponseEntity<MemberRow> addMember(@PathVariable UUID organizationId, @PathVariable UUID poolId,
                                        @AuthenticationPrincipal AtlasPrincipal principal,
                                        @Valid @RequestBody AddMemberRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                pools.addMember(organizationId, poolId, userId(principal), request.workerId(), request.note()));
    }

    @GetMapping("/{poolId}/members")
    List<MemberRow> members(@PathVariable UUID organizationId, @PathVariable UUID poolId,
                            @AuthenticationPrincipal AtlasPrincipal principal) {
        return pools.members(organizationId, poolId, userId(principal));
    }

    @DeleteMapping("/{poolId}/members/{workerId}")
    ResponseEntity<Void> removeMember(@PathVariable UUID organizationId, @PathVariable UUID poolId,
                                      @PathVariable UUID workerId,
                                      @AuthenticationPrincipal AtlasPrincipal principal) {
        pools.removeMember(organizationId, poolId, userId(principal), workerId);
        return ResponseEntity.noContent().build();
    }

    private static UUID userId(AtlasPrincipal principal) {
        return principal.requireUserId();
    }

    public record CreatePoolRequest(
            @NotBlank @Size(max = 120) String name,
            @Size(max = 1000) String description) { }

    public record UpdatePoolRequest(
            @Min(0) long version,
            @NotBlank @Size(max = 120) String name,
            @Size(max = 1000) String description) { }

    public record AddMemberRequest(
            @NotNull UUID workerId,
            @Size(max = 500) String note) { }
}
