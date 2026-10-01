package com.atlas.search.application;

import com.atlas.search.domain.ProjectionDocument;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnProperty(name = "atlas.opensearch.enabled", havingValue = "true")
public class OpenSearchProjectionService {
    private final ProjectionSource source;
    private final SearchProjectionStore store;

    public OpenSearchProjectionService(ProjectionSource source, SearchProjectionStore store) {
        this.source = source;
        this.store = store;
    }

    public void rebuildAll() {
        store.recreateIndex();
        source.allPublicDocuments().forEach(store::upsert);
    }

    @Scheduled(fixedDelayString = "${atlas.opensearch.sync-delay-ms:60000}")
    public void synchronizeAll() {
        List<ProjectionDocument> documents = source.allPublicDocuments();
        Set<String> sourceIds = new HashSet<>();
        for (ProjectionDocument document : documents) {
            sourceIds.add(document.id());
            store.upsert(document);
        }

        Set<String> stale = new HashSet<>(store.ids());
        stale.removeAll(sourceIds);
        stale.forEach(store::delete);
    }
}
