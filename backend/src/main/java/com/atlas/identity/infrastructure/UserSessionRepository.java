package com.atlas.identity.infrastructure;

import com.atlas.identity.domain.UserSession;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserSessionRepository extends JpaRepository<UserSession, UUID> {
    List<UserSession> findByUserIdOrderByCreatedAtDesc(UUID userId);
}
