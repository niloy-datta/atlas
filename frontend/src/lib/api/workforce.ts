import { atlasApi } from "./client";

export interface WorkforcePool {
  id: string;
  organizationId: string;
  name: string;
  description?: string | null;
  version: number;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkforcePoolMember {
  workerUserId: string;
  workerProfileId: string;
  fullName?: string | null;
  publicHandle?: string | null;
  headline?: string | null;
  visibility: string;
  note?: string | null;
  addedByUserId: string;
  addedAt: string;
}

export async function listWorkforcePools(organizationId: string): Promise<WorkforcePool[]> {
  return atlasApi.get<WorkforcePool[]>(`/api/v1/organizations/${organizationId}/workforce-pools`);
}

export async function createWorkforcePool(
  organizationId: string,
  data: { name: string; description?: string },
): Promise<WorkforcePool> {
  return atlasApi.post<WorkforcePool>(`/api/v1/organizations/${organizationId}/workforce-pools`, data);
}

export async function updateWorkforcePool(
  organizationId: string,
  poolId: string,
  data: { version: number; name: string; description?: string },
): Promise<WorkforcePool> {
  return atlasApi.put<WorkforcePool>(
    `/api/v1/organizations/${organizationId}/workforce-pools/${poolId}`,
    data,
  );
}

export async function deleteWorkforcePool(organizationId: string, poolId: string): Promise<void> {
  await atlasApi.delete<void>(`/api/v1/organizations/${organizationId}/workforce-pools/${poolId}`);
}

export async function listWorkforcePoolMembers(
  organizationId: string,
  poolId: string,
): Promise<WorkforcePoolMember[]> {
  return atlasApi.get<WorkforcePoolMember[]>(
    `/api/v1/organizations/${organizationId}/workforce-pools/${poolId}/members`,
  );
}

export async function addWorkforcePoolMember(
  organizationId: string,
  poolId: string,
  workerId: string,
  note?: string,
): Promise<WorkforcePoolMember> {
  return atlasApi.post<WorkforcePoolMember>(
    `/api/v1/organizations/${organizationId}/workforce-pools/${poolId}/members`,
    { workerId, note },
  );
}

export async function removeWorkforcePoolMember(
  organizationId: string,
  poolId: string,
  workerId: string,
): Promise<void> {
  await atlasApi.delete<void>(
    `/api/v1/organizations/${organizationId}/workforce-pools/${poolId}/members/${workerId}`,
  );
}
