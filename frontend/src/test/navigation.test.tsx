import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Navbar from "../components/navigation/Navbar";
import Footer from "../components/navigation/Footer";
import * as authContext from "../context/AuthContext";

describe("Navbar & Footer Navigation Suite", () => {
  it("renders all primary desktop navigation links with valid routes", () => {
    vi.spyOn(authContext, "useAuth").mockReturnValue({
      firebaseUser: null,
      atlasUser: null,
      loading: false,
      error: null,
      refreshAtlasUser: vi.fn(),
      signOut: vi.fn(),
    } as unknown as authContext.AuthContextType);

    render(<Navbar />);

    expect(screen.getByRole("link", { name: /Find Shifts/i })).toHaveAttribute("href", "/shifts");
    expect(screen.getByRole("link", { name: /Jobs/i })).toHaveAttribute("href", "/jobs");
    expect(screen.getByRole("link", { name: /Hire People/i })).toHaveAttribute("href", "/hire");
    expect(screen.getByRole("link", { name: /Local Help/i })).toHaveAttribute("href", "/services");
    expect(screen.getByRole("link", { name: /Workers/i })).toHaveAttribute("href", "/workers");
    expect(screen.getByRole("link", { name: /WorkPass/i })).toHaveAttribute("href", "/workpass");
  });

  it("shows dashboard link and user email when authenticated", () => {
    vi.spyOn(authContext, "useAuth").mockReturnValue({
      firebaseUser: { email: "worker@example.com", uid: "uid-123" },
      atlasUser: { email: "worker@example.com", roles: ["ROLE_WORKER"] },
      loading: false,
      error: null,
      refreshAtlasUser: vi.fn(),
      signOut: vi.fn(),
    } as unknown as authContext.AuthContextType);

    render(<Navbar />);

    const dashboardLink = screen.getByRole("link", { name: /Go to Dashboard/i });
    expect(dashboardLink).toBeInTheDocument();
    expect(dashboardLink).toHaveAttribute("href", "/dashboard/worker");

    const logoutBtn = screen.getByTestId("logout-button");
    expect(logoutBtn).toBeInTheDocument();
  });

  it("closes mobile drawer when ESC key is pressed", () => {
    vi.spyOn(authContext, "useAuth").mockReturnValue({
      firebaseUser: null,
      atlasUser: null,
      loading: false,
      error: null,
      refreshAtlasUser: vi.fn(),
      signOut: vi.fn(),
    } as unknown as authContext.AuthContextType);

    render(<Navbar />);

    const openBtn = screen.getByRole("button", { name: /Open navigation menu/i });
    fireEvent.click(openBtn);

    expect(screen.getByRole("dialog", { name: /Mobile Navigation Menu/i })).toBeInTheDocument();

    // Fire Escape key
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: /Mobile Navigation Menu/i })).not.toBeInTheDocument();
  });

  it("ensures Footer contains zero href=# and links to all primary sections", () => {
    render(<Footer />);

    const footerLinks = screen.getAllByRole("link");
    expect(footerLinks.length).toBeGreaterThan(10);

    footerLinks.forEach((link) => {
      const href = link.getAttribute("href");
      expect(href).toBeTruthy();
      expect(href).not.toBe("#");
      expect(href?.startsWith("/")).toBe(true);
    });
  });
});
