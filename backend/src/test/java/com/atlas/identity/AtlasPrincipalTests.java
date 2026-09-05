package com.atlas.identity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.atlas.identity.domain.AtlasPrincipal;
import com.atlas.identity.domain.PlatformRole;
import org.junit.jupiter.api.Test;

import java.util.Set;
import java.util.UUID;

class AtlasPrincipalTests {

    @Test
    void provisionedPrincipalReturnsCorrectDetails() {
        UUID userId = UUID.randomUUID();
        String firebaseUid = "fb-user-1";
        String email = "worker@atlas.test";
        Set<PlatformRole> roles = Set.of(PlatformRole.WORKER);

        AtlasPrincipal principal = new AtlasPrincipal(userId, firebaseUid, email, true, roles);

        assertThat(principal.isProvisioned()).isTrue();
        assertThat(principal.userId()).isEqualTo(userId);
        assertThat(principal.firebaseUid()).isEqualTo(firebaseUid);
        assertThat(principal.email()).isEqualTo(email);
        assertThat(principal.emailVerified()).isTrue();
        assertThat(principal.getName()).isEqualTo(userId.toString());
        assertThat(principal.requireUserId()).isEqualTo(userId);
        assertThat(principal.hasRole(PlatformRole.WORKER)).isTrue();
        assertThat(principal.hasRole(PlatformRole.EMPLOYER_ADMIN)).isFalse();
    }

    @Test
    void unprovisionedPrincipalBehavesSafely() {
        String firebaseUid = "fb-unprovisioned";
        String email = "new@atlas.test";

        AtlasPrincipal principal = new AtlasPrincipal(null, firebaseUid, email, false, null);

        assertThat(principal.isProvisioned()).isFalse();
        assertThat(principal.userId()).isNull();
        assertThat(principal.firebaseUid()).isEqualTo(firebaseUid);
        assertThat(principal.getName()).isEqualTo(firebaseUid);
        assertThat(principal.roles()).isEmpty();

        assertThatThrownBy(principal::requireUserId)
                .isInstanceOf(NullPointerException.class)
                .hasMessageContaining("Atlas user has not been bootstrapped");
    }

    @Test
    void rolesSetIsUnmodifiable() {
        AtlasPrincipal principal = new AtlasPrincipal(
                UUID.randomUUID(), "uid", "test@atlas.test", true, Set.of(PlatformRole.WORKER)
        );

        assertThatThrownBy(() -> principal.roles().add(PlatformRole.PLATFORM_ADMIN))
                .isInstanceOf(UnsupportedOperationException.class);
    }
}
