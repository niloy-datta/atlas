import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import type { User } from "firebase/auth";
import LoginPage from "../app/login/page";
import RegisterPage from "../app/register/page";
import ForgotPasswordPage from "../app/forgot-password/page";
import Home from "../app/page";
import { AuthProvider } from "../context/AuthContext";
import * as firebaseAuth from "../lib/firebase/auth";
import { atlasApi, ApiError } from "../lib/api/client";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => ({
    get: (key: string) => (key === "role" ? null : null),
  }),
}));

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

// Mock atlasApi
vi.mock("../lib/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/api/client")>();
  return {
    ...actual,
    atlasApi: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      bootstrap: vi.fn(),
      getMe: vi.fn(),
    },
  };
});

describe("Frontend Authentication Test Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("login UI renders email, password inputs, Google button, and recovery links", () => {
    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    );

    expect(screen.getByRole("heading", { name: /Welcome back/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Log in/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Continue with Google/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Forgot password\?/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Get started/i })).toBeInTheDocument();
  });

  it("registration UI renders account-type selection and form fields", () => {
    render(
      <AuthProvider>
        <RegisterPage />
      </AuthProvider>
    );

    expect(screen.getByRole("heading", { name: /Create your account/i })).toBeInTheDocument();
    expect(screen.getByText("I'm a Worker")).toBeInTheDocument();
    expect(screen.getByText("I'm an Employer")).toBeInTheDocument();
    expect(screen.getByLabelText(/Email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password \(min 8 characters\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
  });

  it("account-type selection toggles between Worker and Employer", () => {
    render(
      <AuthProvider>
        <RegisterPage />
      </AuthProvider>
    );

    const workerCard = screen.getByText("I'm a Worker").closest("button")!;
    const employerCard = screen.getByText("I'm an Employer").closest("button")!;

    // Initial state is Worker
    expect(workerCard).toHaveClass("active");
    expect(screen.getByRole("button", { name: /Register as Worker/i })).toBeInTheDocument();

    // Toggle to Employer
    fireEvent.click(employerCard);
    expect(employerCard).toHaveClass("active");
    expect(workerCard).not.toHaveClass("active");
    expect(screen.getByRole("button", { name: /Register as Employer/i })).toBeInTheDocument();
    expect(screen.getByText(/Sign up with Google as Employer/i)).toBeInTheDocument();
  });

  it("google login button invokes Firebase Google sign-in", async () => {
    vi.mocked(firebaseAuth.signInWithGoogle).mockResolvedValueOnce({
      uid: "google-uid-123",
      email: "google@atlas.local",
      emailVerified: true,
    } as unknown as User);

    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    );

    const googleBtn = screen.getByRole("button", { name: /Continue with Google/i });
    fireEvent.click(googleBtn);

    await waitFor(() => {
      expect(firebaseAuth.signInWithGoogle).toHaveBeenCalled();
    });
  });

  it("unauthenticated state on landing page shows Log in and Get started links", () => {
    render(
      <AuthProvider>
        <Home />
      </AuthProvider>
    );

    expect(screen.getByRole("link", { name: /Log in/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Get started/i })).toBeInTheDocument();
    expect(screen.queryByTestId("user-profile-badge")).not.toBeInTheDocument();
  });

  it("authenticated state on landing page renders user profile badge and logout button", async () => {
    vi.mocked(firebaseAuth.onAuthChange).mockImplementationOnce((callback) => {
      callback({
        uid: "firebase-uid-999",
        email: "worker@atlas.local",
        emailVerified: true,
      } as unknown as User);
      return vi.fn();
    });

    vi.mocked(atlasApi.getMe).mockResolvedValueOnce({
      id: "77777777-7777-7777-7777-777777777777",
      email: "worker@atlas.local",
      roles: ["ROLE_WORKER"],
      firebaseUid: "firebase-uid-999",
    });

    render(
      <AuthProvider>
        <Home />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("user-profile-badge")).toHaveTextContent("worker@atlas.local");
      expect(screen.getByTestId("user-profile-badge")).toHaveTextContent("WORKER");
      expect(screen.getByTestId("logout-button")).toBeInTheDocument();
    });
  });

  it("bootstrap flow calls atlasApi.bootstrap and binds internal user", async () => {
    vi.mocked(firebaseAuth.signUpWithEmail).mockResolvedValueOnce({
      uid: "new-fb-uid",
      email: "newworker@atlas.local",
    } as unknown as User);

    vi.mocked(atlasApi.bootstrap).mockResolvedValueOnce({
      user: {
        id: "12345678-1234-1234-1234-123456789abc",
        email: "newworker@atlas.local",
        roles: ["ROLE_WORKER"],
      },
      created: true,
    });

    render(
      <AuthProvider>
        <RegisterPage />
      </AuthProvider>
    );

    fireEvent.change(screen.getByLabelText(/Email address/i), {
      target: { value: "newworker@atlas.local" },
    });
    fireEvent.change(screen.getByLabelText(/Password \(min 8 characters\)/i), {
      target: { value: "StrongPass123!" },
    });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), {
      target: { value: "StrongPass123!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Register as Worker/i }));

    await waitFor(() => {
      expect(firebaseAuth.signUpWithEmail).toHaveBeenCalledWith("newworker@atlas.local", "StrongPass123!");
      expect(atlasApi.bootstrap).toHaveBeenCalledWith("worker");
    });
  });

  it("logout triggers signOutUser and clears state", async () => {
    vi.mocked(firebaseAuth.onAuthChange).mockImplementationOnce((callback) => {
      callback({
        uid: "fb-uid-1",
        email: "test@atlas.local",
      } as unknown as User);
      return vi.fn();
    });

    vi.mocked(atlasApi.getMe).mockResolvedValueOnce({
      id: "uuid-1",
      email: "test@atlas.local",
      roles: ["ROLE_WORKER"],
    });

    render(
      <AuthProvider>
        <Home />
      </AuthProvider>
    );

    const logoutBtn = await screen.findByTestId("logout-button");
    fireEvent.click(logoutBtn);

    await waitFor(() => {
      expect(firebaseAuth.signOutUser).toHaveBeenCalled();
    });
  });

  it("forgot password sends reset email and displays confirmation alert", async () => {
    vi.mocked(firebaseAuth.sendPasswordReset).mockResolvedValueOnce();

    render(
      <AuthProvider>
        <ForgotPasswordPage />
      </AuthProvider>
    );

    fireEvent.change(screen.getByLabelText(/Email address/i), {
      target: { value: "resetme@atlas.local" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Send reset link/i }));

    await waitFor(() => {
      expect(firebaseAuth.sendPasswordReset).toHaveBeenCalledWith("resetme@atlas.local");
      expect(screen.getByText(/Reset link sent!/i)).toBeInTheDocument();
      expect(screen.getByText("resetme@atlas.local")).toBeInTheDocument();
    });
  });

  it("renders RFC 9457 problem details backend authorization errors cleanly", async () => {
    vi.mocked(firebaseAuth.signInWithEmail).mockRejectedValueOnce(
      new ApiError(403, "User account is disabled", "ACCOUNT_DISABLED", {
        title: "Account Disabled",
        status: 403,
        detail: "User account is disabled",
        code: "ACCOUNT_DISABLED",
      })
    );

    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    );

    fireEvent.change(screen.getByLabelText(/Email address/i), {
      target: { value: "disabled@atlas.local" },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Log in/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("User account is disabled");
    });
  });
});
