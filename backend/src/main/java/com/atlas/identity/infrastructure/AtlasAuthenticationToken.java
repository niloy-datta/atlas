package com.atlas.identity.infrastructure;

import com.atlas.identity.domain.AtlasPrincipal;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.Collection;
import java.util.Collections;

public class AtlasAuthenticationToken extends AbstractAuthenticationToken {

    private final AtlasPrincipal principal;
    private final String credentials;

    public AtlasAuthenticationToken(AtlasPrincipal principal, String credentials) {
        super(toAuthorities(principal));
        this.principal = principal;
        this.credentials = credentials;
        setAuthenticated(true);
    }

    private static Collection<? extends GrantedAuthority> toAuthorities(AtlasPrincipal principal) {
        if (principal == null || principal.roles() == null || principal.roles().isEmpty()) {
            return Collections.emptyList();
        }
        return principal.roles().stream()
                .map(r -> new SimpleGrantedAuthority("ROLE_" + r.name()))
                .toList();
    }

    @Override
    public String getCredentials() {
        return credentials;
    }

    @Override
    public AtlasPrincipal getPrincipal() {
        return principal;
    }
}
