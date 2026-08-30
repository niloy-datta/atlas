package com.atlas.worker.infrastructure;

import com.atlas.worker.domain.JobTypePreference;
import com.atlas.worker.domain.ProfileVisibility;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

@Repository
public class WorkerProfileRepository {
    private static final String SELECT_PROFILE = """
            SELECT p.id, p.user_id, p.public_handle, p.full_name, p.headline, p.bio,
                   p.experience_years, p.visibility, p.completion_score, p.completion_version,
                   p.version, p.created_at, p.updated_at,
                   ST_X(l.search_point::geometry) AS longitude,
                   ST_Y(l.search_point::geometry) AS latitude,
                   l.city, l.region, l.country_code,
                   pref.open_to_work, pref.max_distance_km, pref.preferred_job_types::text,
                   privacy.show_coarse_location, privacy.show_experience
              FROM worker_profiles p
              LEFT JOIN worker_locations l ON l.worker_profile_id = p.id
              LEFT JOIN worker_preferences pref ON pref.worker_profile_id = p.id
              LEFT JOIN worker_privacy_settings privacy ON privacy.worker_profile_id = p.id
            """;

    private final JdbcTemplate jdbc;
    private final ObjectMapper json;

    public WorkerProfileRepository(JdbcTemplate jdbc, ObjectMapper json) {
        this.jdbc = jdbc;
        this.json = json;
    }

    public Optional<ProfileData> findByUserId(UUID userId) {
        return one(SELECT_PROFILE + " WHERE p.user_id = ?", userId);
    }

    public Optional<ProfileData> findPublicByHandle(String handle) {
        return one(SELECT_PROFILE + " WHERE p.public_handle = ? AND p.visibility = 'PUBLIC'", handle);
    }

    public void insert(ProfileWrite profile, Instant now) {
        jdbc.update("""
                INSERT INTO worker_profiles
                    (id, user_id, public_handle, full_name, headline, bio, experience_years, visibility,
                     completion_score, completion_version, version, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
                """, profile.id(), profile.userId(), profile.handle(), profile.fullName(), profile.headline(),
                profile.bio(), profile.experienceYears(), profile.visibility().name(), profile.completionScore(),
                profile.completionVersion(), Timestamp.from(now), Timestamp.from(now));
    }

    public int update(ProfileWrite profile, long expectedVersion, Instant now) {
        return jdbc.update("""
                UPDATE worker_profiles
                   SET public_handle = ?, full_name = ?, headline = ?, bio = ?, experience_years = ?,
                       visibility = ?, completion_score = ?, completion_version = ?,
                       version = version + 1, updated_at = ?
                 WHERE id = ? AND user_id = ? AND version = ?
                """, profile.handle(), profile.fullName(), profile.headline(), profile.bio(),
                profile.experienceYears(), profile.visibility().name(), profile.completionScore(),
                profile.completionVersion(), Timestamp.from(now), profile.id(), profile.userId(), expectedVersion);
    }

    public void replaceLocation(UUID profileId, LocationWrite location, Instant now) {
        if (location == null) {
            jdbc.update("DELETE FROM worker_locations WHERE worker_profile_id = ?", profileId);
            return;
        }
        jdbc.update("""
                INSERT INTO worker_locations
                    (worker_profile_id, search_point, city, region, country_code, updated_at)
                VALUES (?, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography, ?, ?, ?, ?)
                ON CONFLICT (worker_profile_id) DO UPDATE SET
                    search_point = EXCLUDED.search_point, city = EXCLUDED.city, region = EXCLUDED.region,
                    country_code = EXCLUDED.country_code, updated_at = EXCLUDED.updated_at
                """, profileId, location.longitude(), location.latitude(), location.city(), location.region(),
                location.countryCode(), Timestamp.from(now));
    }

    public void replacePreferences(UUID profileId, PreferencesWrite preferences, Instant now) {
        if (preferences == null) {
            jdbc.update("DELETE FROM worker_preferences WHERE worker_profile_id = ?", profileId);
            return;
        }
        jdbc.update("""
                INSERT INTO worker_preferences
                    (worker_profile_id, open_to_work, max_distance_km, preferred_job_types, updated_at)
                VALUES (?, ?, ?, ?::jsonb, ?)
                ON CONFLICT (worker_profile_id) DO UPDATE SET
                    open_to_work = EXCLUDED.open_to_work, max_distance_km = EXCLUDED.max_distance_km,
                    preferred_job_types = EXCLUDED.preferred_job_types, updated_at = EXCLUDED.updated_at
                """, profileId, preferences.openToWork(), preferences.maxDistanceKm(),
                toJson(preferences.jobTypes().stream().map(Enum::name).toList()), Timestamp.from(now));
    }

