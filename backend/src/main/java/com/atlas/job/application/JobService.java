package com.atlas.job.application;

import com.atlas.job.domain.JobCredentialRequirement;
import com.atlas.job.domain.JobDetailView;
import com.atlas.job.domain.JobRow;
import com.atlas.job.domain.JobSkillRequirement;
import com.atlas.job.domain.JobStatus;
import com.atlas.job.domain.JobSummaryView;
import com.atlas.job.domain.JobType;
import com.atlas.job.infrastructure.JobRepository;
import com.atlas.organization.application.OrganizationAccessPolicy;
import com.atlas.organization.domain.OrganizationAction;
import com.atlas.shared.error.ApiProblemException;
import com.atlas.skill.domain.SkillProficiency;
import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class JobService {
    private final JobRepository jobRepository;
    private final OrganizationAccessPolicy organizationAccessPolicy;

    public JobService(JobRepository jobRepository, OrganizationAccessPolicy organizationAccessPolicy) {
        this.jobRepository = jobRepository;
        this.organizationAccessPolicy = organizationAccessPolicy;
    }

    @Transactional
    public JobDetailView createDraft(UUID organizationId, CreateJobDraftCommand cmd, UUID actorUserId) {
        organizationAccessPolicy.require(organizationId, actorUserId, OrganizationAction.PUBLISH_JOBS);
        validateJobFields(cmd.title(), cmd.description(), cmd.latitude(), cmd.longitude(),
                cmd.budgetMinPence(), cmd.budgetMaxPence(), cmd.currency());

        UUID jobId = UUID.randomUUID();
        Instant now = Instant.now();
        JobRow row = new JobRow(
                jobId,
                organizationId,
                cmd.title().trim(),
                cmd.description().trim(),
                cmd.jobType(),
                JobStatus.DRAFT,
                cmd.locationName() != null ? cmd.locationName().trim() : null,
                cmd.formattedAddress() != null ? cmd.formattedAddress().trim() : null,
                cmd.latitude(),
                cmd.longitude(),
                cmd.budgetMinPence(),
                cmd.budgetMaxPence(),
                cmd.currency() != null ? cmd.currency().trim().toUpperCase() : "GBP",
                0L,
                now,
                now
        );

        jobRepository.insert(row);
        return jobRepository.findDetailById(jobId)
                .orElseThrow(() -> new IllegalStateException("Job not found immediately after insert"));
    }

    @Transactional
    public JobDetailView updateDraft(UUID organizationId, UUID jobId, UpdateJobDraftCommand cmd, UUID actorUserId) {
        organizationAccessPolicy.require(organizationId, actorUserId, OrganizationAction.PUBLISH_JOBS);
        validateJobFields(cmd.title(), cmd.description(), cmd.latitude(), cmd.longitude(),
                cmd.budgetMinPence(), cmd.budgetMaxPence(), cmd.currency());

        JobRow existing = jobRepository.findJobRow(jobId)
                .filter(j -> j.organizationId().equals(organizationId))
                .orElseThrow(() -> notFound(jobId));

        if (existing.status() != JobStatus.DRAFT) {
            throw new ApiProblemException(HttpStatus.BAD_REQUEST, "INVALID_JOB_STATE",
                    "Job not in DRAFT state", "Only jobs in DRAFT state can have their core draft fields updated.");
        }

        Instant now = Instant.now();
        JobRow updated = new JobRow(
                jobId,
                organizationId,
                cmd.title().trim(),
                cmd.description().trim(),
                cmd.jobType(),
                JobStatus.DRAFT,
                cmd.locationName() != null ? cmd.locationName().trim() : null,
                cmd.formattedAddress() != null ? cmd.formattedAddress().trim() : null,
                cmd.latitude(),
                cmd.longitude(),
                cmd.budgetMinPence(),
                cmd.budgetMaxPence(),
                cmd.currency() != null ? cmd.currency().trim().toUpperCase() : "GBP",
                cmd.version(),
                existing.createdAt(),
                now
        );

        int rows = jobRepository.updateDraft(updated, cmd.version(), now);
        if (rows == 0) {
            throw new ApiProblemException(HttpStatus.CONFLICT, "CONCURRENT_MODIFICATION_CONFLICT",
                    "Concurrent modification", "The job was modified concurrently. Please refresh and retry.");
        }

        return jobRepository.findDetailById(jobId).orElseThrow(() -> notFound(jobId));
    }

    @Transactional
    public JobDetailView publishJob(UUID organizationId, UUID jobId, long version, UUID actorUserId) {
        return transitionStatus(organizationId, jobId, JobStatus.PUBLISHED, version, actorUserId);
    }

    @Transactional
    public JobDetailView pauseJob(UUID organizationId, UUID jobId, long version, UUID actorUserId) {
        return transitionStatus(organizationId, jobId, JobStatus.PAUSED, version, actorUserId);
    }

    @Transactional
    public JobDetailView resumeJob(UUID organizationId, UUID jobId, long version, UUID actorUserId) {
        return transitionStatus(organizationId, jobId, JobStatus.PUBLISHED, version, actorUserId);
    }

    @Transactional
    public JobDetailView closeJob(UUID organizationId, UUID jobId, long version, UUID actorUserId) {
        return transitionStatus(organizationId, jobId, JobStatus.CLOSED, version, actorUserId);
    }

    @Transactional
    public JobDetailView cancelJob(UUID organizationId, UUID jobId, long version, UUID actorUserId) {
        return transitionStatus(organizationId, jobId, JobStatus.CANCELLED, version, actorUserId);
    }

    @Transactional
    public JobDetailView addRequiredSkill(UUID organizationId, UUID jobId, AddJobSkillRequirementCommand cmd, UUID actorUserId) {
        organizationAccessPolicy.require(organizationId, actorUserId, OrganizationAction.PUBLISH_JOBS);
        JobRow job = jobRepository.findJobRow(jobId)
                .filter(j -> j.organizationId().equals(organizationId))
                .orElseThrow(() -> notFound(jobId));

        if (job.status() == JobStatus.CLOSED || job.status() == JobStatus.CANCELLED || job.status() == JobStatus.COMPLETED) {
            throw new ApiProblemException(HttpStatus.BAD_REQUEST, "INVALID_JOB_STATE",
                    "Job requirements immutable", "Requirements cannot be modified on closed or cancelled jobs.");
        }

        UUID reqId = UUID.randomUUID();
        jobRepository.addRequiredSkill(reqId, jobId, cmd.skillId(), cmd.minimumProficiency(), cmd.required(), Instant.now());
        return jobRepository.findDetailById(jobId).orElseThrow(() -> notFound(jobId));
    }

    @Transactional
    public JobDetailView removeRequiredSkill(UUID organizationId, UUID jobId, UUID skillId, UUID actorUserId) {
        organizationAccessPolicy.require(organizationId, actorUserId, OrganizationAction.PUBLISH_JOBS);
        JobRow job = jobRepository.findJobRow(jobId)
                .filter(j -> j.organizationId().equals(organizationId))
                .orElseThrow(() -> notFound(jobId));

        if (job.status() == JobStatus.CLOSED || job.status() == JobStatus.CANCELLED || job.status() == JobStatus.COMPLETED) {
            throw new ApiProblemException(HttpStatus.BAD_REQUEST, "INVALID_JOB_STATE",
                    "Job requirements immutable", "Requirements cannot be modified on closed or cancelled jobs.");
        }

        jobRepository.removeRequiredSkill(jobId, skillId);
        return jobRepository.findDetailById(jobId).orElseThrow(() -> notFound(jobId));
    }

    @Transactional
    public JobDetailView addRequiredCredential(UUID organizationId, UUID jobId, AddJobCredentialRequirementCommand cmd, UUID actorUserId) {
        organizationAccessPolicy.require(organizationId, actorUserId, OrganizationAction.PUBLISH_JOBS);
        JobRow job = jobRepository.findJobRow(jobId)
                .filter(j -> j.organizationId().equals(organizationId))
                .orElseThrow(() -> notFound(jobId));

        if (job.status() == JobStatus.CLOSED || job.status() == JobStatus.CANCELLED || job.status() == JobStatus.COMPLETED) {
            throw new ApiProblemException(HttpStatus.BAD_REQUEST, "INVALID_JOB_STATE",
                    "Job requirements immutable", "Requirements cannot be modified on closed or cancelled jobs.");
        }

        if (cmd.title() == null || cmd.title().isBlank()) {
            throw new ApiProblemException(HttpStatus.BAD_REQUEST, "INVALID_CREDENTIAL_TITLE",
                    "Invalid credential title", "Credential requirement title cannot be empty.");
        }

        String credType = cmd.credentialType() != null && !cmd.credentialType().isBlank()
                ? cmd.credentialType().trim().toUpperCase()
                : "CERTIFICATE";

        UUID reqId = UUID.randomUUID();
        jobRepository.addRequiredCredential(reqId, jobId, credType, cmd.title().trim(),
                cmd.issuer() != null ? cmd.issuer().trim() : null, cmd.required(), Instant.now());
        return jobRepository.findDetailById(jobId).orElseThrow(() -> notFound(jobId));
    }

    @Transactional
    public JobDetailView removeRequiredCredential(UUID organizationId, UUID jobId, UUID credentialRequirementId, UUID actorUserId) {
        organizationAccessPolicy.require(organizationId, actorUserId, OrganizationAction.PUBLISH_JOBS);
        JobRow job = jobRepository.findJobRow(jobId)
                .filter(j -> j.organizationId().equals(organizationId))
                .orElseThrow(() -> notFound(jobId));

        if (job.status() == JobStatus.CLOSED || job.status() == JobStatus.CANCELLED || job.status() == JobStatus.COMPLETED) {
            throw new ApiProblemException(HttpStatus.BAD_REQUEST, "INVALID_JOB_STATE",
                    "Job requirements immutable", "Requirements cannot be modified on closed or cancelled jobs.");
        }

        jobRepository.removeRequiredCredential(jobId, credentialRequirementId);
        return jobRepository.findDetailById(jobId).orElseThrow(() -> notFound(jobId));
    }

    @Transactional(readOnly = true)
    public JobDetailView getTenantJob(UUID organizationId, UUID jobId, UUID actorUserId) {
        organizationAccessPolicy.require(organizationId, actorUserId, OrganizationAction.VIEW);
        return jobRepository.findDetailById(jobId)
                .filter(j -> j.organizationId().equals(organizationId))
                .orElseThrow(() -> notFound(jobId));
    }

    @Transactional(readOnly = true)
    public PageResult<JobSummaryView> listTenantJobs(UUID organizationId, String statusFilter, int page, int size, UUID actorUserId) {
        organizationAccessPolicy.require(organizationId, actorUserId, OrganizationAction.VIEW);
        int validPage = Math.max(0, page);
        int validSize = Math.clamp(size, 1, 100);
        int offset = validPage * validSize;

        List<JobSummaryView> items = jobRepository.listOrganizationJobs(organizationId, statusFilter, validSize, offset);
        long total = jobRepository.countOrganizationJobs(organizationId, statusFilter);
        return new PageResult<>(items, total, validPage, validSize);
    }

    @Transactional(readOnly = true)
    public JobDetailView getPublicJob(UUID jobId) {
        JobDetailView job = jobRepository.findDetailById(jobId)
                .orElseThrow(() -> notFound(jobId));

        if (job.status() != JobStatus.PUBLISHED) {
            throw notFound(jobId);
        }
        return job;
    }

    @Transactional(readOnly = true)
    public PageResult<JobSummaryView> searchPublicJobs(String query, Double lat, Double lon, Double radiusKm, String jobType, int page, int size) {
        int validPage = Math.max(0, page);
        int validSize = Math.clamp(size, 1, 100);
        int offset = validPage * validSize;

        if (lat != null || lon != null) {
            if (lat == null || lon == null || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
                throw new ApiProblemException(HttpStatus.BAD_REQUEST, "INVALID_COORDINATES",
                        "Invalid coordinates", "Latitude must be [-90, 90] and longitude must be [-180, 180].");
            }
        }

        List<JobSummaryView> items = jobRepository.searchPublicJobs(query, lat, lon, radiusKm, jobType, validSize, offset);
        long total = jobRepository.countPublicJobs(query, lat, lon, radiusKm, jobType);
        return new PageResult<>(items, total, validPage, validSize);
    }

    private JobDetailView transitionStatus(UUID organizationId, UUID jobId, JobStatus targetStatus, long expectedVersion, UUID actorUserId) {
        organizationAccessPolicy.require(organizationId, actorUserId, OrganizationAction.PUBLISH_JOBS);
        JobRow job = jobRepository.findJobRow(jobId)
                .filter(j -> j.organizationId().equals(organizationId))
                .orElseThrow(() -> notFound(jobId));

        if (!job.status().canTransitionTo(targetStatus)) {
            throw new ApiProblemException(HttpStatus.BAD_REQUEST, "INVALID_STATE_TRANSITION",
                    "Invalid state transition",
                    String.format("Cannot transition job from %s to %s", job.status(), targetStatus));
        }

        Instant now = Instant.now();
        int rows = jobRepository.updateStatus(jobId, organizationId, targetStatus, expectedVersion, now);
        if (rows == 0) {
            throw new ApiProblemException(HttpStatus.CONFLICT, "CONCURRENT_MODIFICATION_CONFLICT",
                    "Concurrent modification", "The job was modified concurrently. Please refresh and retry.");
        }

        return jobRepository.findDetailById(jobId).orElseThrow(() -> notFound(jobId));
    }

    private void validateJobFields(String title, String description, Double lat, Double lon,
                                   Long budgetMinPence, Long budgetMaxPence, String currency) {
        if (title == null || title.isBlank() || title.trim().length() > 160) {
            throw new ApiProblemException(HttpStatus.BAD_REQUEST, "INVALID_JOB_TITLE",
                    "Invalid title", "Job title must be between 1 and 160 characters.");
        }
        if (description == null || description.isBlank() || description.trim().length() > 4000) {
            throw new ApiProblemException(HttpStatus.BAD_REQUEST, "INVALID_JOB_DESCRIPTION",
                    "Invalid description", "Job description must be between 1 and 4000 characters.");
        }
        if ((lat != null && lon == null) || (lat == null && lon != null)) {
            throw new ApiProblemException(HttpStatus.BAD_REQUEST, "INVALID_COORDINATES",
                    "Incomplete coordinates", "Both latitude and longitude must be provided together.");
        }
        if (lat != null && (lat < -90.0 || lat > 90.0 || lon < -180.0 || lon > 180.0)) {
            throw new ApiProblemException(HttpStatus.BAD_REQUEST, "INVALID_COORDINATES",
                    "Invalid coordinates", "Latitude must be [-90, 90] and longitude must be [-180, 180].");
        }
        if (budgetMinPence != null && budgetMinPence < 0) {
            throw new ApiProblemException(HttpStatus.BAD_REQUEST, "INVALID_BUDGET",
                    "Invalid minimum budget", "Budget cannot be negative.");
        }
        if (budgetMaxPence != null && budgetMaxPence < 0) {
            throw new ApiProblemException(HttpStatus.BAD_REQUEST, "INVALID_BUDGET",
                    "Invalid maximum budget", "Budget cannot be negative.");
        }
        if (budgetMinPence != null && budgetMaxPence != null && budgetMinPence > budgetMaxPence) {
            throw new ApiProblemException(HttpStatus.BAD_REQUEST, "INVALID_BUDGET",
                    "Invalid budget range", "Minimum budget cannot exceed maximum budget.");
        }
        if (currency != null && !currency.trim().matches("^[A-Za-z]{3}$")) {
            throw new ApiProblemException(HttpStatus.BAD_REQUEST, "INVALID_CURRENCY",
                    "Invalid currency", "Currency must be a 3-letter ISO code.");
        }
    }

    private static ApiProblemException notFound(UUID jobId) {
        return new ApiProblemException(HttpStatus.NOT_FOUND, "JOB_NOT_FOUND",
                "Job not found", "The requested job was not found or is not accessible.");
    }

    public record CreateJobDraftCommand(
            String title,
            String description,
            JobType jobType,
            String locationName,
            String formattedAddress,
            Double latitude,
            Double longitude,
            Long budgetMinPence,
            Long budgetMaxPence,
            String currency
    ) {}

    public record UpdateJobDraftCommand(
            long version,
            String title,
            String description,
            JobType jobType,
            String locationName,
            String formattedAddress,
            Double latitude,
            Double longitude,
            Long budgetMinPence,
            Long budgetMaxPence,
            String currency
    ) {}

    public record AddJobSkillRequirementCommand(
            UUID skillId,
            SkillProficiency minimumProficiency,
            boolean required
    ) {}

    public record AddJobCredentialRequirementCommand(
            String credentialType,
            String title,
            String issuer,
            boolean required
    ) {}

    public record PageResult<T>(
            List<T> items,
            long total,
            int page,
            int size
    ) {}
}
