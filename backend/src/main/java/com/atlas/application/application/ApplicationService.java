package com.atlas.application.application;

import com.atlas.application.domain.ApplicationDetailView;
import com.atlas.application.domain.ApplicationRow;
import com.atlas.application.domain.ApplicationStatus;
import com.atlas.application.domain.ApplicationSummaryView;
import com.atlas.application.domain.ApplyCommand;
import com.atlas.application.infrastructure.ApplicationRepository;
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
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ApplicationService {
    private final ApplicationRepository applicationRepository;
    private final JobRepository jobRepository;
    private final ShiftRepository shiftRepository;
    private final WorkerProfileRepository workerProfileRepository;
    private final OrganizationAccessPolicy organizationAccessPolicy;

    public ApplicationService(
            ApplicationRepository applicationRepository,
            JobRepository jobRepository,
            ShiftRepository shiftRepository,
            WorkerProfileRepository workerProfileRepository,
            OrganizationAccessPolicy organizationAccessPolicy
    ) {
        this.applicationRepository = applicationRepository;
        this.jobRepository = jobRepository;
        this.shiftRepository = shiftRepository;
        this.workerProfileRepository = workerProfileRepository;
        this.organizationAccessPolicy = organizationAccessPolicy;
    }

    @Transactional
    public ApplicationDetailView applyToJob(UUID jobId, UUID workerId, ApplyCommand cmd) {
        requireWorkerProfile(workerId);

        JobRow job = jobRepository.findJobRow(jobId)
                .orElseThrow(() -> new ApiProblemException(HttpStatus.NOT_FOUND, "JOB_NOT_FOUND", "Not Found", "Job not found"));

        if (job.status() != JobStatus.PUBLISHED) {
            throw new ApiProblemException(HttpStatus.CONFLICT, "JOB_NOT_OPEN", "Conflict", "Applications are only accepted for published jobs");
        }

        if (applicationRepository.existsByJobAndWorker(jobId, workerId)) {
            throw new ApiProblemException(HttpStatus.CONFLICT, "ALREADY_APPLIED", "Conflict", "You have already applied for this job");
        }

        if (cmd.proposedRatePence() != null && cmd.proposedRatePence() <= 0) {
            throw new ApiProblemException(HttpStatus.BAD_REQUEST, "INVALID_RATE", "Bad Request", "Proposed rate must be positive");
        }

        UUID applicationId = UUID.randomUUID();
        Instant now = Instant.now();
        ApplicationRow row = new ApplicationRow(
                applicationId,
                job.organizationId(),
                jobId,
                null,
                workerId,
                ApplicationStatus.SUBMITTED,
                cmd.coverNote() != null ? cmd.coverNote().trim() : null,
                cmd.proposedRatePence(),
                0L,
                now,
                now
        );

        applicationRepository.insert(row);
        return applicationRepository.findDetailViewById(applicationId).orElseThrow();
    }

    @Transactional
    public ApplicationDetailView applyToShift(UUID shiftId, UUID workerId, ApplyCommand cmd) {
        requireWorkerProfile(workerId);

        ShiftRow shift = shiftRepository.findShiftRow(shiftId)
                .orElseThrow(() -> new ApiProblemException(HttpStatus.NOT_FOUND, "SHIFT_NOT_FOUND", "Not Found", "Shift not found"));

        if (shift.status() != ShiftStatus.PUBLISHED) {
            throw new ApiProblemException(HttpStatus.CONFLICT, "SHIFT_NOT_OPEN", "Conflict", "Applications are only accepted for published shifts");
        }

        if (applicationRepository.existsByShiftAndWorker(shiftId, workerId)) {
            throw new ApiProblemException(HttpStatus.CONFLICT, "ALREADY_APPLIED", "Conflict", "You have already applied for this shift");
        }

        if (cmd.proposedRatePence() != null && cmd.proposedRatePence() <= 0) {
            throw new ApiProblemException(HttpStatus.BAD_REQUEST, "INVALID_RATE", "Bad Request", "Proposed rate must be positive");
        }

        UUID applicationId = UUID.randomUUID();
        Instant now = Instant.now();
        ApplicationRow row = new ApplicationRow(
                applicationId,
                shift.organizationId(),
                null,
                shiftId,
                workerId,
                ApplicationStatus.SUBMITTED,
                cmd.coverNote() != null ? cmd.coverNote().trim() : null,
                cmd.proposedRatePence(),
                0L,
                now,
                now
        );

        applicationRepository.insert(row);
        return applicationRepository.findDetailViewById(applicationId).orElseThrow();
    }

    @Transactional
    public ApplicationDetailView withdraw(UUID applicationId, UUID workerId, long expectedVersion) {
        ApplicationRow application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ApiProblemException(HttpStatus.NOT_FOUND, "APPLICATION_NOT_FOUND", "Not Found", "Application not found"));

        if (!application.workerId().equals(workerId)) {
            throw new ApiProblemException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Forbidden", "You can only withdraw your own applications");
        }

        if (!application.status().canTransitionTo(ApplicationStatus.WITHDRAWN)) {
            throw new ApiProblemException(HttpStatus.CONFLICT, "INVALID_TRANSITION", "Conflict",
                    "Cannot withdraw an application in status " + application.status());
        }

        boolean success = applicationRepository.transitionStatus(
                applicationId,
                application.status(),
                ApplicationStatus.WITHDRAWN,
                expectedVersion,
                Instant.now()
        );

        if (!success) {
            throw new ApiProblemException(HttpStatus.CONFLICT, "VERSION_CONFLICT", "Conflict", "The application was modified concurrently");
        }

        return applicationRepository.findDetailViewById(applicationId).orElseThrow();
    }

    @Transactional
    public ApplicationDetailView transitionByEmployer(
            UUID organizationId,
            UUID applicationId,
            ApplicationStatus targetStatus,
            UUID actorId,
            long expectedVersion
    ) {
        organizationAccessPolicy.require(organizationId, actorId, OrganizationAction.VIEW_CANDIDATES);

        ApplicationRow application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ApiProblemException(HttpStatus.NOT_FOUND, "APPLICATION_NOT_FOUND", "Not Found", "Application not found"));

        if (!application.organizationId().equals(organizationId)) {
            throw new ApiProblemException(HttpStatus.NOT_FOUND, "APPLICATION_NOT_FOUND", "Not Found", "Application does not belong to this organization");
        }

        if (!application.status().canTransitionTo(targetStatus)) {
            throw new ApiProblemException(HttpStatus.CONFLICT, "INVALID_TRANSITION", "Conflict",
                    "Cannot transition application from " + application.status() + " to " + targetStatus);
        }

        boolean success = applicationRepository.transitionStatus(
                applicationId,
                application.status(),
                targetStatus,
                expectedVersion,
                Instant.now()
        );

        if (!success) {
            throw new ApiProblemException(HttpStatus.CONFLICT, "VERSION_CONFLICT", "Conflict", "The application was modified concurrently");
        }

        return applicationRepository.findDetailViewById(applicationId).orElseThrow();
    }

    @Transactional(readOnly = true)
    public List<ApplicationSummaryView> getWorkerApplications(UUID workerId, int limit, int offset) {
        return applicationRepository.findByWorker(workerId, sanitizeLimit(limit), Math.max(0, offset));
    }

    @Transactional(readOnly = true)
    public List<ApplicationSummaryView> getOrganizationApplications(
            UUID organizationId,
            ApplicationStatus status,
            UUID actorId,
            int limit,
            int offset
    ) {
        organizationAccessPolicy.require(organizationId, actorId, OrganizationAction.VIEW_CANDIDATES);
        return applicationRepository.findByOrganization(organizationId, status, sanitizeLimit(limit), Math.max(0, offset));
    }

    @Transactional(readOnly = true)
    public List<ApplicationSummaryView> getJobApplications(
            UUID organizationId,
            UUID jobId,
            UUID actorId,
            int limit,
            int offset
    ) {
        organizationAccessPolicy.require(organizationId, actorId, OrganizationAction.VIEW_CANDIDATES);
        JobRow job = jobRepository.findJobRow(jobId)
                .orElseThrow(() -> new ApiProblemException(HttpStatus.NOT_FOUND, "JOB_NOT_FOUND", "Not Found", "Job not found"));

        if (!job.organizationId().equals(organizationId)) {
            throw new ApiProblemException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Forbidden", "Job does not belong to this organization");
        }

        return applicationRepository.findByJob(jobId, sanitizeLimit(limit), Math.max(0, offset));
    }

    @Transactional(readOnly = true)
    public List<ApplicationSummaryView> getShiftApplications(
            UUID organizationId,
            UUID shiftId,
            UUID actorId,
            int limit,
            int offset
    ) {
        organizationAccessPolicy.require(organizationId, actorId, OrganizationAction.VIEW_CANDIDATES);
        ShiftRow shift = shiftRepository.findShiftRow(shiftId)
                .orElseThrow(() -> new ApiProblemException(HttpStatus.NOT_FOUND, "SHIFT_NOT_FOUND", "Not Found", "Shift not found"));

        if (!shift.organizationId().equals(organizationId)) {
            throw new ApiProblemException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Forbidden", "Shift does not belong to this organization");
        }

        return applicationRepository.findByShift(shiftId, sanitizeLimit(limit), Math.max(0, offset));
    }

    @Transactional(readOnly = true)
    public ApplicationDetailView getApplicationDetail(UUID applicationId, UUID actorId) {
        ApplicationDetailView detail = applicationRepository.findDetailViewById(applicationId)
                .orElseThrow(() -> new ApiProblemException(HttpStatus.NOT_FOUND, "APPLICATION_NOT_FOUND", "Not Found", "Application not found"));

        if (detail.workerId().equals(actorId)) {
            return detail;
        }

        try {
            organizationAccessPolicy.require(detail.organizationId(), actorId, OrganizationAction.VIEW_CANDIDATES);
            return detail;
        } catch (Exception e) {
            throw new ApiProblemException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Forbidden", "Access denied to application details");
        }
    }

    private void requireWorkerProfile(UUID workerId) {
        if (workerProfileRepository.findByUserId(workerId).isEmpty()) {
            throw new ApiProblemException(HttpStatus.FORBIDDEN, "WORKER_PROFILE_REQUIRED", "Forbidden", "Worker profile must be created before applying");
        }
    }

    private int sanitizeLimit(int limit) {
        if (limit <= 0) return 20;
        return Math.min(limit, 100);
    }
}
