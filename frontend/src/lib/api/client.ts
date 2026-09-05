import { ATLAS_API_URL } from "../config";
import { getCurrentIdToken } from "../firebase/auth";

export interface ApiProblemDetail {
  type?: string;
  title: string;
  status: number;
  detail: string;
  code?: string;
  instance?: string;
  invalidParams?: Array<{ name: string; reason: string }>;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly problem?: ApiProblemDetail;

  constructor(status: number, message: string, code = "API_ERROR", problem?: ApiProblemDetail) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.problem = problem;
  }
}

export interface AtlasUser {
  id: string;
  email: string;
  roles: string[];
  firebaseUid?: string;
  enabled?: boolean;
}

export interface BootstrapResponse {
  user: AtlasUser;
  created: boolean;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  requireAuth = true,
): Promise<T> {
  const url = `${ATLAS_API_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body && typeof options.body === "string") {
    headers.set("Content-Type", "application/json");
  }

  if (requireAuth) {
    const token = await getCurrentIdToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error connecting to ATLAS server";
    throw new ApiError(0, message, "NETWORK_ERROR");
  }

  if (!response.ok) {
    let problem: ApiProblemDetail | undefined;
    let message = `Request failed with status ${response.status}`;
    let code = "UNKNOWN_ERROR";

    try {
      const data = await response.json();
      problem = data;
      message = data.detail || data.title || message;
      code = data.code || `HTTP_${response.status}`;
    } catch {
      // Body not JSON
    }

    throw new ApiError(response.status, message, code, problem);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const atlasApi = {
  get: <T>(path: string, requireAuth = true) =>
    request<T>(path, { method: "GET" }, requireAuth),

  post: <T>(path: string, body?: unknown, requireAuth = true) =>
    request<T>(
      path,
      {
        method: "POST",
        body: body ? JSON.stringify(body) : undefined,
      },
      requireAuth,
    ),

  put: <T>(path: string, body?: unknown, requireAuth = true) =>
    request<T>(
      path,
      {
        method: "PUT",
        body: body ? JSON.stringify(body) : undefined,
      },
      requireAuth,
    ),

  patch: <T>(path: string, body?: unknown, requireAuth = true) =>
    request<T>(
      path,
      {
        method: "PATCH",
        body: body ? JSON.stringify(body) : undefined,
      },
      requireAuth,
    ),

  delete: <T>(path: string, requireAuth = true) =>
    request<T>(path, { method: "DELETE" }, requireAuth),

  // Identity operations
  async bootstrap(accountType: "worker" | "employer"): Promise<BootstrapResponse> {
    return request<BootstrapResponse>(
      "/api/v1/auth/bootstrap",
      {
        method: "POST",
        body: JSON.stringify({ accountType }),
      },
      true,
    );
  },

  async getMe(): Promise<AtlasUser> {
    return request<AtlasUser>("/api/v1/auth/me", { method: "GET" }, true);
  },
};
