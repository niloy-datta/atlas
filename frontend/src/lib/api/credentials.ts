import { atlasApi } from "./client";

export type CredentialType = "LICENSE" | "CERTIFICATION" | "RIGHT_TO_WORK" | "ID_DOCUMENT" | "BACKGROUND_CHECK";
export type CredentialVisibility = "PUBLIC" | "EMPLOYERS_ONLY" | "PRIVATE";
export type CredentialStatus = "DRAFT" | "SUBMITTED" | "VERIFIED" | "REJECTED" | "EXPIRED";

export interface DocumentView {
  id: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  uploadedAt: string;
  downloadUrl?: string;
}

export interface CredentialView {
  id: string;
  version: number;
  credentialType: CredentialType;
  title: string;
  issuer: string;
  credentialNumber?: string;
  issuedOn?: string;
  expiresOn?: string;
  visibility: CredentialVisibility;
  status: CredentialStatus;
  documents: DocumentView[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCredentialRequest {
  credentialType: CredentialType;
  title: string;
  issuer: string;
  credentialNumber?: string;
  issuedOn?: string;
  expiresOn?: string;
  visibility: CredentialVisibility;
}

export interface UploadAuthorization {
  documentId: string;
  uploadUrl: string;
  expiresAt: string;
}

export async function listCredentials(): Promise<CredentialView[]> {
  return atlasApi.get<CredentialView[]>("/api/v1/workers/me/credentials");
}

export async function createCredential(data: CreateCredentialRequest): Promise<CredentialView> {
  return atlasApi.post<CredentialView>("/api/v1/workers/me/credentials", data);
}

export async function getCredential(id: string): Promise<CredentialView> {
  return atlasApi.get<CredentialView>(`/api/v1/workers/me/credentials/${id}`);
}

export async function deleteCredential(id: string): Promise<void> {
  return atlasApi.delete<void>(`/api/v1/workers/me/credentials/${id}`);
}

export async function initiateDocumentUpload(credentialId: string, filename: string, contentType: string, sizeBytes: number): Promise<UploadAuthorization> {
  return atlasApi.post<UploadAuthorization>(`/api/v1/workers/me/credentials/${credentialId}/uploads`, {
    filename,
    contentType,
    sizeBytes,
  });
}

export async function completeDocumentUpload(credentialId: string, documentId: string): Promise<DocumentView> {
  return atlasApi.post<DocumentView>(`/api/v1/workers/me/credentials/${credentialId}/documents/${documentId}/complete`);
}

export async function submitCredentialForVerification(credentialId: string): Promise<CredentialView> {
  return atlasApi.post<CredentialView>(`/api/v1/workers/me/credentials/${credentialId}/submit`);
}
