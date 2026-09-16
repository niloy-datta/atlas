const DEFAULT_API_URL = "http://localhost:8080";

export const ATLAS_API_URL =
  process.env.NEXT_PUBLIC_ATLAS_API_URL?.replace(/\/$/, "") || DEFAULT_API_URL;

export const IS_GITHUB_PAGES = process.env.GITHUB_PAGES === "true";

export const IS_DEMO_ENVIRONMENT =
  IS_GITHUB_PAGES ||
  !process.env.NEXT_PUBLIC_ATLAS_API_URL ||
  process.env.NEXT_PUBLIC_ATLAS_API_URL.includes("localhost") ||
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.startsWith("AIzaSyTest");
