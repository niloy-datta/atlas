import { atlasApi } from "./client";

export type ApplicationStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "SHORTLISTED"
  | "ACCEPTED"
  | "REJECTED"
  | "WITHDRAWN";

export type ApplicationTargetType = "JOB" | "SHIFT";

export interface ApplicationSummary {
  id: string;
  organizationId: string;
  targetType: ApplicationTargetType;
  targetId: string;
  targetTitle: string;
  workerId: string;
  workerName: string;
  status: ApplicationStatus;
  proposedRatePence?: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationDetail extends ApplicationSummary {
  coverNote?: string;
}

export interface ApplyRequest {
  coverNote?: string;
  proposedRatePence?: number;
}

export async function applyToJob(jobId: string, data: ApplyRequest): Promise<ApplicationDetail> {
  return atlasApi.post<ApplicationDetail>(`/api/v1/jobs/${jobId}/applications`, data);
}

export async function applyToShift(shiftId: string, data: ApplyRequest): Promise<ApplicationDetail> {
  return atlasApi.post<ApplicationDetail>(`/api/v1/shifts/${shiftId}/applications`, data);
}

export async function getMyApplications(limit = 20, offset = 0): Promise<ApplicationSummary[]> {
  return atlasApi.get<ApplicationSummary[]>(`/api/v1/workers/me/applications?limit=${limit}&offset=${offset}`);
}

export async function getApplicationDetail(id: string): Promise<ApplicationDetail> {
  return atlasApi.get<ApplicationDetail>(`/api/v1/applications/${id}`);
}

export async function withdrawApplication(id: string, version: number): Promise<ApplicationDetail> {
  return atlasApi.post<ApplicationDetail>(`/api/v1/applications/${id}/withdraw`, { version });
}

export async function getOrganizationApplications(
  organizationId: string,
  status?: ApplicationStatus,
  limit = 20,
  offset = 0
): Promise<ApplicationSummary[]> {
  const query = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (status) query.set("status", status);
  return atlasApi.get<ApplicationSummary[]>(`/api/v1/organizations/${organizationId}/applications?${query.toString()}`);
}

export async function reviewApplication(organizationId: string, id: string, version: number): Promise<ApplicationDetail> {
  return atlasApi.post<ApplicationDetail>(`/api/v1/organizations/${organizationId}/applications/${id}/review`, { version });
}

export async function shortlistApplication(organizationId: string, id: string, version: number): Promise<ApplicationDetail> {
  return atlasApi.post<ApplicationDetail>(`/api/v1/organizations/${organizationId}/applications/${id}/shortlist`, { version });
}

export async function acceptApplication(organizationId: string, id: string, version: number): Promise<ApplicationDetail> {
  return atlasApi.post<ApplicationDetail>(`/api/v1/organizations/${organizationId}/applications/${id}/accept`, { version });
}

export async function rejectApplication(organizationId: string, id: string, version: number): Promise<ApplicationDetail> {
  return atlasApi.post<ApplicationDetail>(`/api/v1/organizations/${organizationId}/applications/${id}/reject`, { version });
}
