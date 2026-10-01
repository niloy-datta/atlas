package com.atlas.workforce.application;

import com.atlas.organization.application.OrganizationAccessPolicy;
import com.atlas.organization.domain.OrganizationAction;
import com.atlas.shared.error.ApiProblemException;
import com.atlas.workforce.infrastructure.WorkforcePoolRepository;
import com.atlas.workforce.infrastructure.WorkforcePoolRepository.MemberRow;
import com.atlas.workforce.infrastructure.WorkforcePoolRepository.PoolRow;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WorkforcePoolService {
    private final WorkforcePoolRepository pools;
    private final OrganizationAccessPolicy access;
    private final Clock clock;

    public WorkforcePoolService(WorkforcePoolRepository pools, OrganizationAccessPolicy access, Clock clock) {
        this.pools = pools;
        this.access = access;
        this.clock = clock;
    }

    @Transactional
    public PoolRow create(UUID organizationId, UUID actorId, String name, String description) {
        access.require(organizationId, actorId, OrganizationAction.MANAGE_WORKFORCE);
        Instant now = Instant.now(clock);
        PoolRow row = new PoolRow(UUID.randomUUID(), organizationId, requiredText(name), clean(description),
                0, actorId, now, now);
        try {
            pools.insert(row);
        } catch (DataIntegrityViolationException exception) {
            throw poolNameConflict();
        }
        return row;
    }

    @Transactional(readOnly = true)
    public List<PoolRow> list(UUID organizationId, UUID actorId) {
        access.require(organizationId, actorId, OrganizationAction.VIEW);
        return pools.list(organizationId);
    }

    @Transactional(readOnly = true)
    public PoolRow get(UUID organizationId, UUID poolId, UUID actorId) {
        access.require(organizationId, actorId, OrganizationAction.VIEW);
        return requirePool(organizationId, poolId);
    }

    @Transactional
    public PoolRow update(UUID organizationId, UUID poolId, UUID actorId, long expectedVersion,
                          String name, String description) {
        access.require(organizationId, actorId, OrganizationAction.MANAGE_WORKFORCE);
        requirePool(organizationId, poolId);
        try {
            int updated = pools.update(organizationId, poolId, expectedVersion,
                    requiredText(name), clean(description), Instant.now(clock));
            if (updated == 0) throw versionConflict();
        } catch (DataIntegrityViolationException exception) {
            throw poolNameConflict();
        }
        return requirePool(organizationId, poolId);
    }

    @Transactional
    public void delete(UUID organizationId, UUID poolId, UUID actorId) {
        access.require(organizationId, actorId, OrganizationAction.MANAGE_WORKFORCE);
        if (pools.delete(organizationId, poolId) == 0) throw poolNotFound();
    }

    @Transactional
    public MemberRow addMember(UUID organizationId, UUID poolId, UUID actorId,
                               UUID workerUserId, String note) {
        access.require(organizationId, actorId, OrganizationAction.MANAGE_WORKFORCE);
        requirePool(organizationId, poolId);
        pools.findWorker(workerUserId).orElseThrow(WorkforcePoolService::workerNotFound);
        try {
            pools.addMember(organizationId, poolId, workerUserId, actorId, clean(note), Instant.now(clock));
        } catch (DataIntegrityViolationException exception) {
            throw memberConflict();
        }
        return pools.members(organizationId, poolId).stream()
                .filter(member -> member.workerUserId().equals(workerUserId))
                .findFirst()
                .orElseThrow(WorkforcePoolService::workerNotFound);
    }

    @Transactional(readOnly = true)
    public List<MemberRow> members(UUID organizationId, UUID poolId, UUID actorId) {
        access.require(organizationId, actorId, OrganizationAction.VIEW);
        requirePool(organizationId, poolId);
        return pools.members(organizationId, poolId);
    }

    @Transactional
    public void removeMember(UUID organizationId, UUID poolId, UUID actorId, UUID workerUserId) {
        access.require(organizationId, actorId, OrganizationAction.MANAGE_WORKFORCE);
        requirePool(organizationId, poolId);
        if (pools.removeMember(organizationId, poolId, workerUserId) == 0) throw memberNotFound();
    }

    private PoolRow requirePool(UUID organizationId, UUID poolId) {
        return pools.find(organizationId, poolId).orElseThrow(WorkforcePoolService::poolNotFound);
    }

    private static String requiredText(String value) {
        String cleaned = clean(value);
        if (cleaned == null) {
            throw new ApiProblemException(HttpStatus.BAD_REQUEST, "WORKFORCE_POOL_NAME_REQUIRED",
                    "Workforce pool name required", "Provide a non-empty workforce pool name.");
        }
        return cleaned;
    }

    private static String clean(String value) {
        if (value == null) return null;
        String cleaned = value.trim();
        return cleaned.isEmpty() ? null : cleaned;
    }

    private static ApiProblemException poolNotFound() {
        return new ApiProblemException(HttpStatus.NOT_FOUND, "WORKFORCE_POOL_NOT_FOUND",
                "Workforce pool not found", "The requested workforce pool does not exist or is not accessible.");
    }

    private static ApiProblemException workerNotFound() {
        return new ApiProblemException(HttpStatus.NOT_FOUND, "WORKFORCE_POOL_WORKER_NOT_FOUND",
                "Worker not found", "The requested worker does not have a workforce profile.");
    }

    private static ApiProblemException memberNotFound() {
        return new ApiProblemException(HttpStatus.NOT_FOUND, "WORKFORCE_POOL_MEMBER_NOT_FOUND",
                "Pool member not found", "The requested worker is not a member of this workforce pool.");
    }

    private static ApiProblemException poolNameConflict() {
        return new ApiProblemException(HttpStatus.CONFLICT, "WORKFORCE_POOL_NAME_CONFLICT",
                "Workforce pool name conflict", "An organization workforce pool with that name already exists.");
    }

    private static ApiProblemException memberConflict() {
        return new ApiProblemException(HttpStatus.CONFLICT, "WORKFORCE_POOL_MEMBER_CONFLICT",
                "Worker already in pool", "The worker is already a member of this workforce pool.");
    }

    private static ApiProblemException versionConflict() {
        return new ApiProblemException(HttpStatus.CONFLICT, "WORKFORCE_POOL_VERSION_CONFLICT",
                "Workforce pool changed", "Reload the workforce pool and retry with its current version.");
    }
}
