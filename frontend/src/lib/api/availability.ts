import { atlasApi } from "./client";

export interface AvailabilityRule {
  id: string;
  workerUserId: string;
  dayOfWeek: number;
  startLocal: string;
  endLocal: string;
  timezone: string;
  validFrom?: string | null;
  validUntil?: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface AvailabilityOverride {
  id: string;
  workerUserId: string;
  date: string;
  type: "AVAILABLE" | "UNAVAILABLE";
  startLocal?: string | null;
  endLocal?: string | null;
  timezone: string;
  note?: string | null;
  createdAt: string;
}

export interface ResolvedAvailability {
  date: string;
  source: "RECURRING" | "OVERRIDE";
  windows: Array<{
    startsAt: string;
    endsAt: string;
    timezone: string;
    durationMinutes: number;
  }>;
}

export async function listAvailabilityRules(): Promise<AvailabilityRule[]> {
  return atlasApi.get<AvailabilityRule[]>("/api/v1/workers/me/availability/rules");
}

export async function createAvailabilityRule(data: {
  dayOfWeek: number;
  startLocal: string;
  endLocal: string;
  timezone: string;
  validFrom?: string;
  validUntil?: string;
}): Promise<AvailabilityRule> {
  return atlasApi.post<AvailabilityRule>("/api/v1/workers/me/availability/rules", data);
}

export async function updateAvailabilityRule(
  ruleId: string,
  data: {
    version: number;
    dayOfWeek: number;
    startLocal: string;
    endLocal: string;
    timezone: string;
    validFrom?: string;
    validUntil?: string;
  },
): Promise<AvailabilityRule> {
  return atlasApi.put<AvailabilityRule>(`/api/v1/workers/me/availability/rules/${ruleId}`, data);
}

export async function deleteAvailabilityRule(ruleId: string): Promise<void> {
  await atlasApi.delete<void>(`/api/v1/workers/me/availability/rules/${ruleId}`);
}

export async function listAvailabilityOverrides(
  from: string,
  until: string,
): Promise<AvailabilityOverride[]> {
  const q = new URLSearchParams({ from, until });
  return atlasApi.get<AvailabilityOverride[]>(`/api/v1/workers/me/availability/overrides?${q}`);
}

export async function createAvailabilityOverride(data: {
  date: string;
  type: "AVAILABLE" | "UNAVAILABLE";
  startLocal?: string;
  endLocal?: string;
  timezone: string;
  note?: string;
}): Promise<AvailabilityOverride> {
  return atlasApi.post<AvailabilityOverride>("/api/v1/workers/me/availability/overrides", data);
}

export async function deleteAvailabilityOverride(overrideId: string): Promise<void> {
  await atlasApi.delete<void>(`/api/v1/workers/me/availability/overrides/${overrideId}`);
}

export async function resolveAvailability(date: string): Promise<ResolvedAvailability> {
  return atlasApi.get<ResolvedAvailability>(
    `/api/v1/workers/me/availability/resolved?date=${encodeURIComponent(date)}`,
  );
}
