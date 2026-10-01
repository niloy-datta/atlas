import { atlasApi } from "./client";

export interface MatchScore {
  total: number;
  skillFit: number;
  verifiedSkillFit: number;
  distanceFit: number;
  availabilityFit: number;
  profileFit: number;
  reasons: string[];
}

export interface MatchCandidate {
  workerUserId: string;
  fullName?: string | null;
  publicHandle?: string | null;
  headline?: string | null;
  distanceMeters?: number | null;
  requiredSkills: number;
  matchedRequiredSkills: number;
  verifiedMatchedSkills: number;
  score: MatchScore;
}

export interface MatchResponse {
  targetType: "JOB" | "SHIFT";
  targetId: string;
  targetTitle: string;
  algorithmVersion: string;
  candidates: MatchCandidate[];
}

export async function getJobMatches(
  organizationId: string,
  jobId: string,
  limit = 25,
): Promise<MatchResponse> {
  return atlasApi.get<MatchResponse>(
    `/api/v1/organizations/${organizationId}/jobs/${jobId}/matches?limit=${limit}`,
  );
}

export async function getShiftMatches(
  organizationId: string,
  shiftId: string,
  limit = 25,
): Promise<MatchResponse> {
  return atlasApi.get<MatchResponse>(
    `/api/v1/organizations/${organizationId}/shifts/${shiftId}/matches?limit=${limit}`,
  );
}
