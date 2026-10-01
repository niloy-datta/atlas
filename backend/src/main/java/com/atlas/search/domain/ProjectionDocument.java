package com.atlas.search.domain;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Collections;

public record ProjectionDocument(String id, Map<String, Object> source) {
    public static ProjectionDocument worker(
            String id, String handle, String fullName, String headline, String bio,
            Integer experienceYears, boolean showExperience,
            String city, String region, String countryCode, boolean showCoarseLocation,
            boolean openToWork) {
        Map<String, Object> source = new LinkedHashMap<>();
        source.put("entityType", "WORKER");
        source.put("handle", handle);
        source.put("fullName", fullName);
        source.put("headline", headline);
        source.put("bio", bio);
        source.put("openToWork", openToWork);
        if (showExperience) source.put("experienceYears", experienceYears);
        if (showCoarseLocation) {
            Map<String, Object> location = new LinkedHashMap<>();
            location.put("city", city);
            location.put("region", region);
            location.put("countryCode", countryCode);
            source.put("coarseLocation", location);
        }
        return new ProjectionDocument(id, Collections.unmodifiableMap(new LinkedHashMap<>(source)));
    }

    public static ProjectionDocument job(String id, String organizationName, String title,
                                         String description, String jobType, String locationName,
                                         Long budgetMinPence, Long budgetMaxPence, String currency) {
        Map<String, Object> source = new LinkedHashMap<>();
        source.put("entityType", "JOB");
        source.put("organizationName", organizationName);
        source.put("title", title);
        source.put("description", description);
        source.put("jobType", jobType);
        source.put("locationName", locationName);
        source.put("budgetMinPence", budgetMinPence);
        source.put("budgetMaxPence", budgetMaxPence);
        source.put("currency", currency);
        return new ProjectionDocument(id, Collections.unmodifiableMap(new LinkedHashMap<>(source)));
    }

    public static ProjectionDocument shift(String id, String organizationName, String title,
                                           String description, String locationName,
                                           long hourlyRatePence, String currency,
                                           String startTime, String endTime) {
        Map<String, Object> source = new LinkedHashMap<>();
        source.put("entityType", "SHIFT");
        source.put("organizationName", organizationName);
        source.put("title", title);
        source.put("description", description);
        source.put("locationName", locationName);
        source.put("hourlyRatePence", hourlyRatePence);
        source.put("currency", currency);
        source.put("startTime", startTime);
        source.put("endTime", endTime);
        return new ProjectionDocument(id, Collections.unmodifiableMap(new LinkedHashMap<>(source)));
    }
}
