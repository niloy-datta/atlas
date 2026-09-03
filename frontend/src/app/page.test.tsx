import { render, screen } from "@testing-library/react";
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

describe("landing page", () => {
  it("renders SkillHub navigation, hero title, and pathway cards", () => {
    render(
      <AuthProvider>
        <Home />
      </AuthProvider>
    );

    expect(screen.getAllByText("SkillHub")[0]).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: /Anything breaks/i })).toBeInTheDocument();
    expect(screen.getByText("Hire workers")).toBeInTheDocument();
    expect(screen.getByText("Find work")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Log in/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Get started/i })).toBeInTheDocument();
  });
});
