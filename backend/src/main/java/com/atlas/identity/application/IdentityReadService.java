package com.atlas.identity.application;

import com.atlas.identity.infrastructure.UserAccountRepository;
import com.atlas.shared.error.ApiProblemException;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class IdentityReadService {
    private final UserAccountRepository users;

    public IdentityReadService(UserAccountRepository users) {
        this.users = users;
    }

    @Transactional(readOnly = true)
    public IdentitySummary require(UUID userId) {
        return users.findById(userId)
                .map(user -> new IdentitySummary(user.id(), user.emailNormalized(), user.emailDisplay()))
                .orElseThrow(() -> new ApiProblemException(HttpStatus.UNAUTHORIZED, "ACCOUNT_UNAVAILABLE",
                        "Account unavailable", "The authenticated account is unavailable."));
    }

    public record IdentitySummary(UUID id, String normalizedEmail, String displayEmail) { }
}
