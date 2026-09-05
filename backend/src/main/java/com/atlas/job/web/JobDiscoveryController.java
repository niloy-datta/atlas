package com.atlas.job.web;

import com.atlas.job.application.JobService;
import com.atlas.job.application.JobService.PageResult;
import com.atlas.job.domain.JobDetailView;
import com.atlas.job.domain.JobSummaryView;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/jobs")
public class JobDiscoveryController {
    private final JobService jobService;

    public JobDiscoveryController(JobService jobService) {
        this.jobService = jobService;
    }

    @GetMapping
    public PageResult<JobSummaryView> search(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lon,
            @RequestParam(required = false, defaultValue = "25") Double radiusKm,
            @RequestParam(required = false) String jobType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return jobService.searchPublicJobs(query, lat, lon, radiusKm, jobType, page, size);
    }

    @GetMapping("/{jobId}")
    public JobDetailView getJobDetail(@PathVariable UUID jobId) {
        return jobService.getPublicJob(jobId);
    }
}

