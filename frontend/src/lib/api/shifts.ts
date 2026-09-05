import { atlasApi } from "./client";
import { SkillProficiency } from "./skills";

export type ShiftStatus = "DRAFT" | "PUBLISHED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface ShiftSkillRequirement {
  id: string;
  shiftId: string;
  skillId: string;
  skillName: string;
  categoryName: string;
  minimumProficiency: SkillProficiency;
  required: boolean;
  createdAt: string;
}

export interface ShiftCredentialRequirement {
  id: string;
  shiftId: string;
  credentialType: "CERTIFICATE" | "LICENSE" | "PERMIT" | "OTHER";
  title: string;
  issuer?: string | null;
  required: boolean;
  createdAt: string;
}

export interface ShiftDetailView {
  id: string;
  jobId?: string | null;
  jobTitle?: string | null;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  organizationVerificationStatus: string;
  title: string;
  description?: string | null;
  startTime: string;
  endTime: string;
  timezone: string;
  capacity: number;
  hourlyRatePence: number;
  currency: string;
  status: ShiftStatus;
  locationName?: string | null;
  formattedAddress?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  requiredSkills: ShiftSkillRequirement[];
  requiredCredentials: ShiftCredentialRequirement[];
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShiftSummaryView {
  id: string;
  jobId?: string | null;
  jobTitle?: string | null;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  organizationVerificationStatus: string;
  title: string;
  startTime: string;
  endTime: string;
  timezone: string;
  capacity: number;
  hourlyRatePence: number;
  currency: string;
  status: ShiftStatus;
  locationName?: string | null;
  formattedAddress?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  requiredSkillsCount: number;
  requiredCredentialsCount: number;
  distanceMeters?: number | null;
  createdAt: string;
}

export interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

export interface SearchShiftsParams {
  query?: string;
  lat?: number;
  lon?: number;
  radiusKm?: number;
  from?: string;
  to?: string;
  minHourlyRatePence?: number;
  page?: number;
  size?: number;
}

export interface CreateShiftDraftPayload {
  jobId?: string | null;
  title: string;
  description?: string | null;
  startTime: string;
  endTime: string;
  timezone?: string;
  capacity: number;
  hourlyRatePence: number;
  currency?: string;
  locationName?: string | null;
  formattedAddress?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  inheritJobRequirements?: boolean;
}

export interface UpdateShiftDraftPayload {
  version: number;
  jobId?: string | null;
  title: string;
  description?: string | null;
  startTime: string;
  endTime: string;
  timezone?: string;
  capacity: number;
  hourlyRatePence: number;
  currency?: string;
  locationName?: string | null;
  formattedAddress?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export async function searchShifts(params: SearchShiftsParams = {}): Promise<PageResult<ShiftSummaryView>> {
  const q = new URLSearchParams();
  if (params.query) q.set("query", params.query);
  if (params.lat !== undefined) q.set("lat", params.lat.toString());
  if (params.lon !== undefined) q.set("lon", params.lon.toString());
  if (params.radiusKm !== undefined) q.set("radiusKm", params.radiusKm.toString());
  if (params.from) q.set("from", params.from);
  if (params.to) q.set("to", params.to);
  if (params.minHourlyRatePence !== undefined) q.set("minHourlyRatePence", params.minHourlyRatePence.toString());
  if (params.page !== undefined) q.set("page", params.page.toString());
  if (params.size !== undefined) q.set("size", params.size.toString());

  const queryStr = q.toString();
  return atlasApi.get<PageResult<ShiftSummaryView>>(`/shifts${queryStr ? `?${queryStr}` : ""}`);
}

export async function getPublicShift(shiftId: string): Promise<ShiftDetailView> {
  return atlasApi.get<ShiftDetailView>(`/shifts/${shiftId}`);
}

export async function listOrganizationShifts(
  orgId: string,
  params: { status?: string; jobId?: string; from?: string; to?: string; page?: number; size?: number } = {}
): Promise<PageResult<ShiftSummaryView>> {
  const q = new URLSearchParams();
  if (params.status) q.set("status", params.status);
  if (params.jobId) q.set("jobId", params.jobId);
  if (params.from) q.set("from", params.from);
  if (params.to) q.set("to", params.to);
  if (params.page !== undefined) q.set("page", params.page.toString());
  if (params.size !== undefined) q.set("size", params.size.toString());

  const queryStr = q.toString();
  return atlasApi.get<PageResult<ShiftSummaryView>>(`/organizations/${orgId}/shifts${queryStr ? `?${queryStr}` : ""}`);
}

export async function getOrganizationShift(orgId: string, shiftId: string): Promise<ShiftDetailView> {
  return atlasApi.get<ShiftDetailView>(`/organizations/${orgId}/shifts/${shiftId}`);
}

export async function createShiftDraft(orgId: string, payload: CreateShiftDraftPayload): Promise<ShiftDetailView> {
  return atlasApi.post<ShiftDetailView>(`/organizations/${orgId}/shifts`, payload);
}

export async function updateShiftDraft(orgId: string, shiftId: string, payload: UpdateShiftDraftPayload): Promise<ShiftDetailView> {
  return atlasApi.put<ShiftDetailView>(`/organizations/${orgId}/shifts/${shiftId}`, payload);
}

export async function publishShift(orgId: string, shiftId: string, version: number): Promise<ShiftDetailView> {
  return atlasApi.post<ShiftDetailView>(`/organizations/${orgId}/shifts/${shiftId}/publish`, { version });
}

export async function startShift(orgId: string, shiftId: string, version: number): Promise<ShiftDetailView> {
  return atlasApi.post<ShiftDetailView>(`/organizations/${orgId}/shifts/${shiftId}/start`, { version });
}

export async function completeShift(orgId: string, shiftId: string, version: number): Promise<ShiftDetailView> {
  return atlasApi.post<ShiftDetailView>(`/organizations/${orgId}/shifts/${shiftId}/complete`, { version });
}

export async function cancelShift(orgId: string, shiftId: string, version: number): Promise<ShiftDetailView> {
  return atlasApi.post<ShiftDetailView>(`/organizations/${orgId}/shifts/${shiftId}/cancel`, { version });
}

export async function addShiftSkillRequirement(
  orgId: string,
  shiftId: string,
  payload: { skillId: string; minimumProficiency: SkillProficiency; required?: boolean }
): Promise<ShiftDetailView> {
  return atlasApi.post<ShiftDetailView>(`/organizations/${orgId}/shifts/${shiftId}/skills`, payload);
}

export async function removeShiftSkillRequirement(orgId: string, shiftId: string, skillId: string): Promise<ShiftDetailView> {
  return atlasApi.delete<ShiftDetailView>(`/organizations/${orgId}/shifts/${shiftId}/skills/${skillId}`);
}

export async function addShiftCredentialRequirement(
  orgId: string,
  shiftId: string,
  payload: { credentialType: "CERTIFICATE" | "LICENSE" | "PERMIT" | "OTHER"; title: string; issuer?: string; required?: boolean }
): Promise<ShiftDetailView> {
  return atlasApi.post<ShiftDetailView>(`/organizations/${orgId}/shifts/${shiftId}/credentials`, payload);
}

export async function removeShiftCredentialRequirement(
  orgId: string,
  shiftId: string,
  reqId: string
): Promise<ShiftDetailView> {
  return atlasApi.delete<ShiftDetailView>(`/organizations/${orgId}/shifts/${shiftId}/credentials/${reqId}`);
}
