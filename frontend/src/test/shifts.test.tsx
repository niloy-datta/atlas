import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ShiftMarketplacePage from "../app/shifts/page";
import CreateShiftPage from "../app/shifts/create/page";
import * as shiftsApi from "../lib/api/shifts";
import * as jobsApi from "../lib/api/jobs";
import * as orgsApi from "../lib/api/organizations";
import * as skillsApi from "../lib/api/skills";
import * as authContext from "../context/AuthContext";

const anonymousAuth = {
  firebaseUser: null,
  atlasUser: null,
  loading: false,
  error: null,
  isEmailVerified: false,
  isProvisioned: false,
  pendingBootstrap: false,
  clearError: vi.fn(),
  signInWithEmail: vi.fn(),
  signUpWithEmail: vi.fn(),
  signInWithGoogle: vi.fn(),
  signOut: vi.fn(),
  sendPasswordReset: vi.fn(),
  resendVerificationEmail: vi.fn(),
  refreshAtlasUser: vi.fn(),
  bootstrapAccount: vi.fn(),
} as unknown as authContext.AuthContextType;

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useParams: () => ({ id: "test-shift-id" }),
  usePathname: () => "/shifts",
  useSearchParams: () => ({
    get: vi.fn().mockReturnValue(null),
  }),
}));

describe("Phase 3: Shifts Domain Frontend Flows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(authContext, "useAuth").mockReturnValue(anonymousAuth);
  });

  it("renders shifts marketplace with available scheduled shifts", async () => {
    const startTime = new Date(Date.now() + 86400000).toISOString();
    const endTime = new Date(Date.now() + 86400000 + 28800000).toISOString();

    vi.spyOn(shiftsApi, "searchShifts").mockResolvedValue({
      items: [
        {
          id: "shift-1",
          jobId: "job-1",
          jobTitle: "Event Stewarding",
          organizationId: "org-1",
          organizationName: "Wembley Events Co",
          organizationSlug: "wembley-events",
          organizationVerificationStatus: "VERIFIED",
          title: "Stadium Safety Steward Shift",
          startTime,
          endTime,
          timezone: "Europe/London",
          capacity: 8,
          hourlyRatePence: 1850,
          currency: "GBP",
          status: "PUBLISHED",
          locationName: "Wembley Stadium",
          formattedAddress: "London HA9 0WS",
          latitude: 51.556,
          longitude: -0.2795,
          requiredSkillsCount: 1,
          requiredCredentialsCount: 1,
          createdAt: new Date().toISOString(),
        },
      ],
      total: 1,
      page: 0,
      size: 12,
    });

    render(<ShiftMarketplacePage />);

    await waitFor(() => {
      expect(screen.getByText("6 opportunities available in Dhaka")).toBeDefined();
    });

    expect(screen.getAllByText("Warehouse Assistant").length).toBeGreaterThan(0);
    expect(screen.getByText("RapidLogistics")).toBeDefined();
    expect(screen.getAllByText("৳380/hr").length).toBeGreaterThan(0);
    expect(screen.getByText("৳3,040 total (8h)")).toBeDefined();
  });

  it("renders employer shift creation wizard", async () => {
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
        name: "Apex Logistics",
        slug: "apex-logistics",
        verificationStatus: "VERIFIED",
        role: "EMPLOYER_ADMIN",
      },
    ]);
    vi.spyOn(jobsApi, "listOrganizationJobs").mockResolvedValue({
      items: [],
      total: 0,
      page: 0,
      size: 50,
    });
    vi.spyOn(orgsApi, "listOrganizationLocations").mockResolvedValue([]);
    vi.spyOn(skillsApi, "searchSkills").mockResolvedValue([
      { id: "skill-1", categoryId: "cat-1", categoryName: "Logistics", name: "Forklift Driving", slug: "forklift" },
    ]);

    render(<CreateShiftPage />);

    await waitFor(() => {
      expect(screen.getByText("Step 1: Shift Title, Capacity & Compensation")).toBeDefined();
    });

    expect(screen.getByPlaceholderText("e.g. Morning Warehouse Logistics Operative")).toBeDefined();
    expect(screen.getByText("Worker Capacity Slots")).toBeDefined();
    expect(screen.getByText("Hourly Rate (£/hr)")).toBeDefined();
  });
});

