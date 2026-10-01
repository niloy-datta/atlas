package com.atlas.reservation.application;

import com.atlas.organization.application.OrganizationAccessPolicy;
import com.atlas.organization.domain.OrganizationAction;
import com.atlas.reservation.infrastructure.ReservationRepository;
import com.atlas.reservation.infrastructure.ReservationRepository.LockedShift;
import com.atlas.reservation.infrastructure.ReservationRepository.ReservationRow;
import com.atlas.shared.error.ApiProblemException;
import com.atlas.workledger.application.WorkLedgerService;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReservationService {
    private final ReservationRepository reservations;
    private final OrganizationAccessPolicy access;
    private final Clock clock;
    private final WorkLedgerService workLedger;

    public ReservationService(ReservationRepository reservations,
                              OrganizationAccessPolicy access,
                              Clock clock,
                              WorkLedgerService workLedger) {
        this.reservations = reservations;
        this.access = access;
        this.clock = clock;
        this.workLedger = workLedger;
    }

    @Transactional
    public ReservationRow reserve(UUID organizationId, UUID shiftId,
                                  UUID actorId, UUID workerUserId) {
        access.require(organizationId, actorId, OrganizationAction.MANAGE_WORKFORCE);
        LockedShift shift = reservations.lockShift(organizationId, shiftId)
                .orElseThrow(ReservationService::shiftNotFound);

        if (!"PUBLISHED".equals(shift.status()) && !"IN_PROGRESS".equals(shift.status())) {
            throw conflict("RESERVATION_SHIFT_UNAVAILABLE", "Shift unavailable",
                    "Reservations can only be created for published or in-progress shifts.");
        }
        if (!reservations.workerExists(workerUserId)) throw workerNotFound();
        if (reservations.activeExists(shiftId, workerUserId)) throw duplicateReservation();

        if (reservations.activeCount(shiftId) >= shift.capacity()) throw capacityReached();

        Instant now = Instant.now(clock);
        ReservationRow row = new ReservationRow(
                UUID.randomUUID(), shiftId, organizationId, workerUserId,
                "CONFIRMED", 0, actorId, now, now);
        try {
            reservations.insert(row);
        } catch (DataIntegrityViolationException exception) {
            throw duplicateReservation();
        }
        workLedger.record(workerUserId, organizationId, shiftId, row.id(), "RESERVATION_CONFIRMED");
        return row;
    }

    @Transactional(readOnly = true)
    public List<ReservationRow> list(UUID organizationId, UUID shiftId, UUID actorId) {
        access.require(organizationId, actorId, OrganizationAction.VIEW_CANDIDATES);
        return reservations.list(organizationId, shiftId);
    }

    @Transactional
    public ReservationRow cancel(UUID organizationId, UUID shiftId, UUID reservationId,
                                 UUID actorId, long version) {
        access.require(organizationId, actorId, OrganizationAction.MANAGE_WORKFORCE);
        ReservationRow existing = reservations.find(organizationId, shiftId, reservationId)
                .orElseThrow(ReservationService::reservationNotFound);
        if (!"CONFIRMED".equals(existing.status())) throw reservationNotFound();

        if (reservations.cancel(organizationId, shiftId, reservationId,
                version, Instant.now(clock)) == 0) {
            throw conflict("RESERVATION_VERSION_CONFLICT", "Reservation changed",
                    "Reload the reservation and retry with its current version.");
        }
        ReservationRow cancelled = reservations.find(organizationId, shiftId, reservationId)
                .orElseThrow(ReservationService::reservationNotFound);
        workLedger.record(cancelled.workerUserId(), organizationId, shiftId,
                reservationId, "RESERVATION_CANCELLED");
        return cancelled;
    }

    private static ApiProblemException shiftNotFound() {
        return new ApiProblemException(HttpStatus.NOT_FOUND, "RESERVATION_SHIFT_NOT_FOUND",
                "Shift not found", "The requested shift is unavailable in this organization.");
    }

    private static ApiProblemException workerNotFound() {
        return new ApiProblemException(HttpStatus.NOT_FOUND, "RESERVATION_WORKER_NOT_FOUND",
                "Worker not found", "The requested worker does not have a workforce profile.");
    }

    private static ApiProblemException reservationNotFound() {
        return new ApiProblemException(HttpStatus.NOT_FOUND, "RESERVATION_NOT_FOUND",
                "Reservation not found", "The requested reservation does not exist or is unavailable.");
    }

    private static ApiProblemException capacityReached() {
        return conflict("RESERVATION_CAPACITY_REACHED", "Shift capacity reached",
                "No reservation capacity remains for this shift.");
    }

    private static ApiProblemException duplicateReservation() {
        return conflict("RESERVATION_DUPLICATE", "Worker already reserved",
                "The worker already has an active reservation for this shift.");
    }

    private static ApiProblemException conflict(String code, String title, String detail) {
        return new ApiProblemException(HttpStatus.CONFLICT, code, title, detail);
    }
}
