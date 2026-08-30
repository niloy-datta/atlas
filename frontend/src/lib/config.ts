const DEFAULT_API_URL = "http://localhost:8080";

export const ATLAS_API_URL =
  process.env.NEXT_PUBLIC_ATLAS_API_URL?.replace(/\/$/, "") ?? DEFAULT_API_URL;

