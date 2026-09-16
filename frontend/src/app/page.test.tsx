import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Home from "./page";
import { AuthProvider } from "../context/AuthContext";

// Mock Firebase auth functions
vi.mock("../lib/firebase/auth", () => ({
  auth: { currentUser: null },
  signInWithEmail: vi.fn(),
  signUpWithEmail: vi.fn(),
  signInWithGoogle: vi.fn(),
  signOutUser: vi.fn(),
  sendPasswordReset: vi.fn(),
  sendVerificationEmail: vi.fn(),
  getCurrentIdToken: vi.fn(),
  onAuthChange: vi.fn((cb) => {
    cb(null);
    return vi.fn();
  }),
  checkRedirectResult: vi.fn().mockResolvedValue(null),
}));

describe("WORVO Homepage & Marketplace IA", () => {
  it("renders brand, hero title, and three primary pathways", () => {
    render(
      <AuthProvider>
        <Home />
      </AuthProvider>
    );

    // Primary Branding
    expect(screen.getAllByText(/WORVO/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/by SkillHub/i)[0]).toBeInTheDocument();

    // Hero title
    expect(
      screen.getByRole("heading", { level: 1, name: /Work when you want/i })
    ).toBeInTheDocument();

    // 3 Distinct Pathways
    expect(screen.getByRole("heading", { level: 3, name: /I Need Work/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: /I Need People/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: /I Need Help/i })).toBeInTheDocument();

    // Verify Pathway links
    expect(screen.getByRole("link", { name: /I Need Work/i })).toHaveAttribute("href", "/shifts");
    expect(screen.getByRole("link", { name: /I Need People/i })).toHaveAttribute("href", "/hire");
    expect(screen.getByRole("link", { name: /I Need Help/i })).toHaveAttribute("href", "/services");

    // Auth controls
    expect(screen.getAllByRole("link", { name: /Log in/i })[0]).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Get started/i })[0]).toBeInTheDocument();
  });

  it("switches intent via IntentSwitcher and updates search placeholder", () => {
    render(
      <AuthProvider>
        <Home />
      </AuthProvider>
    );

    const workerTab = screen.getByRole("tab", { name: /Find Work/i });
    const employerTab = screen.getByRole("tab", { name: /Hire People/i });
    const customerTab = screen.getByRole("tab", { name: /Get Local Help/i });

    expect(workerTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByPlaceholderText(/Search shifts or jobs/i)).toBeInTheDocument();

    // Switch to Employer
    fireEvent.click(employerTab);
    expect(employerTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByPlaceholderText(/What workforce do you need/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Hire Staff/i })).toBeInTheDocument();

    // Switch to Customer
    fireEvent.click(customerTab);
    expect(customerTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByPlaceholderText(/What home task do you need help with/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Book Help/i })).toBeInTheDocument();
  });

  it("renders Dhaka pilot indicators and BDT rates without dead links", () => {
    render(
      <AuthProvider>
        <Home />
      </AuthProvider>
    );

    // Dhaka pilot badges
    expect(screen.getAllByText(/Dhaka Pilot/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/৳/i).length).toBeGreaterThan(0);

    // Ensure zero href="#"
    const allLinks = screen.getAllByRole("link");
    allLinks.forEach((link) => {
      expect(link.getAttribute("href")).not.toBe("#");
    });
  });

  it("opens and closes the mobile navigation drawer", () => {
    render(
      <AuthProvider>
        <Home />
      </AuthProvider>
    );

    const openMenuBtn = screen.getByRole("button", { name: /Open navigation menu/i });
    expect(openMenuBtn).toBeInTheDocument();

    // Open drawer
    fireEvent.click(openMenuBtn);
    const dialog = screen.getByRole("dialog", { name: /Mobile Navigation Menu/i });
    expect(dialog).toBeInTheDocument();

    // Close via close button
    const closeBtn = screen.getByRole("button", { name: /Close menu/i });
    fireEvent.click(closeBtn);
    expect(screen.queryByRole("dialog", { name: /Mobile Navigation Menu/i })).not.toBeInTheDocument();
  });
});
