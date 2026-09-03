package com.atlas.identity.web;

import com.atlas.identity.application.AuthenticationService;
import com.atlas.identity.application.AuthenticationService.AuthenticationResult;
import com.atlas.identity.application.AuthenticationService.RequestMetadata;
import com.atlas.identity.config.AuthProperties;
import com.atlas.identity.domain.PlatformRole;
import com.atlas.shared.error.ApiProblemException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.UUID;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthenticationController {
    private static final String REFRESH_COOKIE = "atlas_refresh";
    private static final SecureRandom RANDOM = new SecureRandom();
    private final AuthenticationService authentication;
    private final CookieRequestGuard cookieGuard;
    private final AuthProperties properties;

    public AuthenticationController(AuthenticationService authentication, CookieRequestGuard cookieGuard,
                                    AuthProperties properties) {
        this.authentication = authentication;
        this.cookieGuard = cookieGuard;
        this.properties = properties;
    }

    @PostMapping("/register/worker")
    ResponseEntity<AuthResponse> registerWorker(@Valid @RequestBody CredentialsRequest request,
                                                HttpServletRequest servletRequest) {
        return authenticated(authentication.register(request.email(), request.password(), PlatformRole.WORKER,
                metadata(servletRequest)), HttpStatus.CREATED);
    }

    @PostMapping("/register/employer")
    ResponseEntity<AuthResponse> registerEmployer(@Valid @RequestBody CredentialsRequest request,
                                                  HttpServletRequest servletRequest) {
        return authenticated(authentication.register(request.email(), request.password(), PlatformRole.EMPLOYER_ADMIN,
                metadata(servletRequest)), HttpStatus.CREATED);
    }

    @PostMapping("/login")
    ResponseEntity<AuthResponse> login(@Valid @RequestBody CredentialsRequest request,
                                       HttpServletRequest servletRequest) {
        return authenticated(authentication.login(request.email(), request.password(), metadata(servletRequest)),
                HttpStatus.OK);
    }

    @PostMapping("/refresh")
    ResponseEntity<AuthResponse> refresh(@CookieValue(name = REFRESH_COOKIE, required = false) String refreshToken,
                                         HttpServletRequest request) {
        cookieGuard.validate(request);
        if (refreshToken == null || refreshToken.isBlank()) throw missingRefreshToken();
        return authenticated(authentication.refresh(refreshToken, metadata(request)), HttpStatus.OK);
    }

    @PostMapping("/logout")
    ResponseEntity<Void> logout(@CookieValue(name = REFRESH_COOKIE, required = false) String refreshToken,
                                HttpServletRequest request) {
        cookieGuard.validate(request);
        if (refreshToken != null && !refreshToken.isBlank()) authentication.logout(refreshToken, metadata(request));
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, deleteCookie(REFRESH_COOKIE, "/api/v1/auth").toString())
                .header(HttpHeaders.SET_COOKIE, deleteCookie(CookieRequestGuard.CSRF_COOKIE, "/").toString())
                .cacheControl(CacheControl.noStore())
                .build();
    }

    @PostMapping("/password-recovery")
    ResponseEntity<Void> requestPasswordReset(@Valid @RequestBody RecoveryRequest body, HttpServletRequest request) {
        authentication.requestPasswordReset(body.email(), metadata(request));
        return ResponseEntity.accepted().cacheControl(CacheControl.noStore()).build();
    }

    @PostMapping("/password-reset")
    ResponseEntity<Void> resetPassword(@Valid @RequestBody PasswordResetRequest body, HttpServletRequest request) {
        authentication.resetPassword(body.token(), body.newPassword(), metadata(request));
        return ResponseEntity.noContent().cacheControl(CacheControl.noStore()).build();
    }

    @PostMapping("/bootstrap")
    ResponseEntity<BootstrapResponse> bootstrap(@Valid @RequestBody BootstrapRequest request,
                                                @AuthenticationPrincipal com.atlas.identity.domain.AtlasPrincipal principal,
                                                HttpServletRequest servletRequest) {
        if (principal == null) {
            throw new ApiProblemException(HttpStatus.UNAUTHORIZED, "UNAUTHENTICATED",
                    "Unauthenticated", "Valid Firebase identity token is required.");
        }
        var result = authentication.bootstrap(principal, request.accountType(), metadata(servletRequest));
        return ResponseEntity.status(result.created() ? HttpStatus.CREATED : HttpStatus.OK)
                .body(new BootstrapResponse(result.user(), result.created()));
    }

    @GetMapping("/me")
    AuthenticationService.CurrentUser me(@AuthenticationPrincipal com.atlas.identity.domain.AtlasPrincipal principal) {
        if (principal == null || principal.userId() == null) {
            throw new ApiProblemException(HttpStatus.UNAUTHORIZED, "UNAUTHENTICATED",
                    "Unauthenticated", "Atlas user account is not provisioned. Please complete bootstrap.");
        }
        return authentication.currentUser(principal.userId());
    }

    @GetMapping("/sessions")
    List<AuthenticationService.SessionView> sessions(@AuthenticationPrincipal com.atlas.identity.domain.AtlasPrincipal principal) {
        if (principal == null || principal.userId() == null) {
            return List.of();
        }
        return authentication.sessions(principal.userId(), null);
    }

    @DeleteMapping("/sessions/{sessionId}")
    ResponseEntity<Void> revokeSession(@PathVariable UUID sessionId,
                                       @AuthenticationPrincipal com.atlas.identity.domain.AtlasPrincipal principal,
                                       HttpServletRequest request) {
        if (principal != null && principal.userId() != null) {
            authentication.revokeSession(principal.userId(), sessionId, metadata(request));
        }
        return ResponseEntity.noContent().build();
    }

    private ResponseEntity<AuthResponse> authenticated(AuthenticationResult result, HttpStatus status) {
        String csrfToken = randomToken();
        ResponseCookie refresh = ResponseCookie.from(REFRESH_COOKIE, result.refreshToken())
                .httpOnly(true).secure(properties.secureCookies()).sameSite("Lax")
                .path("/api/v1/auth").maxAge(result.refreshTokenTtl()).build();
        ResponseCookie csrf = ResponseCookie.from(CookieRequestGuard.CSRF_COOKIE, csrfToken)
                .httpOnly(false).secure(properties.secureCookies()).sameSite("Lax")
                .path("/").maxAge(result.refreshTokenTtl()).build();
        AuthResponse body = new AuthResponse(result.accessToken(), "Bearer", result.accessTokenExpiresAt(), result.user());
        return ResponseEntity.status(status)
                .header(HttpHeaders.SET_COOKIE, refresh.toString())
                .header(HttpHeaders.SET_COOKIE, csrf.toString())
                .cacheControl(CacheControl.noStore())
                .body(body);
    }

    private ResponseCookie deleteCookie(String name, String path) {
        return ResponseCookie.from(name, "").httpOnly(REFRESH_COOKIE.equals(name))
                .secure(properties.secureCookies()).sameSite("Lax").path(path).maxAge(Duration.ZERO).build();
    }

    private static RequestMetadata metadata(HttpServletRequest request) {
        return new RequestMetadata(request.getRemoteAddr(), request.getHeader("User-Agent"));
    }

    private static String randomToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static ApiProblemException missingRefreshToken() {
        return new ApiProblemException(HttpStatus.UNAUTHORIZED, "AUTHENTICATION_FAILED",
                "Authentication failed", "Refresh token is missing.");
    }

    public record BootstrapRequest(
            @NotBlank
            @jakarta.validation.constraints.Pattern(regexp = "(?i)^(worker|employer)$", message = "accountType must be either 'worker' or 'employer'")
            String accountType
    ) {}
    public record BootstrapResponse(
            AuthenticationService.CurrentUser user,
            boolean created
    ) {}

    public record CredentialsRequest(
            @NotBlank @Email @Size(max = 320) String email,
            @NotBlank @Size(min = 12, max = 128) String password) { }
    public record RecoveryRequest(@NotBlank @Email @Size(max = 320) String email) { }
    public record PasswordResetRequest(
            @NotBlank @Size(max = 256) String token,
            @NotBlank @Size(min = 12, max = 128) String newPassword) { }
    public record AuthResponse(String accessToken, String tokenType, Instant expiresAt,
                               AuthenticationService.CurrentUser user) { }
}
