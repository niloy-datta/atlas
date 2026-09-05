import { atlasApi } from "./client";

export type SkillProficiency = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
export type SkillStatus = "DECLARED" | "EVIDENCE_SUBMITTED" | "VERIFIED" | "REJECTED";

export interface SkillCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface SkillItem {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  slug: string;
  description?: string;
}

export interface WorkerSkillView {
  id: string;
  skillId: string;
  skillName: string;
  categoryName: string;
  proficiency: SkillProficiency;
  status: SkillStatus;
  version: number;
  evidenceCount: number;
  endorsementCount: number;
  createdAt: string;
}

export interface DeclareSkillRequest {
  skillId: string;
  proficiency: SkillProficiency;
}

export interface UpdateProficiencyRequest {
  version: number;
  proficiency: SkillProficiency;
}

export async function listCategories(): Promise<SkillCategory[]> {
  return atlasApi.get<SkillCategory[]>("/api/v1/skills/categories", false);
}

export async function searchSkills(query?: string, categoryId?: string, limit = 50): Promise<SkillItem[]> {
  const params = new URLSearchParams();
  if (query) params.set("query", query);
  if (categoryId) params.set("categoryId", categoryId);
  params.set("limit", limit.toString());
  return atlasApi.get<SkillItem[]>(`/api/v1/skills?${params.toString()}`, false);
}

export async function listWorkerSkills(): Promise<WorkerSkillView[]> {
  return atlasApi.get<WorkerSkillView[]>("/api/v1/workers/me/skills");
}

export async function declareWorkerSkill(data: DeclareSkillRequest): Promise<WorkerSkillView> {
  return atlasApi.post<WorkerSkillView>("/api/v1/workers/me/skills", data);
}

export async function updateWorkerSkillProficiency(id: string, data: UpdateProficiencyRequest): Promise<WorkerSkillView> {
  return atlasApi.patch<WorkerSkillView>(`/api/v1/workers/me/skills/${id}`, data);
}

export async function removeWorkerSkill(id: string): Promise<void> {
  return atlasApi.delete<void>(`/api/v1/workers/me/skills/${id}`);
}

