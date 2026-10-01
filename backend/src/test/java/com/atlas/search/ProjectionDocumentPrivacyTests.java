package com.atlas.search;

import static org.assertj.core.api.Assertions.assertThat;

import com.atlas.search.domain.ProjectionDocument;
import org.junit.jupiter.api.Test;

class ProjectionDocumentPrivacyTests {
    @Test
    void privateWorkerFieldsAreAbsentFromPublicProjection() {
        ProjectionDocument hidden = ProjectionDocument.worker(
                "worker:1", "worker-one", "Worker One", "Electrician", "Public bio",
                12, false, "Dhaka", "Dhaka", "BD", false, true);

        assertThat(hidden.source())
                .doesNotContainKeys(
                        "email", "phone", "latitude", "longitude", "searchPoint",
                        "experienceYears", "coarseLocation");

        ProjectionDocument visible = ProjectionDocument.worker(
                "worker:1", "worker-one", "Worker One", "Electrician", "Public bio",
                12, true, "Dhaka", "Dhaka", "BD", true, true);

        assertThat(visible.source()).containsEntry("experienceYears", 12);
        assertThat(visible.source()).containsKey("coarseLocation");
        assertThat(visible.source()).doesNotContainKeys("email", "phone", "latitude", "longitude");
    }
}
