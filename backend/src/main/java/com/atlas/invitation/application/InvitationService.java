package com.atlas.invitation.application;

import com.atlas.invitation.domain.CreateInvitationCommand;
import com.atlas.invitation.domain.InvitationDetailView;
import com.atlas.invitation.domain.InvitationRow;
import com.atlas.invitation.domain.InvitationStatus;
import com.atlas.invitation.domain.InvitationSummaryView;
import com.atlas.invitation.infrastructure.InvitationRepository;
import com.atlas.job.domain.JobRow;
import com.atlas.job.domain.JobStatus;
import com.atlas.job.infrastructure.JobRepository;
import com.atlas.organization.application.OrganizationAccessPolicy;
import com.atlas.organization.domain.OrganizationAction;
import com.atlas.shared.error.ApiProblemException;
import com.atlas.shift.domain.ShiftRow;
import com.atlas.shift.domain.ShiftStatus;
import com.atlas.shift.infrastructure.ShiftRepository;
import com.atlas.worker.infrastructure.WorkerProfileRepository;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InvitationService {
    private final InvitationRepository invitationRepository;
    private final JobRepository jobRepository;
    private final ShiftRepository shiftRepository;
    private final WorkerProfileRepository workerProfileRepository;
    private final OrganizationAccessPolicy organizationAccessPolicy;
    private final Clock clock;

    public InvitationService(
            InvitationRepository invitationRepository,
            JobRepository jobRepository,
            ShiftRepository shiftRepository,
            WorkerProfileRepository workerProfileRepository,
            OrganizationAccessPolicy organizationAccessPolicy,
            Clock clock
    ) {
        this.invitationRepository = invitationRepository;
        this.jobRepository = jobRepository;
        this.shiftRepository = shiftRepository;
        this.workerProfileRepository = workerProfileRepository;
        this.organizationAccessPolicy = organizationAccessPolicy;
        this.clock = clock;
    }

    @Transactional
    public InvitationDetailView createJobInvitation(
            UUID organizationId,
            UUID jobId,
            UUID actorId,
            CreateInvitationCommand cmd
    ) {
        organizationAccessPolicy.require(organizationId, actorId, OrganizationAction.PUBLISH_JOBS);
        requireWorkerProfile(cmd.workerId());

        JobRow job = jobRepository.findJobRow(jobId)
                .orElseThrow(() -> new ApiProblemException(HttpStatus.NOT_FOUND, "JOB_NOT_FOUND", "Not Found", "Job not found"));

        if (!job.organizationId().equals(organizationId)) {
            throw new ApiProblemException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Forbidden", "Job does not belong to this organization");
        }

        if (job.status() != JobStatus.PUBLISHED) {
            throw new ApiProblemException(HttpStatus.CONFLICT, "JOB_NOT_OPEN", "Conflict", "Can only invite workers to published jobs");
        }

        if (invitationRepository.existsPendingByJobAndWorker(jobId, cmd.workerId())) {
            throw new ApiProblemException(HttpStatus.CONFLICT, "ALREADY_INVITED", "Conflict", "A pending invitation already exists for this worker");
        }

        Instant now = clock.instant();
        Instant expiresAt = resolveExpiresAt(cmd.expiresAt(), now);

        UUID invitationId = UUID.randomUUID();
        InvitationRow row = new InvitationRow(
                invitationId,
                organizationId,
                jobId,
                null,
                cmd.workerId(),
                actorId,
                InvitationStatus.PENDING,
                cmd.offeredRatePence(),
                cmd.message() != null ? cmd.message().trim() : null,
                expiresAt,
                0L,
                now,
                now
        );

        invitationRepository.insert(row);
        return invitationRepository.findDetailViewById(invitationId).orElseThrow();
    }

    @Transactional
    public InvitationDetailView createShiftInvitation(
            UUID organizationId,
            UUID shiftId,
            UUID actorId,
            CreateInvitationCommand cmd
    ) {
        organizationAccessPolicy.require(organizationId, actorId, OrganizationAction.PUBLISH_JOBS);
        requireWorkerProfile(cmd.workerId());

        ShiftRow shift = shiftRepository.findShiftRow(shiftId)
                .orElseThrow(() -> new ApiProblemException(HttpStatus.NOT_FOUND, "SHIFT_NOT_FOUND", "Not Found", "Shift not found"));

        if (!shift.organizationId().equals(organizationId)) {
            throw new ApiProblemException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Forbidden", "Shift does not belong to this organization");
        }

        if (shift.status() != ShiftStatus.PUBLISHED) {
            throw new ApiProblemException(HttpStatus.CONFLICT, "SHIFT_NOT_OPEN", "Conflict", "Can only invite workers to published shifts");
        }

        if (invitationRepository.existsPendingByShiftAndWorker(shiftId, cmd.workerId())) {
            throw new ApiProblemException(HttpStatus.CONFLICT, "ALREADY_INVITED", "Conflict", "A pending invitation already exists for this worker");
        }

        Instant now = clock.instant();
        Instant expiresAt = resolveExpiresAt(cmd.expiresAt(), now);

        UUID invitationId = UUID.randomUUID();
        InvitationRow row = new InvitationRow(
                invitationId,
                organizationId,
                null,
                shiftId,
                cmd.workerId(),
                actorId,
                InvitationStatus.PENDING,
                cmd.offeredRatePence(),
                cmd.message() != null ? cmd.message().trim() : null,
                expiresAt,
                0L,
                now,
                now
        );

        invitationRepository.insert(row);
        return invitationRepository.findDetailViewById(invitationId).orElseThrow();
    }

    @Transactional
    public InvitationDetailView getOrExpire(UUID invitationId, UUID actorId) {
        InvitationRow row = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new ApiProblemException(HttpStatus.NOT_FOUND, "INVITATION_NOT_FOUND", "Not Found", "Invitation not found"));

        Instant now = clock.instant();
        if (row.status() == InvitationStatus.PENDING && !row.expiresAt().isAfter(now)) {
            invitationRepository.transitionStatus(row.id(), InvitationStatus.PENDING, InvitationStatus.EXPIRED, row.version(), now);
        }

        return invitationRepository.findDetailViewById(invitationId).orElseThrow();
    }

    @Transactional
    public InvitationDetailView accept(UUID invitationId, UUID workerId, long expectedVersion) {
        InvitationDetailView detail = getOrExpire(invitationId, workerId);

        if (!detail.workerId().equals(workerId)) {
            throw new ApiProblemException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Forbidden", "You can only accept your own invitations");
        }

        if (!detail.status().canTransitionTo(InvitationStatus.ACCEPTED)) {
            throw new ApiProblemException(HttpStatus.CONFLICT, "INVALID_TRANSITION", "Conflict",
                    "Cannot accept invitation in status " + detail.status());
        }

        boolean success = invitationRepository.transitionStatus(
                invitationId,
                InvitationStatus.PENDING,
                InvitationStatus.ACCEPTED,
                expectedVersion,
                clock.instant()
        );

        if (!success) {
            throw new ApiProblemException(HttpStatus.CONFLICT, "VERSION_CONFLICT", "Conflict", "Invitation was modified concurrently");
        }

        return invitationRepository.findDetailViewById(invitationId).orElseThrow();
    }

    @Transactional
    public InvitationDetailView decline(UUID invitationId, UUID workerId, long expectedVersion) {
        InvitationDetailView detail = getOrExpire(invitationId, workerId);

        if (!detail.workerId().equals(workerId)) {
            throw new ApiProblemException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Forbidden", "You can only decline your own invitations");
        }

        if (!detail.status().canTransitionTo(InvitationStatus.DECLINED)) {
            throw new ApiProblemException(HttpStatus.CONFLICT, "INVALID_TRANSITION", "Conflict",
                    "Cannot decline invitation in status " + detail.status());
        }

        boolean success = invitationRepository.transitionStatus(
                invitationId,
                InvitationStatus.PENDING,
                InvitationStatus.DECLINED,
                expectedVersion,
                clock.instant()
        );

        if (!success) {
            throw new ApiProblemException(HttpStatus.CONFLICT, "VERSION_CONFLICT", "Conflict", "Invitation was modified concurrently");
        }

        return invitationRepository.findDetailViewById(invitationId).orElseThrow();
    }

    @Transactional
    public InvitationDetailView cancelByEmployer(UUID organizationId, UUID invitationId, UUID actorId, long expectedVersion) {
        organizationAccessPolicy.require(organizationId, actorId, OrganizationAction.PUBLISH_JOBS);

        InvitationDetailView detail = getOrExpire(invitationId, actorId);

        if (!detail.organizationId().equals(organizationId)) {
            throw new ApiProblemException(HttpStatus.NOT_FOUND, "INVITATION_NOT_FOUND", "Not Found", "Invitation does not belong to this organization");
        }

        if (!detail.status().canTransitionTo(InvitationStatus.CANCELLED)) {
            throw new ApiProblemException(HttpStatus.CONFLICT, "INVALID_TRANSITION", "Conflict",
                    "Cannot cancel invitation in status " + detail.status());
        }

        boolean success = invitationRepository.transitionStatus(
                invitationId,
                InvitationStatus.PENDING,
                InvitationStatus.CANCELLED,
                expectedVersion,
                clock.instant()
        );

        if (!success) {
            throw new ApiProblemException(HttpStatus.CONFLICT, "VERSION_CONFLICT", "Conflict", "Invitation was modified concurrently");
        }

        return invitationRepository.findDetailViewById(invitationId).orElseThrow();
    }

    @Transactional(readOnly = true)
    public List<InvitationSummaryView> getWorkerInvitations(UUID workerId, int limit, int offset) {
        return invitationRepository.findByWorker(workerId, sanitizeLimit(limit), Math.max(0, offset));
    }

    @Transactional(readOnly = true)
    public List<InvitationSummaryView> getOrganizationInvitations(
            UUID organizationId,
            InvitationStatus status,
            UUID actorId,
            int limit,
            int offset
    ) {
        organizationAccessPolicy.require(organizationId, actorId, OrganizationAction.VIEW_CANDIDATES);
        return invitationRepository.findByOrganization(organizationId, status, sanitizeLimit(limit), Math.max(0, offset));
    }

    private Instant resolveExpiresAt(Instant candidate, Instant now) {
        if (candidate != null && candidate.isAfter(now)) {
            return candidate;
        }
        return now.plus(Duration.ofDays(7));
    }

    private void requireWorkerProfile(UUID workerId) {
        if (workerProfileRepository.findByUserId(workerId).isEmpty()) {
            throw new ApiProblemException(HttpStatus.NOT_FOUND, "WORKER_PROFILE_REQUIRED", "Not Found", "Worker profile not found");
        }
    }

    private int sanitizeLimit(int limit) {
        if (limit <= 0) return 20;
        return Math.min(limit, 100);
    }
}
