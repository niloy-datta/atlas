import { atlasApi } from "./client";

export type OrganizationRole = "EMPLOYER_ADMIN" | "EMPLOYER_MEMBER";
export type VerificationStatus = "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";

export interface OrganizationView {
  id: string;
  name: string;
  slug: string;
  description?: string;
  verificationStatus: VerificationStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationSummary {
  id: string;
  name: string;
  slug: string;
  role: OrganizationRole;
  verificationStatus: VerificationStatus;
}

export interface MemberRow {
  id: string;
  userId: string;
  email: string;
  role: OrganizationRole;
  joinedAt: string;
}

export interface InvitationRow {
  id: string;
  email: string;
  role: OrganizationRole;
  status: string;
  expiresAt: string;
}

export interface LocationRow {
  id: string;
  name: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  geohash?: string;
  createdAt: string;
}

export interface CreateOrganizationRequest {
  name: string;
  slug: string;
  description?: string;
}

export interface UpdateOrganizationRequest {
  version: number;
  name: string;
  slug: string;
  description?: string;
}

export interface CreateLocationRequest {
  name: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
}

export async function createOrganization(data: CreateOrganizationRequest): Promise<OrganizationView> {
  return atlasApi.post<OrganizationView>("/api/v1/organizations", data);
}

export async function listOrganizations(): Promise<OrganizationSummary[]> {
  return atlasApi.get<OrganizationSummary[]>("/api/v1/organizations");
}

export async function getOrganization(id: string): Promise<OrganizationView> {
  return atlasApi.get<OrganizationView>(`/api/v1/organizations/${id}`);
}

export async function updateOrganization(id: string, data: UpdateOrganizationRequest): Promise<OrganizationView> {
  return atlasApi.put<OrganizationView>(`/api/v1/organizations/${id}`, data);
}

export async function listOrganizationMembers(id: string): Promise<MemberRow[]> {
  return atlasApi.get<MemberRow[]>(`/api/v1/organizations/${id}/members`);
}

export async function inviteOrganizationMember(id: string, email: string, role: OrganizationRole): Promise<InvitationRow> {
  return atlasApi.post<InvitationRow>(`/api/v1/organizations/${id}/invitations`, { email, role });
}

export async function acceptOrganizationInvitation(invitationId: string): Promise<OrganizationView> {
  return atlasApi.post<OrganizationView>(`/api/v1/organizations/invitations/${invitationId}/accept`);
}

export async function listOrganizationLocations(id: string): Promise<LocationRow[]> {
  return atlasApi.get<LocationRow[]>(`/api/v1/organizations/${id}/locations`);
}

export async function addOrganizationLocation(id: string, data: CreateLocationRequest): Promise<LocationRow> {
  return atlasApi.post<LocationRow>(`/api/v1/organizations/${id}/locations`, data);
}

export async function requestOrganizationVerification(id: string): Promise<OrganizationView> {
  return atlasApi.post<OrganizationView>(`/api/v1/organizations/${id}/verification-request`);
}

