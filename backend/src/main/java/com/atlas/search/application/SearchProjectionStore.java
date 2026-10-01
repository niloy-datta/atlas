package com.atlas.search.application;

import com.atlas.search.domain.ProjectionDocument;
import java.util.Set;

public interface SearchProjectionStore {
    void recreateIndex();
    void upsert(ProjectionDocument document);
    void delete(String id);
    Set<String> ids();
}
