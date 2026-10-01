package com.atlas.search.infrastructure;

import com.atlas.search.application.ProjectionSource;
import com.atlas.search.domain.ProjectionDocument;
import java.util.ArrayList;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class PublicProjectionRepository implements ProjectionSource {
    private final JdbcTemplate jdbc;

    public PublicProjectionRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public List<ProjectionDocument> allPublicDocuments() {
        List<ProjectionDocument> documents = new ArrayList<>();
        documents.addAll(workers());
        documents.addAll(jobs());
        documents.addAll(shifts());
        return List.copyOf(documents);
    }

    private List<ProjectionDocument> workers() {
        return jdbc.query("""
                SELECT p.user_id, p.public_handle, p.full_name, p.headline, p.bio,
                       p.experience_years,
                       COALESCE(pr.show_experience, false) AS show_experience,
                       l.city, l.region, l.country_code,
                       COALESCE(pr.show_coarse_location, false) AS show_coarse_location,
                       COALESCE(pref.open_to_work, false) AS open_to_work
                  FROM worker_profiles p
             LEFT JOIN worker_privacy_settings pr ON pr.worker_profile_id = p.id
             LEFT JOIN worker_locations l ON l.worker_profile_id = p.id
             LEFT JOIN worker_preferences pref ON pref.worker_profile_id = p.id
                 WHERE p.visibility = 'PUBLIC'
                   AND p.public_handle IS NOT NULL
                """, (rs, n) -> ProjectionDocument.worker(
                "worker:" + rs.getObject("user_id"),
                rs.getString("public_handle"),
                rs.getString("full_name"),
                rs.getString("headline"),
                rs.getString("bio"),
                (Integer) rs.getObject("experience_years"),
                rs.getBoolean("show_experience"),
                rs.getString("city"),
                rs.getString("region"),
                rs.getString("country_code"),
                rs.getBoolean("show_coarse_location"),
                rs.getBoolean("open_to_work")));
    }

    private List<ProjectionDocument> jobs() {
        return jdbc.query("""
                SELECT j.id, o.name AS organization_name, j.title, j.description,
                       j.job_type, j.location_name, j.budget_min_pence,
                       j.budget_max_pence, j.currency
                  FROM jobs j
                  JOIN organizations o ON o.id = j.organization_id
                 WHERE j.status = 'PUBLISHED'
                """, (rs, n) -> ProjectionDocument.job(
                "job:" + rs.getObject("id"),
                rs.getString("organization_name"),
                rs.getString("title"),
                rs.getString("description"),
                rs.getString("job_type"),
                rs.getString("location_name"),
                (Long) rs.getObject("budget_min_pence"),
                (Long) rs.getObject("budget_max_pence"),
                rs.getString("currency")));
    }

    private List<ProjectionDocument> shifts() {
        return jdbc.query("""
                SELECT s.id, o.name AS organization_name, s.title, s.description,
                       s.location_name, s.hourly_rate_pence, s.currency,
                       s.start_time, s.end_time
                  FROM shifts s
                  JOIN organizations o ON o.id = s.organization_id
                 WHERE s.status IN ('PUBLISHED', 'IN_PROGRESS')
                """, (rs, n) -> ProjectionDocument.shift(
                "shift:" + rs.getObject("id"),
                rs.getString("organization_name"),
                rs.getString("title"),
                rs.getString("description"),
                rs.getString("location_name"),
                rs.getLong("hourly_rate_pence"),
                rs.getString("currency"),
                rs.getTimestamp("start_time").toInstant().toString(),
                rs.getTimestamp("end_time").toInstant().toString()));
    }
}
