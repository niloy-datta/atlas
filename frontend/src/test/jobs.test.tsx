import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import JobMarketplacePage from "../app/jobs/page";
import CreateJobPage from "../app/jobs/create/page";
import * as jobsApi from "../lib/api/jobs";
import * as orgsApi from "../lib/api/organizations";
import * as skillsApi from "../lib/api/skills";
import * as authContext from "../context/AuthContext";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useParams: () => ({ id: "test-job-id" }),
  useSearchParams: () => ({
    get: vi.fn().mockReturnValue(null),
  }),
}));

describe("Phase 2: Jobs Domain Frontend Flows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders job marketplace with open engagements", async () => {
    vi.spyOn(jobsApi, "searchJobs").mockResolvedValue({
      items: [
        {
          id: "job-1",
          organizationId: "org-1",
          organizationName: "London Electricals Ltd",
          organizationSlug: "london-electricals",
          organizationVerificationStatus: "VERIFIED",
          title: "Senior Commercial Electrician",
          jobType: "SHIFT",
          status: "PUBLISHED",
          locationName: "Canary Wharf",
          formattedAddress: "1 Canada Square, London",
          latitude: 51.5054,
          longitude: -0.0209,
          budgetMinPence: 25000,
          budgetMaxPence: 35000,
          currency: "GBP",
          requiredSkillsCount: 2,
          requiredCredentialsCount: 1,
          createdAt: new Date().toISOString(),
        },
      ],
      total: 1,
      page: 0,
      size: 12,
    });

    render(<JobMarketplacePage />);

    await waitFor(() => {
      expect(screen.getByText("Find Verified Workforce Engagements")).toBeDefined();
    });

    expect(screen.getByText("Senior Commercial Electrician")).toBeDefined();
    expect(screen.getByText("London Electricals Ltd")).toBeDefined();
    expect(screen.getByText("£250.00 – £350.00")).toBeDefined();
    expect(screen.getByText("2 skills • 1 cert")).toBeDefined();
  });

  it("renders employer job creation wizard", async () => {
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

    vi.spyOn(orgsApi, "listOrganizations").mockResolvedValue([
      {
        id: "org-1",
        name: "Apex Engineering",
        slug: "apex-engineering",
        verificationStatus: "VERIFIED",
        role: "EMPLOYER_ADMIN",
      },
    ]);
    vi.spyOn(orgsApi, "listOrganizationLocations").mockResolvedValue([]);
    vi.spyOn(skillsApi, "searchSkills").mockResolvedValue([
      { id: "skill-1", categoryId: "cat-1", categoryName: "Trades", name: "Plumbing", slug: "plumbing" },
    ]);

    render(<CreateJobPage />);

    await waitFor(() => {
      expect(screen.getByText("Step 1: Job Details & Compensation")).toBeDefined();
    });

    expect(screen.getByPlaceholderText("e.g. Commercial Electrician (NICEIC Qualified)")).toBeDefined();
    expect(screen.getByText("Hourly Shift")).toBeDefined();
  });
});
