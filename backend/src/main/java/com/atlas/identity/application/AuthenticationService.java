package com.atlas.identity.application;

import com.atlas.identity.audit.SecurityAuditService;
import com.atlas.identity.domain.AtlasPrincipal;
import com.atlas.identity.domain.PlatformRole;
import com.atlas.identity.domain.UserAccount;
import com.atlas.identity.infrastructure.UserAccountRepository;
import com.atlas.shared.error.ApiProblemException;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthenticationService {
    private final UserAccountRepository users;
    private final SecurityAuditService audit;
    private final Clock clock;

    public AuthenticationService(UserAccountRepository users, SecurityAuditService audit, Clock clock) {
        this.users = users;
        this.audit = audit;
        this.clock = clock;
    }

    @Transactional
    public BootstrapResult bootstrap(AtlasPrincipal principal, String requestedAccountType, RequestMetadata metadata) {
        if (principal == null || principal.firebaseUid() == null || principal.firebaseUid().isBlank()) {
            throw new ApiProblemException(HttpStatus.UNAUTHORIZED, "UNAUTHENTICATED",
                    "Unauthenticated", "Valid Firebase identity is required to bootstrap.");
        }

        String firebaseUid = principal.firebaseUid();

        // 1. Idempotency: Return existing account if already linked with this firebaseUid
        Optional<UserAccount> existingByUid = users.findByFirebaseUid(firebaseUid);
        if (existingByUid.isPresent()) {
            UserAccount existing = existingByUid.get();
            return new BootstrapResult(toCurrentUser(existing), false);
        }

        String email = principal.email();
        if (email == null || email.isBlank()) {
            throw new ApiProblemException(HttpStatus.BAD_REQUEST, "MISSING_EMAIL",
                    "Missing Email", "Firebase user email is required to bootstrap.");
        }
        String normalized = normalizeEmail(email);

        // 2. Reject if email is already taken by another account (no insecure automatic email linking)
        Optional<UserAccount> existingByEmail = users.findByEmailNormalized(normalized);
        if (existingByEmail.isPresent()) {
            throw new ApiProblemException(HttpStatus.CONFLICT, "EMAIL_ALREADY_REGISTERED",
                    "Registration conflict", "An account already exists for this email address.");
        }

        // 3. Validate requested account type
        PlatformRole role;
        if ("worker".equalsIgnoreCase(requestedAccountType)) {
            role = PlatformRole.WORKER;
        } else if ("employer".equalsIgnoreCase(requestedAccountType)) {
            role = PlatformRole.EMPLOYER_ADMIN;
        } else {
            throw new ApiProblemException(HttpStatus.BAD_REQUEST, "INVALID_ACCOUNT_TYPE",
                    "Invalid Account Type", "Account type must be 'worker' or 'employer'.");
        }

        Instant now = Instant.now(clock);
        UserAccount newUser = UserAccount.createWithFirebase(firebaseUid, email.trim(), normalized, role, now);
        try {
            users.saveAndFlush(newUser);
        } catch (DataIntegrityViolationException exception) {
            // Check for concurrent duplicate bootstrap request
            Optional<UserAccount> concurrent = users.findByFirebaseUid(firebaseUid);
            if (concurrent.isPresent()) {
                return new BootstrapResult(toCurrentUser(concurrent.get()), false);
            }
            throw new ApiProblemException(HttpStatus.CONFLICT, "ACCOUNT_CONFLICT",
                    "Registration conflict", "An account conflict occurred during bootstrap.");
        }

        audit.record(newUser.id(), "ACCOUNT_BOOTSTRAPPED", "SUCCESS", newUser.id(), metadata.ipAddress(), metadata.userAgent());
        return new BootstrapResult(toCurrentUser(newUser), true);
    }

    @Transactional(readOnly = true)
    public CurrentUser currentUser(UUID userId) {
        return users.findById(userId).map(AuthenticationService::toCurrentUser)
                .orElseThrow(() -> new ApiProblemException(HttpStatus.UNAUTHORIZED, "AUTHENTICATION_FAILED",
                        "Authentication failed", "Account is unavailable."));
    }

    private static CurrentUser toCurrentUser(UserAccount user) {
        return new CurrentUser(user.id(), user.emailDisplay(), user.roles().stream().map(Enum::name).sorted().toList());
    }

    public static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    public record RequestMetadata(String ipAddress, String userAgent) { }
    public record CurrentUser(UUID id, String email, List<String> roles) { }
    public record BootstrapResult(CurrentUser user, boolean created) { }
}
