package com.atlas.search.application;

import com.atlas.search.domain.ProjectionDocument;
import java.util.List;

public interface ProjectionSource {
    List<ProjectionDocument> allPublicDocuments();
}
