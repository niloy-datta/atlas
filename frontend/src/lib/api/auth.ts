import { atlasApi, AtlasUser, BootstrapResponse } from "./client";

export async function bootstrapAtlas(accountType: "worker" | "employer"): Promise<BootstrapResponse> {
  return atlasApi.post<BootstrapResponse>("/api/v1/auth/bootstrap", { accountType });
}

export async function getMe(): Promise<AtlasUser> {
  return atlasApi.get<AtlasUser>("/api/v1/auth/me");
}
