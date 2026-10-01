package com.atlas.reservation.web;

import com.atlas.identity.domain.AtlasPrincipal;
import com.atlas.reservation.application.ReservationService;
import com.atlas.reservation.infrastructure.ReservationRepository.ReservationRow;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/organizations/{organizationId}/shifts/{shiftId}/reservations")
public class ReservationController {
    private final ReservationService reservations;

    public ReservationController(ReservationService reservations) {
        this.reservations = reservations;
    }

    @PostMapping
    ResponseEntity<ReservationRow> reserve(@PathVariable UUID organizationId,
                                           @PathVariable UUID shiftId,
                                           @AuthenticationPrincipal AtlasPrincipal principal,
                                           @Valid @RequestBody ReservationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reservations.reserve(organizationId, shiftId,
                        principal.requireUserId(), request.workerId()));
    }

    @GetMapping
    List<ReservationRow> list(@PathVariable UUID organizationId,
                              @PathVariable UUID shiftId,
                              @AuthenticationPrincipal AtlasPrincipal principal) {
        return reservations.list(organizationId, shiftId, principal.requireUserId());
    }

    @PostMapping("/{reservationId}/cancel")
    ReservationRow cancel(@PathVariable UUID organizationId,
                          @PathVariable UUID shiftId,
                          @PathVariable UUID reservationId,
                          @AuthenticationPrincipal AtlasPrincipal principal,
                          @Valid @RequestBody CancelRequest request) {
        return reservations.cancel(organizationId, shiftId, reservationId,
                principal.requireUserId(), request.version());
    }

    public record ReservationRequest(@NotNull UUID workerId) { }
    public record CancelRequest(@Min(0) long version) { }
}
