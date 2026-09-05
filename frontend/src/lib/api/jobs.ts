import { atlasApi } from "./client";
import { SkillProficiency } from "./skills";

export type JobType = "SHIFT" | "SERVICE" | "CONTRACT";
export type JobStatus = "DRAFT" | "PUBLISHED" | "PAUSED" | "CLOSED" | "CANCELLED" | "COMPLETED";

export interface JobSkillRequirement {
  id: string;
  jobId: string;
  skillId: string;
  skillName: string;
  categoryName: string;
  minimumProficiency: SkillProficiency;
  required: boolean;
  createdAt: string;
}

export interface JobCredentialRequirement {
  id: string;
  jobId: string;
  credentialType: string;
  title: string;
  issuer?: string;
  required: boolean;
  createdAt: string;
}

export interface JobSummary {
  id: string;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  organizationVerificationStatus: "UNVERIFIED" | "PENDING" | "VERIFIED" | "SUSPENDED";
  title: string;
  jobType: JobType;
  status: JobStatus;
  locationName?: string;
  formattedAddress?: string;
  latitude?: number;
  longitude?: number;
  budgetMinPence?: number;
  budgetMaxPence?: number;
  currency: string;
  requiredSkillsCount: number;
  requiredCredentialsCount: number;
  distanceMeters?: number;
  createdAt: string;
}

export interface JobDetail {
  id: string;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  organizationVerificationStatus: "UNVERIFIED" | "PENDING" | "VERIFIED" | "SUSPENDED";
  title: string;
  description: string;
  jobType: JobType;
  status: JobStatus;
  locationName?: string;
  formattedAddress?: string;
  latitude?: number;
  longitude?: number;
  budgetMinPence?: number;
  budgetMaxPence?: number;
  currency: string;
  requiredSkills: JobSkillRequirement[];
  requiredCredentials: JobCredentialRequirement[];
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

export interface CreateJobDraftRequest {
  title: string;
  description: string;
  jobType: JobType;
  locationName?: string;
  formattedAddress?: string;
  latitude?: number;
  longitude?: number;
  budgetMinPence?: number;
  budgetMaxPence?: number;
  currency?: string;
}

export interface UpdateJobDraftRequest {
  version: number;
  title: string;
  description: string;
  jobType: JobType;
  locationName?: string;
  formattedAddress?: string;
  latitude?: number;
  longitude?: number;
  budgetMinPence?: number;
  budgetMaxPence?: number;
  currency?: string;
}

export interface AddJobSkillRequest {
  skillId: string;
  minimumProficiency: SkillProficiency;
  required?: boolean;
}

export interface AddJobCredentialRequest {
  credentialType: string;
  title: string;
  issuer?: string;
  required?: boolean;
}

// Public & Worker Discovery
export async function searchJobs(params: {
  query?: string;
  lat?: number;
  lon?: number;
  radiusKm?: number;
  jobType?: string;
  page?: number;
  size?: number;
}): Promise<PageResult<JobSummary>> {
  const q = new URLSearchParams();
  if (params.query) q.set("query", params.query);
  if (params.lat !== undefined && params.lon !== undefined) {
    q.set("lat", params.lat.toString());
    q.set("lon", params.lon.toString());
    if (params.radiusKm) q.set("radiusKm", params.radiusKm.toString());
  }
  if (params.jobType) q.set("jobType", params.jobType);
  if (params.page !== undefined) q.set("page", params.page.toString());
  if (params.size !== undefined) q.set("size", params.size.toString());

  const queryStr = q.toString();
  return atlasApi.get<PageResult<JobSummary>>(`/jobs${queryStr ? `?${queryStr}` : ""}`);
}

export async function getPublicJob(jobId: string): Promise<JobDetail> {
  return atlasApi.get<JobDetail>(`/jobs/${jobId}`);
}

// Employer Organization Management
export async function listOrganizationJobs(
  organizationId: string,
  params?: { status?: string; page?: number; size?: number }
): Promise<PageResult<JobSummary>> {
  const q = new URLSearchParams();
  if (params?.status) q.set("status", params.status);
  if (params?.page !== undefined) q.set("page", params.page.toString());
  if (params?.size !== undefined) q.set("size", params.size.toString());

  const queryStr = q.toString();
  return atlasApi.get<PageResult<JobSummary>>(`/organizations/${organizationId}/jobs${queryStr ? `?${queryStr}` : ""}`);
}

export async function getOrganizationJob(organizationId: string, jobId: string): Promise<JobDetail> {
  return atlasApi.get<JobDetail>(`/organizations/${organizationId}/jobs/${jobId}`);
}

export async function createJobDraft(organizationId: string, req: CreateJobDraftRequest): Promise<JobDetail> {
  return atlasApi.post<JobDetail>(`/organizations/${organizationId}/jobs`, req);
}

export async function updateJobDraft(organizationId: string, jobId: string, req: UpdateJobDraftRequest): Promise<JobDetail> {
  return atlasApi.put<JobDetail>(`/organizations/${organizationId}/jobs/${jobId}`, req);
}

export async function publishJob(organizationId: string, jobId: string, version: number): Promise<JobDetail> {
  return atlasApi.post<JobDetail>(`/organizations/${organizationId}/jobs/${jobId}/publish`, { version });
}

export async function pauseJob(organizationId: string, jobId: string, version: number): Promise<JobDetail> {
  return atlasApi.post<JobDetail>(`/organizations/${organizationId}/jobs/${jobId}/pause`, { version });
}

export async function resumeJob(organizationId: string, jobId: string, version: number): Promise<JobDetail> {
  return atlasApi.post<JobDetail>(`/organizations/${organizationId}/jobs/${jobId}/resume`, { version });
}

export async function closeJob(organizationId: string, jobId: string, version: number): Promise<JobDetail> {
  return atlasApi.post<JobDetail>(`/organizations/${organizationId}/jobs/${jobId}/close`, { version });
}

export async function cancelJob(organizationId: string, jobId: string, version: number): Promise<JobDetail> {
  return atlasApi.post<JobDetail>(`/organizations/${organizationId}/jobs/${jobId}/cancel`, { version });
}

export async function addJobSkillRequirement(
  organizationId: string,
  jobId: string,
  req: AddJobSkillRequest
): Promise<JobDetail> {
  return atlasApi.post<JobDetail>(`/organizations/${organizationId}/jobs/${jobId}/skills`, req);
}

export async function removeJobSkillRequirement(
  organizationId: string,
  jobId: string,
  skillId: string
): Promise<JobDetail> {
  return atlasApi.delete<JobDetail>(`/organizations/${organizationId}/jobs/${jobId}/skills/${skillId}`);
}

export async function addJobCredentialRequirement(
  organizationId: string,
  jobId: string,
  req: AddJobCredentialRequest
): Promise<JobDetail> {
  return atlasApi.post<JobDetail>(`/organizations/${organizationId}/jobs/${jobId}/credentials`, req);
}

export async function removeJobCredentialRequirement(
  organizationId: string,
  jobId: string,
  credentialRequirementId: string
): Promise<JobDetail> {
  return atlasApi.delete<JobDetail>(`/organizations/${organizationId}/jobs/${jobId}/credentials/${credentialRequirementId}`);
}

