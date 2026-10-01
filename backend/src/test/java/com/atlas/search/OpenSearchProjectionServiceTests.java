package com.atlas.search;

import static org.assertj.core.api.Assertions.assertThat;

import com.atlas.search.application.OpenSearchProjectionService;
import com.atlas.search.application.ProjectionSource;
import com.atlas.search.application.SearchProjectionStore;
import com.atlas.search.domain.ProjectionDocument;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Test;

class OpenSearchProjectionServiceTests {
    @Test
    void fullReindexRecreatesProjectionFromPostgresSource() {
        ProjectionDocument a = ProjectionDocument.job(
                "job:1", "Org", "Job A", "Desc", "SERVICE", "Dhaka", 100L, 200L, "BDT");
        ProjectionDocument b = ProjectionDocument.shift(
                "shift:1", "Org", "Shift B", "Desc", "Dhaka", 100L, "BDT",
                "2026-10-01T10:00:00Z", "2026-10-01T12:00:00Z");

        FakeStore store = new FakeStore();
        store.documents.add("stale:old");
        OpenSearchProjectionService service = new OpenSearchProjectionService(() -> List.of(a, b), store);

        service.rebuildAll();

        assertThat(store.recreated).isTrue();
        assertThat(store.documents).containsExactlyInAnyOrder("job:1", "shift:1");
    }

    @Test
    void synchronizeDeletesStaleDocumentsAndKeepsCurrentOnes() {
        ProjectionDocument current = ProjectionDocument.job(
                "job:2", "Org", "Current", "Desc", "SERVICE", "Dhaka", null, null, "BDT");

        FakeStore store = new FakeStore();
        store.documents.add("job:2");
        store.documents.add("job:stale");
        OpenSearchProjectionService service = new OpenSearchProjectionService(() -> List.of(current), store);

        service.synchronizeAll();

        assertThat(store.documents).containsExactly("job:2");
        assertThat(store.deleted).containsExactly("job:stale");
    }

    private static final class FakeStore implements SearchProjectionStore {
        private final Set<String> documents = new HashSet<>();
        private final List<String> deleted = new ArrayList<>();
        private boolean recreated;

        @Override
        public void recreateIndex() {
            recreated = true;
            documents.clear();
        }

        @Override
        public void upsert(ProjectionDocument document) {
            documents.add(document.id());
        }

        @Override
        public void delete(String id) {
            documents.remove(id);
            deleted.add(id);
        }

        @Override
        public Set<String> ids() {
            return Set.copyOf(documents);
        }
    }
}
