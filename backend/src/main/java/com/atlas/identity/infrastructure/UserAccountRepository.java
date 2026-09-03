package com.atlas.identity.infrastructure;

import com.atlas.identity.domain.UserAccount;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserAccountRepository extends JpaRepository<UserAccount, UUID> {
    Optional<UserAccount> findByEmailNormalized(String emailNormalized);
    Optional<UserAccount> findByFirebaseUid(String firebaseUid);
    boolean existsByFirebaseUid(String firebaseUid);
    boolean existsByEmailNormalized(String emailNormalized);
}
