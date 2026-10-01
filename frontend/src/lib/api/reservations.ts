import { atlasApi } from "./client";

export interface ShiftReservation {
  id: string;
  shiftId: string;
  organizationId: string;
  workerUserId: string;
  status: "CONFIRMED" | "CANCELLED";
  version: number;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export async function reserveWorker(
  organizationId: string,
  shiftId: string,
  workerId: string,
  idempotencyKey: string,
): Promise<ShiftReservation> {
  return atlasApi.postWithHeaders<ShiftReservation>(
    `/api/v1/organizations/${organizationId}/shifts/${shiftId}/reservations`,
    { workerId },
    { "Idempotency-Key": idempotencyKey },
  );
}

export async function listReservations(
  organizationId: string,
  shiftId: string,
): Promise<ShiftReservation[]> {
  return atlasApi.get<ShiftReservation[]>(
    `/api/v1/organizations/${organizationId}/shifts/${shiftId}/reservations`,
  );
}

export async function cancelReservation(
  organizationId: string,
  shiftId: string,
  reservationId: string,
  version: number,
): Promise<ShiftReservation> {
  return atlasApi.post<ShiftReservation>(
    `/api/v1/organizations/${organizationId}/shifts/${shiftId}/reservations/${reservationId}/cancel`,
    { version },
  );
}