    public void replacePrivacy(UUID profileId, PrivacyWrite privacy, Instant now) {
        jdbc.update("""
                INSERT INTO worker_privacy_settings
                    (worker_profile_id, show_coarse_location, show_experience, updated_at)
                VALUES (?, ?, ?, ?)
                ON CONFLICT (worker_profile_id) DO UPDATE SET
                    show_coarse_location = EXCLUDED.show_coarse_location,
                    show_experience = EXCLUDED.show_experience, updated_at = EXCLUDED.updated_at
                """, profileId, privacy.showCoarseLocation(), privacy.showExperience(), Timestamp.from(now));
    }

    private Optional<ProfileData> one(String sql, Object... arguments) {
        return jdbc.query(sql, resultSet -> resultSet.next() ? Optional.of(map(resultSet)) : Optional.empty(), arguments);
    }

    private ProfileData map(ResultSet rs) throws SQLException {
        Double longitude = number(rs, "longitude");
        Double latitude = number(rs, "latitude");
        LocationData location = longitude == null ? null : new LocationData(
                latitude, longitude, rs.getString("city"), rs.getString("region"), rs.getString("country_code"));
        Boolean openToWork = (Boolean) rs.getObject("open_to_work");
        PreferencesData preferences = openToWork == null ? null : new PreferencesData(openToWork,
                (Integer) rs.getObject("max_distance_km"), parseJobTypes(rs.getString("preferred_job_types")));
        Boolean showLocation = (Boolean) rs.getObject("show_coarse_location");
        PrivacyData privacy = new PrivacyData(Boolean.TRUE.equals(showLocation),
                Boolean.TRUE.equals(rs.getObject("show_experience")));
        return new ProfileData(rs.getObject("id", UUID.class), rs.getObject("user_id", UUID.class),
                rs.getString("public_handle"), rs.getString("full_name"), rs.getString("headline"),
                rs.getString("bio"), (Integer) rs.getObject("experience_years"),
                ProfileVisibility.valueOf(rs.getString("visibility")), rs.getInt("completion_score"),
                rs.getInt("completion_version"), rs.getLong("version"),
                rs.getTimestamp("created_at").toInstant(), rs.getTimestamp("updated_at").toInstant(),
                location, preferences, privacy);
    }

    private static Double number(ResultSet rs, String column) throws SQLException {
        Number value = (Number) rs.getObject(column);
        return value == null ? null : value.doubleValue();
    }

    private List<JobTypePreference> parseJobTypes(String value) {
        if (value == null) return List.of();
        try {
            return Arrays.stream(json.readValue(value, String[].class)).map(JobTypePreference::valueOf).toList();
        } catch (JacksonException exception) {
            throw new IllegalStateException("Stored worker job preferences are invalid", exception);
        }
    }

    private String toJson(Object value) {
        try {
            return json.writeValueAsString(value);
        } catch (JacksonException exception) {
            throw new IllegalStateException("Could not serialize worker preferences", exception);
        }
    }

    public record ProfileWrite(UUID id, UUID userId, String handle, String fullName, String headline, String bio,
                               Integer experienceYears, ProfileVisibility visibility,
                               int completionScore, int completionVersion) { }
    public record LocationWrite(double latitude, double longitude, String city, String region, String countryCode) { }
    public record PreferencesWrite(boolean openToWork, Integer maxDistanceKm, List<JobTypePreference> jobTypes) { }
    public record PrivacyWrite(boolean showCoarseLocation, boolean showExperience) { }
    public record ProfileData(UUID id, UUID userId, String handle, String fullName, String headline, String bio,
                              Integer experienceYears, ProfileVisibility visibility, int completionScore,
                              int completionVersion, long version, Instant createdAt, Instant updatedAt,
                              LocationData location, PreferencesData preferences, PrivacyData privacy) { }
    public record LocationData(double latitude, double longitude, String city, String region, String countryCode) { }
    public record PreferencesData(boolean openToWork, Integer maxDistanceKm, List<JobTypePreference> jobTypes) { }
    public record PrivacyData(boolean showCoarseLocation, boolean showExperience) { }
}
