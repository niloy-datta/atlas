package com.atlas.organization.application;

import com.atlas.identity.application.IdentityReadService;
import com.atlas.organization.domain.OrganizationAction;
import com.atlas.organization.domain.OrganizationRole;
import com.atlas.organization.domain.OrganizationVerificationStatus;
import com.atlas.organization.infrastructure.OrganizationRepository;
import com.atlas.organization.infrastructure.OrganizationRepository.InvitationRow;
import com.atlas.organization.infrastructure.OrganizationRepository.LocationRow;
import com.atlas.organization.infrastructure.OrganizationRepository.MemberRow;
import com.atlas.organization.infrastructure.OrganizationRepository.OrganizationRow;
import com.atlas.organization.infrastructure.OrganizationRepository.OrganizationSummary;
import com.atlas.shared.error.ApiProblemException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrganizationService {
    private final OrganizationRepository organizations;
    private final OrganizationAccessPolicy access;
    private final IdentityReadService identities;
    private final Clock clock;

    public OrganizationService(OrganizationRepository organizations, OrganizationAccessPolicy access,
                               IdentityReadService identities, Clock clock) {
        this.organizations = organizations;
        this.access = access;
        this.identities = identities;
        this.clock = clock;
    }

    @Transactional
    public OrganizationView create(UUID creatorId, String name, String slug, String description) {
        Instant now = Instant.now(clock);
        OrganizationRow row = new OrganizationRow(UUID.randomUUID(), clean(name), normalizeSlug(slug), clean(description),
                OrganizationVerificationStatus.UNVERIFIED, 0, now, now);
        try {
            organizations.create(row, creatorId);
        } catch (DataIntegrityViolationException exception) {
            throw conflict("ORGANIZATION_SLUG_UNAVAILABLE", "Organization slug unavailable",
                    "That organization slug is already in use.");
        }
        return view(row, OrganizationRole.OWNER);
    }

    @Transactional(readOnly = true)
    public List<OrganizationSummary> list(UUID userId) {
        return organizations.listForUser(userId);
    }

    @Transactional(readOnly = true)
    public OrganizationView get(UUID organizationId, UUID userId) {
        OrganizationRole role = access.require(organizationId, userId, OrganizationAction.VIEW);
        return view(requireOrganization(organizationId), role);
    }

    @Transactional
    public OrganizationView update(UUID organizationId, UUID userId, long version,
                                   String name, String slug, String description) {
        OrganizationRole role = access.require(organizationId, userId, OrganizationAction.UPDATE_PROFILE);
        try {
            if (organizations.update(organizationId, version, clean(name), normalizeSlug(slug),
                    clean(description), Instant.now(clock)) == 0) {
                if (organizations.find(organizationId).isEmpty()) throw OrganizationAccessPolicy.notFound();
                throw conflict("ORGANIZATION_VERSION_CONFLICT", "Organization update conflict",
                        "The organization changed since it was read.");
            }
        } catch (DataIntegrityViolationException exception) {
            throw conflict("ORGANIZATION_SLUG_UNAVAILABLE", "Organization slug unavailable",
                    "That organization slug is already in use.");
        }
        return view(requireOrganization(organizationId), role);
    }

    @Transactional(readOnly = true)
    public List<MemberRow> members(UUID organizationId, UUID userId) {
        access.require(organizationId, userId, OrganizationAction.VIEW);
        return organizations.members(organizationId);
    }

    @Transactional
    public List<MemberRow> changeRole(UUID organizationId, UUID actorId, UUID memberId, OrganizationRole newRole) {
        OrganizationRole actorRole = access.require(organizationId, actorId, OrganizationAction.MANAGE_MEMBERS);
        organizations.lockOrganization(organizationId);
        OrganizationRole current = organizations.memberRole(organizationId, memberId)
                .orElseThrow(() -> memberNotFound());
        requireRoleMutationAllowed(actorRole, current, newRole);
        if (current == OrganizationRole.OWNER && newRole != OrganizationRole.OWNER
                && organizations.ownerCount(organizationId) <= 1) {
            throw lastOwner();
        }
        organizations.changeMemberRole(organizationId, memberId, newRole, Instant.now(clock));
        return organizations.members(organizationId);
    }

    @Transactional
    public void removeMember(UUID organizationId, UUID actorId, UUID memberId) {
        OrganizationRole actorRole = access.require(organizationId, actorId, OrganizationAction.MANAGE_MEMBERS);
        organizations.lockOrganization(organizationId);
        OrganizationRole current = organizations.memberRole(organizationId, memberId)
                .orElseThrow(() -> memberNotFound());
        if (current == OrganizationRole.OWNER && actorRole != OrganizationRole.OWNER) throw privilegeDenied();
        if (current == OrganizationRole.OWNER && organizations.ownerCount(organizationId) <= 1) throw lastOwner();
        organizations.removeMember(organizationId, memberId);
    }

    @Transactional
    public LocationRow createLocation(UUID organizationId, UUID actorId, LocationCommand command) {
        access.require(organizationId, actorId, OrganizationAction.MANAGE_LOCATIONS);
        try {
            return organizations.createLocation(organizationId, clean(command.name()), command.latitude(),
                    command.longitude(), clean(command.addressLine()), clean(command.city()), clean(command.region()),
                    command.countryCode().trim().toUpperCase(Locale.ROOT), Instant.now(clock));
        } catch (DataIntegrityViolationException exception) {
            throw conflict("ORGANIZATION_LOCATION_CONFLICT", "Location conflict",
                    "An organization location with that name already exists.");
        }
    }

    @Transactional(readOnly = true)
    public List<LocationRow> locations(UUID organizationId, UUID userId) {
        access.require(organizationId, userId, OrganizationAction.VIEW);
        return organizations.locations(organizationId);
    }

    @Transactional
    public InvitationRow invite(UUID organizationId, UUID actorId, String email, OrganizationRole role) {
        OrganizationRole actorRole = access.require(organizationId, actorId, OrganizationAction.MANAGE_MEMBERS);
        if (role == OrganizationRole.OWNER || (role == OrganizationRole.ADMIN && actorRole != OrganizationRole.OWNER)) {
            throw privilegeDenied();
        }
        Instant now = Instant.now(clock);
        try {
            return organizations.createInvitation(organizationId, email.trim().toLowerCase(Locale.ROOT), role,
                    actorId, now, now.plus(Duration.ofDays(7)));
        } catch (DataIntegrityViolationException exception) {
            throw conflict("ORGANIZATION_INVITATION_CONFLICT", "Invitation conflict",
                    "A pending invitation already exists for this email address.");
        }
    }

    @Transactional
    public OrganizationView acceptInvitation(UUID invitationId, UUID userId) {
        InvitationRow invitation = organizations.findInvitationForUpdate(invitationId)
                .orElseThrow(() -> invitationUnavailable());
        if (!"PENDING".equals(invitation.status())) throw invitationUnavailable();
        Instant now = Instant.now(clock);
        if (!invitation.expiresAt().isAfter(now)) {
            organizations.expireInvitation(invitation.id());
            throw invitationUnavailable();
        }
        String authenticatedEmail = identities.require(userId).normalizedEmail();
        if (!invitation.emailNormalized().equals(authenticatedEmail)) throw invitationUnavailable();
        organizations.acceptInvitation(invitation, userId, now);
        return view(requireOrganization(invitation.organizationId()), invitation.role());
    }

    @Transactional
    public OrganizationView requestVerification(UUID organizationId, UUID actorId) {
        OrganizationRole role = access.require(organizationId, actorId, OrganizationAction.UPDATE_PROFILE);
        OrganizationVerificationStatus current = verificationStatusForUpdate(organizationId);
        current.requireTransitionTo(OrganizationVerificationStatus.PENDING);
        organizations.updateVerification(organizationId, current, OrganizationVerificationStatus.PENDING,
                actorId, "Submitted by organization", Instant.now(clock));
        return view(requireOrganization(organizationId), role);
    }

    @Transactional
    public OrganizationView transitionVerification(UUID organizationId, UUID platformAdminId,
                                                   OrganizationVerificationStatus target, String reason) {
        OrganizationVerificationStatus current = verificationStatusForUpdate(organizationId);
        current.requireTransitionTo(target);
        organizations.updateVerification(organizationId, current, target, platformAdminId, clean(reason), Instant.now(clock));
        return view(requireOrganization(organizationId), null);
    }

    private OrganizationVerificationStatus verificationStatusForUpdate(UUID organizationId) {
        try {
            return organizations.verificationStatusForUpdate(organizationId);
        } catch (EmptyResultDataAccessException exception) {
            throw OrganizationAccessPolicy.notFound();
        }
    }

    private OrganizationRow requireOrganization(UUID organizationId) {
        return organizations.find(organizationId).orElseThrow(OrganizationAccessPolicy::notFound);
    }

    private static void requireRoleMutationAllowed(OrganizationRole actor, OrganizationRole current,
                                                   OrganizationRole target) {
        if (actor != OrganizationRole.OWNER && (current == OrganizationRole.OWNER || target == OrganizationRole.OWNER
                || target == OrganizationRole.ADMIN)) throw privilegeDenied();
    }

    private static OrganizationView view(OrganizationRow row, OrganizationRole currentUserRole) {
        return new OrganizationView(row.id(), row.name(), row.slug(), row.description(), row.verificationStatus(),
                row.version(), currentUserRole, row.createdAt(), row.updatedAt());
    }

    private static String normalizeSlug(String value) { return value.trim().toLowerCase(Locale.ROOT); }
    private static String clean(String value) {
        if (value == null) return null;
        String cleaned = value.trim();
        return cleaned.isEmpty() ? null : cleaned;
    }
    private static ApiProblemException conflict(String code, String title, String detail) {
        return new ApiProblemException(HttpStatus.CONFLICT, code, title, detail);
    }
    private static ApiProblemException memberNotFound() {
        return new ApiProblemException(HttpStatus.NOT_FOUND, "ORGANIZATION_MEMBER_NOT_FOUND",
                "Organization member not found", "The requested organization member does not exist.");
    }
    private static ApiProblemException invitationUnavailable() {
        return new ApiProblemException(HttpStatus.NOT_FOUND, "ORGANIZATION_INVITATION_UNAVAILABLE",
                "Invitation unavailable", "The invitation is invalid, expired, or unavailable to this account.");
    }
    private static ApiProblemException lastOwner() {
        return conflict("ORGANIZATION_LAST_OWNER_REQUIRED", "Owner required",
                "Every organization must retain at least one owner.");
    }
    private static ApiProblemException privilegeDenied() {
        return new ApiProblemException(HttpStatus.FORBIDDEN, "ORGANIZATION_PRIVILEGE_ESCALATION_DENIED",
                "Privilege escalation denied", "You cannot grant or modify this organization role.");
    }

    public record OrganizationView(UUID id, String name, String slug, String description,
                                   OrganizationVerificationStatus verificationStatus, long version,
                                   OrganizationRole currentUserRole, Instant createdAt, Instant updatedAt) { }
    public record LocationCommand(String name, double latitude, double longitude, String addressLine,
                                  String city, String region, String countryCode) { }
}
