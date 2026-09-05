import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import WorkerOnboardingPage from "../app/onboarding/worker/page";
import EmployerOnboardingPage from "../app/onboarding/employer/page";
import * as authContext from "../context/AuthContext";
import * as workersApi from "../lib/api/workers";
import * as orgsApi from "../lib/api/organizations";
import * as skillsApi from "../lib/api/skills";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useParams: () => ({ handle: "test-worker" }),
  useSearchParams: () => ({
    get: vi.fn().mockReturnValue("worker"),
  }),
}));

describe("Phase 1: Onboarding and Profile Flows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders worker onboarding form with identity fields", async () => {
    vi.spyOn(authContext, "useAuth").mockReturnValue({
      firebaseUser: { uid: "test-uid", email: "worker@example.com" } as unknown as import("firebase/auth").User,
      atlasUser: { id: "test-id", email: "worker@example.com", roles: ["ROLE_WORKER"] },
      loading: false,
      error: null,
      isEmailVerified: true,
      isProvisioned: true,
      pendingBootstrap: false,
      clearError: vi.fn(),
      signInWithEmail: vi.fn(),
      signUpWithEmail: vi.fn(),
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
      sendPasswordReset: vi.fn(),
      bootstrapAccount: vi.fn(),
      resendVerificationEmail: vi.fn(),
      refreshAtlasUser: vi.fn(),
    } as unknown as authContext.AuthContextType);

    vi.spyOn(workersApi, "getWorkerProfile").mockRejectedValue(new Error("No profile"));
    vi.spyOn(skillsApi, "listCategories").mockResolvedValue([
      { id: "cat-1", name: "Trades", slug: "trades" },
    ]);
    vi.spyOn(skillsApi, "searchSkills").mockResolvedValue([
      { id: "skill-1", categoryId: "cat-1", categoryName: "Trades", name: "Plumbing", slug: "plumbing" },
    ]);

    render(<WorkerOnboardingPage />);

    await waitFor(() => {
      expect(screen.getByText("Worker Profile Setup")).toBeDefined();
    });

    expect(screen.getByText("Step 1: Your Public Handle & Bio")).toBeDefined();
    expect(screen.getByPlaceholderText("Experienced Plumber & Heating Specialist")).toBeDefined();
  });

  it("renders employer onboarding form with organization creation", async () => {
    vi.spyOn(authContext, "useAuth").mockReturnValue({
      firebaseUser: { uid: "test-uid", email: "employer@example.com" } as unknown as import("firebase/auth").User,
      atlasUser: { id: "test-id", email: "employer@example.com", roles: ["ROLE_EMPLOYER_ADMIN"] },
      loading: false,
      error: null,
      isEmailVerified: true,
      isProvisioned: true,
      pendingBootstrap: false,
      clearError: vi.fn(),
      signInWithEmail: vi.fn(),
      signUpWithEmail: vi.fn(),
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
      sendPasswordReset: vi.fn(),
      bootstrapAccount: vi.fn(),
      resendVerificationEmail: vi.fn(),
      refreshAtlasUser: vi.fn(),
    } as unknown as authContext.AuthContextType);

    vi.spyOn(orgsApi, "listOrganizations").mockResolvedValue([]);

    render(<EmployerOnboardingPage />);

    await waitFor(() => {
      expect(screen.getByText("Employer Organization Setup")).toBeDefined();
    });

    expect(screen.getByText("Step 1: Create Organization")).toBeDefined();
    expect(screen.getByPlaceholderText("Soho Café & Bakery")).toBeDefined();
  });
});
