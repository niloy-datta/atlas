package com.atlas.organization.application;

import com.atlas.organization.domain.OrganizationAction;
import com.atlas.organization.domain.OrganizationRole;
import com.atlas.organization.infrastructure.OrganizationRepository;
import com.atlas.shared.error.ApiProblemException;
import java.util.EnumSet;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class OrganizationAccessPolicy {
    private static final Map<OrganizationRole, EnumSet<OrganizationAction>> PERMISSIONS = Map.of(
            OrganizationRole.OWNER, EnumSet.allOf(OrganizationAction.class),
            OrganizationRole.ADMIN, EnumSet.allOf(OrganizationAction.class),
            OrganizationRole.HIRING_MANAGER, EnumSet.of(OrganizationAction.VIEW,
                    OrganizationAction.PUBLISH_JOBS, OrganizationAction.VIEW_CANDIDATES),
            OrganizationRole.RECRUITER, EnumSet.of(OrganizationAction.VIEW, OrganizationAction.VIEW_CANDIDATES),
            OrganizationRole.VIEWER, EnumSet.of(OrganizationAction.VIEW));

    private final OrganizationRepository organizations;

    public OrganizationAccessPolicy(OrganizationRepository organizations) {
        this.organizations = organizations;
    }

    public OrganizationRole require(UUID organizationId, UUID userId, OrganizationAction action) {
        OrganizationRole role = organizations.memberRole(organizationId, userId)
                .orElseThrow(OrganizationAccessPolicy::notFound);
        if (!PERMISSIONS.get(role).contains(action)) {
            throw new ApiProblemException(HttpStatus.FORBIDDEN, "ORGANIZATION_ACCESS_DENIED",
                    "Organization access denied", "You are not permitted to perform this organization action.");
        }
        return role;
    }

    public static ApiProblemException notFound() {
        return new ApiProblemException(HttpStatus.NOT_FOUND, "ORGANIZATION_NOT_FOUND",
                "Organization not found", "The requested organization does not exist or is not accessible.");
    }
}
