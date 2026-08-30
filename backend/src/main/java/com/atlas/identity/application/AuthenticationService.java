package com.atlas.identity.application;

import com.atlas.identity.audit.SecurityAuditService;
import com.atlas.identity.config.AuthProperties;
import com.atlas.identity.domain.PasswordResetToken;
import com.atlas.identity.domain.PlatformRole;
import com.atlas.identity.domain.RefreshToken;
import com.atlas.identity.domain.RefreshTokenStatus;
import com.atlas.identity.domain.UserAccount;
import com.atlas.identity.domain.UserSession;
import com.atlas.identity.infrastructure.PasswordResetTokenRepository;
import com.atlas.identity.infrastructure.RefreshTokenRepository;
import com.atlas.identity.infrastructure.UserAccountRepository;
import com.atlas.identity.infrastructure.UserSessionRepository;
import com.atlas.shared.error.ApiProblemException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthenticationService {
    private static final SecureRandom RANDOM = new SecureRandom();
    private final UserAccountRepository users;
    private final UserSessionRepository sessions;
    private final RefreshTokenRepository refreshTokens;
    private final PasswordResetTokenRepository resetTokens;
    private final PasswordEncoder passwords;
    private final TokenDigester digester;
    private final AccessTokenService accessTokens;
    private final PasswordRecoveryMailer mailer;
    private final SecurityAuditService audit;
    private final FixedWindowRateLimiter limiter;
    private final AuthProperties properties;
    private final Clock clock;

    public AuthenticationService(UserAccountRepository users, UserSessionRepository sessions,
                                 RefreshTokenRepository refreshTokens, PasswordResetTokenRepository resetTokens,
                                 PasswordEncoder passwords, TokenDigester digester, AccessTokenService accessTokens,
                                 PasswordRecoveryMailer mailer, SecurityAuditService audit,
                                 FixedWindowRateLimiter limiter, AuthProperties properties, Clock clock) {
        this.users = users;
        this.sessions = sessions;
        this.refreshTokens = refreshTokens;
        this.resetTokens = resetTokens;
        this.passwords = passwords;
        this.digester = digester;
        this.accessTokens = accessTokens;
        this.mailer = mailer;
        this.audit = audit;
        this.limiter = limiter;
        this.properties = properties;
        this.clock = clock;
    }

    @Transactional
    public AuthenticationResult register(String email, String password, PlatformRole role, RequestMetadata metadata) {
        String normalized = normalizeEmail(email);
        Instant now = Instant.now(clock);
        UserAccount user = UserAccount.create(email.trim(), normalized, passwords.encode(password), role, now);
        try {
            users.saveAndFlush(user);
        } catch (DataIntegrityViolationException exception) {
            throw new ApiProblemException(HttpStatus.CONFLICT, "EMAIL_ALREADY_REGISTERED",
                    "Registration conflict", "An account already exists for this email address.");
        }
        return createSession(user, metadata, now);
    }

    @Transactional
    public AuthenticationResult login(String email, String password, RequestMetadata metadata) {
        String normalized = normalizeEmail(email);
        limiter.check("login", metadata.ipAddress() + ':' + normalized,
                properties.loginLimit(), properties.rateLimitWindow());
        UserAccount user = users.findByEmailNormalized(normalized).orElse(null);
        if (user == null || !user.enabled() || !passwords.matches(password, user.passwordHash())) {
            audit.record(user == null ? null : user.id(), "LOGIN", "FAILURE",
                    user == null ? null : user.id(), metadata.ipAddress(), metadata.userAgent());
            throw unauthorized("Invalid email or password.");
        }
        if (passwords.upgradeEncoding(user.passwordHash())) {
            user.changePassword(passwords.encode(password), Instant.now(clock));
        }
        AuthenticationResult result = createSession(user, metadata, Instant.now(clock));
        audit.record(user.id(), "LOGIN", "SUCCESS", user.id(), metadata.ipAddress(), metadata.userAgent());
        return result;
    }

    @Transactional(noRollbackFor = ApiProblemException.class)
    public AuthenticationResult refresh(String rawToken, RequestMetadata metadata) {
        RefreshToken current = refreshTokens.findByTokenHash(digester.digest(rawToken))
                .orElseThrow(() -> unauthorized("Refresh token is invalid."));
        UserSession session = sessions.findById(current.sessionId())
                .orElseThrow(() -> unauthorized("Refresh token is invalid."));
        UserAccount user = users.findById(session.userId())
                .orElseThrow(() -> unauthorized("Refresh token is invalid."));
        Instant now = Instant.now(clock);

        if (current.status() != RefreshTokenStatus.ACTIVE) {
            current.markReused(now);
            refreshTokens.findByFamilyId(current.familyId()).forEach(token -> token.revoke(now));
            session.revoke(now);
            audit.record(user.id(), "REFRESH_TOKEN_REUSE", "DETECTED", user.id(),
                    metadata.ipAddress(), metadata.userAgent());
            throw unauthorized("Refresh token reuse was detected; the session has been revoked.");
        }
        if (!current.expiresAt().isAfter(now) || !session.activeAt(now) || !user.enabled()) {
            current.revoke(now);
            session.revoke(now);
            throw unauthorized("Refresh token has expired or was revoked.");
        }

        String replacementRaw = randomToken();
        RefreshToken replacement = RefreshToken.create(session.id(), current.familyId(),
                digester.digest(replacementRaw), now, now.plus(properties.refreshTokenTtl()));
        current.rotate(null, now);
        refreshTokens.saveAndFlush(current);
        refreshTokens.saveAndFlush(replacement);
        current.linkReplacement(replacement.id());
        session.touch(now);
        return result(user, session.id(), replacementRaw);
    }

    @Transactional
    public void logout(String rawToken, RequestMetadata metadata) {
        refreshTokens.findByTokenHash(digester.digest(rawToken)).ifPresent(token -> {
            Instant now = Instant.now(clock);
            token.revoke(now);
            sessions.findById(token.sessionId()).ifPresent(session -> {
                session.revoke(now);
                audit.record(session.userId(), "SESSION_REVOKED", "SUCCESS", session.id(),
                        metadata.ipAddress(), metadata.userAgent());
            });
        });
    }

    @Transactional
    public void requestPasswordReset(String email, RequestMetadata metadata) {
        String normalized = normalizeEmail(email);
        limiter.check("recovery", metadata.ipAddress() + ':' + normalized,
                properties.recoveryLimit(), properties.rateLimitWindow());
        users.findByEmailNormalized(normalized).ifPresent(user -> {
            Instant now = Instant.now(clock);
            resetTokens.findByUserIdAndUsedAtIsNull(user.id()).forEach(token -> token.consume(now));
            String raw = randomToken();
            Instant expiry = now.plus(properties.passwordResetTtl());
            resetTokens.save(PasswordResetToken.create(user.id(), digester.digest(raw), now, expiry));
            mailer.sendPasswordReset(user.emailDisplay(), raw, expiry);
        });
    }

    @Transactional
    public void resetPassword(String rawToken, String newPassword, RequestMetadata metadata) {
        PasswordResetToken token = resetTokens.findByTokenHash(digester.digest(rawToken))
                .orElseThrow(() -> invalidReset());
        Instant now = Instant.now(clock);
        if (token.usedAt() != null || !token.expiresAt().isAfter(now)) throw invalidReset();
        UserAccount user = users.findById(token.userId()).orElseThrow(() -> invalidReset());
        token.consume(now);
        user.changePassword(passwords.encode(newPassword), now);
        sessions.findByUserIdOrderByCreatedAtDesc(user.id()).forEach(session -> {
            session.revoke(now);
            refreshTokens.findBySessionId(session.id()).forEach(refresh -> refresh.revoke(now));
        });
        audit.record(user.id(), "PASSWORD_RESET", "SUCCESS", user.id(), metadata.ipAddress(), metadata.userAgent());
    }

    @Transactional(readOnly = true)
    public CurrentUser currentUser(UUID userId) {
        return users.findById(userId).map(AuthenticationService::toCurrentUser)
                .orElseThrow(() -> unauthorized("Account is unavailable."));
    }

    @Transactional(readOnly = true)
    public List<SessionView> sessions(UUID userId, UUID currentSessionId) {
        Instant now = Instant.now(clock);
        return sessions.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(session -> new SessionView(session.id(), session.createdAt(), session.lastSeenAt(),
                        session.expiresAt(), session.revokedAt(), session.ipAddress(), session.userAgent(),
                        session.id().equals(currentSessionId), session.activeAt(now)))
                .toList();
    }

    @Transactional
    public void revokeSession(UUID userId, UUID sessionId, RequestMetadata metadata) {
        UserSession session = sessions.findById(sessionId)
                .filter(found -> found.userId().equals(userId))
                .orElseThrow(() -> new ApiProblemException(HttpStatus.NOT_FOUND, "SESSION_NOT_FOUND",
                        "Session not found", "The requested session does not exist."));
        Instant now = Instant.now(clock);
        session.revoke(now);
        refreshTokens.findBySessionId(session.id()).forEach(token -> token.revoke(now));
        audit.record(userId, "SESSION_REVOKED", "SUCCESS", sessionId, metadata.ipAddress(), metadata.userAgent());
    }

    private AuthenticationResult createSession(UserAccount user, RequestMetadata metadata, Instant now) {
        Instant expiry = now.plus(properties.refreshTokenTtl());
        UserSession session = sessions.save(UserSession.create(
                user.id(), now, expiry, truncate(metadata.ipAddress(), 64), truncate(metadata.userAgent(), 512)));
        String rawRefresh = randomToken();
        refreshTokens.save(RefreshToken.create(session.id(), UUID.randomUUID(),
                digester.digest(rawRefresh), now, expiry));
        return result(user, session.id(), rawRefresh);
    }

    private AuthenticationResult result(UserAccount user, UUID sessionId, String rawRefresh) {
        AccessTokenService.IssuedAccessToken access = accessTokens.issue(user, sessionId);
        return new AuthenticationResult(access.value(), access.expiresAt(), rawRefresh,
                properties.refreshTokenTtl(), toCurrentUser(user), sessionId);
    }

    private static CurrentUser toCurrentUser(UserAccount user) {
        return new CurrentUser(user.id(), user.emailDisplay(), user.roles().stream().map(Enum::name).sorted().toList());
    }

    public static String normalizeEmail(String email) { return email.trim().toLowerCase(Locale.ROOT); }
    private static String randomToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
    private static String truncate(String value, int maximum) {
        if (value == null || value.length() <= maximum) return value;
        return value.substring(0, maximum);
    }
    private static ApiProblemException unauthorized(String detail) {
        return new ApiProblemException(HttpStatus.UNAUTHORIZED, "AUTHENTICATION_FAILED", "Authentication failed", detail);
    }
    private static ApiProblemException invalidReset() {
        return new ApiProblemException(HttpStatus.BAD_REQUEST, "PASSWORD_RESET_TOKEN_INVALID",
                "Password reset failed", "The password reset token is invalid or expired.");
    }

    public record RequestMetadata(String ipAddress, String userAgent) { }
    public record AuthenticationResult(String accessToken, Instant accessTokenExpiresAt, String refreshToken,
                                       java.time.Duration refreshTokenTtl, CurrentUser user, UUID sessionId) { }
    public record CurrentUser(UUID id, String email, List<String> roles) { }
    public record SessionView(UUID id, Instant createdAt, Instant lastSeenAt, Instant expiresAt, Instant revokedAt,
                              String ipAddress, String userAgent, boolean current, boolean active) { }
}
