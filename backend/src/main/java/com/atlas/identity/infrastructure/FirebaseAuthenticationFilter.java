package com.atlas.identity.infrastructure;

import com.atlas.identity.application.FirebaseTokenVerifier;
import com.atlas.identity.application.FirebaseVerifiedUser;
import com.atlas.identity.domain.AtlasPrincipal;
import com.atlas.identity.domain.UserAccount;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.Optional;
import java.util.Set;

public class FirebaseAuthenticationFilter extends OncePerRequestFilter {

    private final FirebaseTokenVerifier tokenVerifier;
    private final UserAccountRepository userAccountRepository;

    public FirebaseAuthenticationFilter(FirebaseTokenVerifier tokenVerifier,
                                        UserAccountRepository userAccountRepository) {
        this.tokenVerifier = tokenVerifier;
        this.userAccountRepository = userAccountRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7).trim();
            if (!token.isEmpty()) {
                try {
                    FirebaseVerifiedUser firebaseUser = tokenVerifier.verify(token);

                    Optional<UserAccount> userOpt = userAccountRepository.findByFirebaseUid(firebaseUser.uid());
                    if (userOpt.isEmpty() && firebaseUser.email() != null) {
                        String normalizedEmail = firebaseUser.email().trim().toLowerCase();
                        Optional<UserAccount> byEmail = userAccountRepository.findByEmailNormalized(normalizedEmail);
                        if (byEmail.isPresent()) {
                            UserAccount existing = byEmail.get();
                            if (existing.firebaseUid() == null) {
                                existing.linkFirebaseUid(firebaseUser.uid(), Instant.now());
                                userAccountRepository.save(existing);
                                userOpt = Optional.of(existing);
                            }
                        }
                    }

                    AtlasPrincipal principal;
                    if (userOpt.isPresent()) {
                        UserAccount user = userOpt.get();
                        if (!user.enabled()) {
                            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                            response.setContentType("application/problem+json");
                            response.getWriter().write("""
                                    {"type":"about:blank","title":"Account Disabled","status":403,"detail":"User account is disabled","code":"ACCOUNT_DISABLED"}
                                    """.trim());
                            return;
                        }
                        principal = new AtlasPrincipal(
                                user.id(),
                                firebaseUser.uid(),
                                user.emailDisplay(),
                                firebaseUser.emailVerified(),
                                user.roles()
                        );
                    } else {
                        principal = new AtlasPrincipal(
                                null,
                                firebaseUser.uid(),
                                firebaseUser.email(),
                                firebaseUser.emailVerified(),
                                Set.of()
                        );
                    }

                    AtlasAuthenticationToken authentication = new AtlasAuthenticationToken(principal, token);
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                } catch (Exception e) {
                    SecurityContextHolder.clearContext();
                }
            }
        }

        filterChain.doFilter(request, response);
    }
}
