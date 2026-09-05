import { atlasApi } from "./client";

export type InvitationStatus =
  | "PENDING"
  | "ACCEPTED"
  | "DECLINED"
  | "EXPIRED"
  | "CANCELLED";

export type InvitationTargetType = "JOB" | "SHIFT";

export interface InvitationSummary {
  id: string;
  organizationId: string;
  targetType: InvitationTargetType;
  targetId: string;
  targetTitle: string;
  workerId: string;
  workerName: string;
  status: InvitationStatus;
  offeredRatePence?: number;
  expiresAt: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface InvitationDetail extends InvitationSummary {
  senderId: string;
  message?: string;
}

export interface CreateInvitationRequest {
  workerId: string;
  offeredRatePence?: number;
  message?: string;
  expiresAt?: string;
}

export async function getMyInvitations(limit = 20, offset = 0): Promise<InvitationSummary[]> {
  return atlasApi.get<InvitationSummary[]>(`/api/v1/workers/me/invitations?limit=${limit}&offset=${offset}`);
}

export async function getInvitationDetail(id: string): Promise<InvitationDetail> {
  return atlasApi.get<InvitationDetail>(`/api/v1/invitations/${id}`);
}

export async function acceptInvitation(id: string, version: number): Promise<InvitationDetail> {
  return atlasApi.post<InvitationDetail>(`/api/v1/invitations/${id}/accept`, { version });
}

export async function declineInvitation(id: string, version: number): Promise<InvitationDetail> {
  return atlasApi.post<InvitationDetail>(`/api/v1/invitations/${id}/decline`, { version });
}

export async function getOrganizationInvitations(
  organizationId: string,
  status?: InvitationStatus,
  limit = 20,
  offset = 0
): Promise<InvitationSummary[]> {
  const query = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (status) query.set("status", status);
  return atlasApi.get<InvitationSummary[]>(`/api/v1/organizations/${organizationId}/invitations?${query.toString()}`);
}

export async function createJobInvitation(
  organizationId: string,
  jobId: string,
  data: CreateInvitationRequest
): Promise<InvitationDetail> {
  return atlasApi.post<InvitationDetail>(`/api/v1/organizations/${organizationId}/jobs/${jobId}/invitations`, data);
}

export async function createShiftInvitation(
  organizationId: string,
  shiftId: string,
  data: CreateInvitationRequest
): Promise<InvitationDetail> {
  return atlasApi.post<InvitationDetail>(`/api/v1/organizations/${organizationId}/shifts/${shiftId}/invitations`, data);
}

export async function cancelInvitation(
  organizationId: string,
  id: string,
  version: number
): Promise<InvitationDetail> {
  return atlasApi.post<InvitationDetail>(`/api/v1/organizations/${organizationId}/invitations/${id}/cancel`, { version });
}
