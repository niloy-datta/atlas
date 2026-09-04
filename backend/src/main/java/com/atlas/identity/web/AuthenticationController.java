package com.atlas.identity.web;

import com.atlas.identity.application.AuthenticationService;
import com.atlas.identity.application.AuthenticationService.CurrentUser;
import com.atlas.identity.application.AuthenticationService.RequestMetadata;
import com.atlas.identity.domain.AtlasPrincipal;
import com.atlas.shared.error.ApiProblemException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthenticationController {
    private final AuthenticationService authentication;

    public AuthenticationController(AuthenticationService authentication) {
        this.authentication = authentication;
    }

    @PostMapping("/bootstrap")
    ResponseEntity<BootstrapResponse> bootstrap(@Valid @RequestBody BootstrapRequest request,
                                                @AuthenticationPrincipal AtlasPrincipal principal,
                                                HttpServletRequest servletRequest) {
        if (principal == null || principal.firebaseUid() == null) {
            throw new ApiProblemException(HttpStatus.UNAUTHORIZED, "UNAUTHENTICATED",
                    "Unauthenticated", "Valid Firebase identity token is required.");
        }
        var result = authentication.bootstrap(principal, request.accountType(), metadata(servletRequest));
        return ResponseEntity.status(result.created() ? HttpStatus.CREATED : HttpStatus.OK)
                .body(new BootstrapResponse(result.user(), result.created()));
    }

    @GetMapping("/me")
    CurrentUser me(@AuthenticationPrincipal AtlasPrincipal principal) {
        if (principal == null || principal.userId() == null) {
            throw new ApiProblemException(HttpStatus.UNAUTHORIZED, "UNAUTHENTICATED",
                    "Unauthenticated", "Atlas user account is not provisioned. Please complete bootstrap.");
        }
        return authentication.currentUser(principal.userId());
    }

    private static RequestMetadata metadata(HttpServletRequest request) {
        return new RequestMetadata(request.getRemoteAddr(), request.getHeader("User-Agent"));
    }

    public record BootstrapRequest(@NotBlank(message = "Account type is required") String accountType) { }
    public record BootstrapResponse(CurrentUser user, boolean created) { }
}
