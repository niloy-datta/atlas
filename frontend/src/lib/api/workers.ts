import { atlasApi } from "./client";

export type ProfileVisibility = "PUBLIC" | "EMPLOYERS_ONLY" | "UNLISTED";
export type JobTypePreference = "SHIFT" | "SERVICE" | "BOTH";

export interface WorkerLocation {
  latitude: number;
  longitude: number;
  city?: string;
  region?: string;
  countryCode: string;
}

export interface WorkerPreferences {
  openToWork: boolean;
  maxDistanceKm: number;
  jobTypes: JobTypePreference[];
}

export interface WorkerPrivacy {
  showCoarseLocation: boolean;
  showExperience: boolean;
}

export interface PrivateProfile {
  id: string;
  version: number;
  handle: string;
  fullName?: string;
  headline?: string;
  bio?: string;
  experienceYears?: number;
  visibility: ProfileVisibility;
  location?: WorkerLocation;
  preferences?: WorkerPreferences;
  privacy?: WorkerPrivacy;
  completionPercentage: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileUpsertRequest {
  version: number;
  handle: string;
  fullName?: string;
  headline?: string;
  bio?: string;
  experienceYears?: number;
  visibility: ProfileVisibility;
  location?: WorkerLocation;
  preferences?: WorkerPreferences;
  privacy?: WorkerPrivacy;
}

export interface SkillProofItem {
  id: string;
  skillId: string;
  skillName: string;
  category: string;
  status: string;
  yearsExperience?: number;
  evidenceCount: number;
}

export interface CredentialSummary {
  id: string;
  title: string;
  issuer: string;
  credentialType: string;
  status: string;
  expiresAt?: string;
}

export interface PrivateWorkPass {
  workerId: string;
  handle: string;
  fullName?: string;
  headline?: string;
  bio?: string;
  experienceYears?: number;
  location?: {
    city?: string;
    region?: string;
    countryCode: string;
  };
  completionPercentage: number;
  skills: SkillProofItem[];
  credentials: CredentialSummary[];
}

export interface PublicWorkPass {
  handle: string;
  displayName?: string;
  headline?: string;
  bio?: string;
  coarseLocation?: string;
  experienceYears?: number;
  completionPercentage: number;
  skills: Array<{
    name: string;
    category: string;
    status: string;
  }>;
  credentials: Array<{
    title: string;
    issuer: string;
    credentialType: string;
    status: string;
  }>;
}

export async function getWorkerProfile(): Promise<PrivateProfile> {
  return atlasApi.get<PrivateProfile>("/api/v1/workers/me/profile");
}

export async function updateWorkerProfile(data: ProfileUpsertRequest): Promise<PrivateProfile> {
  return atlasApi.put<PrivateProfile>("/api/v1/workers/me/profile", data);
}

export async function getPrivateWorkPass(): Promise<PrivateWorkPass> {
  return atlasApi.get<PrivateWorkPass>("/api/v1/workers/me/work-pass");
}

export async function getPublicWorkPass(handle: string): Promise<PublicWorkPass> {
  return atlasApi.get<PublicWorkPass>(`/api/v1/work-pass/${encodeURIComponent(handle)}`, false);
}
