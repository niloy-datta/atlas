import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import WorkspaceSidebar from "../components/navigation/WorkspaceSidebar";
import * as authContext from "../context/AuthContext";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard/worker",
}));

describe("Workspace role navigation", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows Availability for workers", () => {
    vi.spyOn(authContext, "useAuth").mockReturnValue({
      firebaseUser: { email: "worker@example.com", uid: "worker-1" },
      atlasUser: { email: "worker@example.com", roles: ["ROLE_WORKER"] },
      loading: false,
      error: null,
      refreshAtlasUser: vi.fn(),
      signOut: vi.fn(),
    } as unknown as authContext.AuthContextType);

    render(<WorkspaceSidebar />);

    expect(screen.getByRole("link", { name: /Availability/i })).toHaveAttribute("href", "/availability");
    expect(screen.queryByRole("link", { name: /Workforce/i })).not.toBeInTheDocument();
  });

  it("shows Workforce for employer members", () => {
    vi.spyOn(authContext, "useAuth").mockReturnValue({
      firebaseUser: { email: "employer@example.com", uid: "employer-1" },
      atlasUser: { email: "employer@example.com", roles: ["ROLE_EMPLOYER_MEMBER"] },
      loading: false,
      error: null,
      refreshAtlasUser: vi.fn(),
      signOut: vi.fn(),
    } as unknown as authContext.AuthContextType);

    render(<WorkspaceSidebar />);

    expect(screen.getByRole("link", { name: /Workforce/i })).toHaveAttribute("href", "/workforce");
    expect(screen.queryByRole("link", { name: /Availability/i })).not.toBeInTheDocument();
  });
});
