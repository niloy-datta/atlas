package com.atlas.organization.infrastructure;

import com.atlas.organization.domain.OrganizationRole;
import com.atlas.organization.domain.OrganizationVerificationStatus;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class OrganizationRepository {
    private final JdbcTemplate jdbc;

    public OrganizationRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void create(OrganizationRow organization, UUID creatorUserId) {
        jdbc.update("""
                INSERT INTO organizations
                    (id, name, slug, description, verification_status, version, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, organization.id(), organization.name(), organization.slug(), organization.description(),
                organization.verificationStatus().name(), organization.version(), Timestamp.from(organization.createdAt()),
                Timestamp.from(organization.updatedAt()));
        jdbc.update("""
                INSERT INTO organization_members (organization_id, user_id, role, joined_at, updated_at)
                VALUES (?, ?, 'OWNER', ?, ?)
                """, organization.id(), creatorUserId, Timestamp.from(organization.createdAt()),
                Timestamp.from(organization.updatedAt()));
    }

    public Optional<OrganizationRow> find(UUID organizationId) {
        return jdbc.query("""
                SELECT id, name, slug, description, verification_status, version, created_at, updated_at
                  FROM organizations WHERE id = ?
                """, (rs, row) -> organization(rs), organizationId).stream().findFirst();
    }

    public List<OrganizationSummary> listForUser(UUID userId) {
        return jdbc.query("""
                SELECT o.id, o.name, o.slug, o.verification_status, o.version, m.role
                  FROM organizations o
                  JOIN organization_members m ON m.organization_id = o.id
                 WHERE m.user_id = ?
                 ORDER BY o.name, o.id
                """, (rs, row) -> new OrganizationSummary(
                rs.getObject("id", UUID.class), rs.getString("name"), rs.getString("slug"),
                OrganizationVerificationStatus.valueOf(rs.getString("verification_status")),
                rs.getLong("version"), OrganizationRole.valueOf(rs.getString("role"))), userId);
    }

    public Optional<OrganizationRole> memberRole(UUID organizationId, UUID userId) {
        return jdbc.query("""
                SELECT role FROM organization_members WHERE organization_id = ? AND user_id = ?
                """, (rs, row) -> OrganizationRole.valueOf(rs.getString("role")), organizationId, userId)
                .stream().findFirst();
    }

    public int update(UUID organizationId, long expectedVersion, String name, String slug,
                      String description, Instant now) {
        return jdbc.update("""
                UPDATE organizations
                   SET name = ?, slug = ?, description = ?, version = version + 1, updated_at = ?
                 WHERE id = ? AND version = ?
                """, name, slug, description, Timestamp.from(now), organizationId, expectedVersion);
    }

    public List<MemberRow> members(UUID organizationId) {
        return jdbc.query("""
                SELECT m.user_id, u.email_display, m.role, m.joined_at, m.updated_at
                  FROM organization_members m JOIN users u ON u.id = m.user_id
                 WHERE m.organization_id = ?
                 ORDER BY m.joined_at, m.user_id
                """, (rs, row) -> new MemberRow(rs.getObject("user_id", UUID.class), rs.getString("email_display"),
                OrganizationRole.valueOf(rs.getString("role")), rs.getTimestamp("joined_at").toInstant(),
                rs.getTimestamp("updated_at").toInstant()), organizationId);
    }

    public void lockOrganization(UUID organizationId) {
        jdbc.queryForObject("SELECT id FROM organizations WHERE id = ? FOR UPDATE", UUID.class, organizationId);
    }

    public int ownerCount(UUID organizationId) {
        return jdbc.queryForObject("""
                SELECT count(*) FROM organization_members WHERE organization_id = ? AND role = 'OWNER'
                """, Integer.class, organizationId);
    }

    public int changeMemberRole(UUID organizationId, UUID userId, OrganizationRole role, Instant now) {
        return jdbc.update("""
                UPDATE organization_members SET role = ?, updated_at = ?
                 WHERE organization_id = ? AND user_id = ?
                """, role.name(), Timestamp.from(now), organizationId, userId);
    }

    public int removeMember(UUID organizationId, UUID userId) {
        return jdbc.update("DELETE FROM organization_members WHERE organization_id = ? AND user_id = ?",
                organizationId, userId);
    }

    public LocationRow createLocation(UUID organizationId, String name, double latitude, double longitude,
                                      String addressLine, String city, String region, String countryCode, Instant now) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO organization_locations
                    (id, organization_id, name, search_point, address_line, city, region, country_code,
                     active, created_at, updated_at)
                VALUES (?, ?, ?, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography, ?, ?, ?, ?, true, ?, ?)
                """, id, organizationId, name, longitude, latitude, addressLine, city, region, countryCode,
                Timestamp.from(now), Timestamp.from(now));
        return new LocationRow(id, name, latitude, longitude, addressLine, city, region, countryCode, true, now);
    }

    public List<LocationRow> locations(UUID organizationId) {
        return jdbc.query("""
                SELECT id, name, ST_Y(search_point::geometry) AS latitude,
                       ST_X(search_point::geometry) AS longitude, address_line, city, region,
                       country_code, active, created_at
                  FROM organization_locations WHERE organization_id = ? ORDER BY name, id
                """, (rs, row) -> new LocationRow(rs.getObject("id", UUID.class), rs.getString("name"),
                rs.getDouble("latitude"), rs.getDouble("longitude"), rs.getString("address_line"),
                rs.getString("city"), rs.getString("region"), rs.getString("country_code"),
                rs.getBoolean("active"), rs.getTimestamp("created_at").toInstant()), organizationId);
    }

    public InvitationRow createInvitation(UUID organizationId, String emailNormalized, OrganizationRole role,
                                          UUID invitedBy, Instant createdAt, Instant expiresAt) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO organization_invitations
                    (id, organization_id, email_normalized, role, status, invited_by_user_id, expires_at, created_at)
                VALUES (?, ?, ?, ?, 'PENDING', ?, ?, ?)
                """, id, organizationId, emailNormalized, role.name(), invitedBy,
                Timestamp.from(expiresAt), Timestamp.from(createdAt));
        return new InvitationRow(id, organizationId, emailNormalized, role, "PENDING", expiresAt, null, null);
    }

    public Optional<InvitationRow> findInvitationForUpdate(UUID invitationId) {
        return jdbc.query("""
                SELECT id, organization_id, email_normalized, role, status, expires_at,
                       accepted_by_user_id, accepted_at
                  FROM organization_invitations WHERE id = ? FOR UPDATE
                """, (rs, row) -> new InvitationRow(rs.getObject("id", UUID.class),
                rs.getObject("organization_id", UUID.class), rs.getString("email_normalized"),
                OrganizationRole.valueOf(rs.getString("role")), rs.getString("status"),
                rs.getTimestamp("expires_at").toInstant(), rs.getObject("accepted_by_user_id", UUID.class),
                rs.getTimestamp("accepted_at") == null ? null : rs.getTimestamp("accepted_at").toInstant()), invitationId)
                .stream().findFirst();
    }

    public void acceptInvitation(InvitationRow invitation, UUID userId, Instant now) {
        jdbc.update("""
                INSERT INTO organization_members (organization_id, user_id, role, joined_at, updated_at)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT (organization_id, user_id) DO NOTHING
                """, invitation.organizationId(), userId, invitation.role().name(), Timestamp.from(now), Timestamp.from(now));
        jdbc.update("""
                UPDATE organization_invitations
                   SET status = 'ACCEPTED', accepted_by_user_id = ?, accepted_at = ?
                 WHERE id = ?
                """, userId, Timestamp.from(now), invitation.id());
    }

    public void expireInvitation(UUID invitationId) {
        jdbc.update("UPDATE organization_invitations SET status = 'EXPIRED' WHERE id = ?", invitationId);
    }

    public OrganizationVerificationStatus verificationStatusForUpdate(UUID organizationId) {
        return OrganizationVerificationStatus.valueOf(jdbc.queryForObject(
                "SELECT verification_status FROM organizations WHERE id = ? FOR UPDATE", String.class, organizationId));
    }

    public void updateVerification(UUID organizationId, OrganizationVerificationStatus from,
                                   OrganizationVerificationStatus to, UUID actorId, String reason, Instant now) {
        jdbc.update("""
                UPDATE organizations SET verification_status = ?, version = version + 1, updated_at = ? WHERE id = ?
                """, to.name(), Timestamp.from(now), organizationId);
        jdbc.update("""
                INSERT INTO organization_verification_history
                    (id, organization_id, from_status, to_status, actor_user_id, reason, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """, UUID.randomUUID(), organizationId, from.name(), to.name(), actorId, reason, Timestamp.from(now));
    }

    private static OrganizationRow organization(java.sql.ResultSet rs) throws java.sql.SQLException {
        return new OrganizationRow(rs.getObject("id", UUID.class), rs.getString("name"), rs.getString("slug"),
                rs.getString("description"), OrganizationVerificationStatus.valueOf(rs.getString("verification_status")),
                rs.getLong("version"), rs.getTimestamp("created_at").toInstant(), rs.getTimestamp("updated_at").toInstant());
    }

    public record OrganizationRow(UUID id, String name, String slug, String description,
                                  OrganizationVerificationStatus verificationStatus, long version,
                                  Instant createdAt, Instant updatedAt) { }
    public record OrganizationSummary(UUID id, String name, String slug,
                                      OrganizationVerificationStatus verificationStatus, long version,
                                      OrganizationRole role) { }
    public record MemberRow(UUID userId, String email, OrganizationRole role, Instant joinedAt, Instant updatedAt) { }
    public record LocationRow(UUID id, String name, double latitude, double longitude, String addressLine,
                              String city, String region, String countryCode, boolean active, Instant createdAt) { }
    public record InvitationRow(UUID id, UUID organizationId, String emailNormalized, OrganizationRole role,
                                String status, Instant expiresAt, UUID acceptedByUserId, Instant acceptedAt) { }
}
