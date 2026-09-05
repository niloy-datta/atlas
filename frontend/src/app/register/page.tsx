"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signUpWithEmail, signInWithGoogle, error, clearError } = useAuth();

  const roleParam = searchParams.get("role");
  const initialRole: "worker" | "employer" = roleParam === "employer" || roleParam === "worker" ? roleParam : "worker";
  const [accountType, setAccountType] = useState<"worker" | "employer">(initialRole);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!email || !password) {
      setLocalError("Please fill in all fields.");
      return;
    }

    if (password.length < 8) {
      setLocalError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setLocalError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await signUpWithEmail(email, password, accountType);
      router.push(`/onboarding/${accountType}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Registration failed";
      setLocalError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setLocalError(null);
    clearError();
    setLoading(true);
    try {
      await signInWithGoogle(accountType);
      router.push(`/onboarding/${accountType}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Google sign-up failed";
      setLocalError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-container">
        <div className="auth-header">
          <Link href="/" className="brand-logo justify-center mb-6">
            <svg className="logo-icon" viewBox="0 0 32 32" fill="none">
              <circle cx="10" cy="16" r="6" fill="#FF5A1F" />
              <circle cx="22" cy="10" r="4" fill="#0F172A" />
              <circle cx="22" cy="22" r="4" fill="#0F172A" />
              <line x1="14.5" y1="13.5" x2="18.5" y2="11.5" stroke="#0F172A" strokeWidth="2" />
              <line x1="14.5" y1="18.5" x2="18.5" y2="20.5" stroke="#0F172A" strokeWidth="2" />
            </svg>
            <span className="logo-text">SkillHub</span>
          </Link>
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-subtitle">Join thousands of verified workers and employers</p>
        </div>

        {/* Account Type Selector */}
        <div className="account-type-selector mb-6" role="group" aria-label="Account type">
          <button
            type="button"
            className={`type-card ${accountType === "worker" ? "active" : ""}`}
            onClick={() => setAccountType("worker")}
          >
            <div className="type-icon">👷</div>
            <div className="type-info">
              <span className="type-title">I&apos;m a Worker</span>
              <span className="type-desc">Find jobs, verify skills, get paid</span>
            </div>
          </button>
          <button
            type="button"
            className={`type-card ${accountType === "employer" ? "active" : ""}`}
            onClick={() => setAccountType("employer")}
          >
            <div className="type-icon">🏢</div>
            <div className="type-info">
              <span className="type-title">I&apos;m an Employer</span>
              <span className="type-desc">Hire verified talent and post shifts</span>
            </div>
          </button>
        </div>

        {(localError || error) && (
          <div className="auth-alert error" role="alert">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{localError || error}</span>
          </div>
        )}

        <button
          type="button"
          className="btn-google"
          onClick={handleGoogleSignUp}
          disabled={loading}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Sign up with Google as {accountType === "worker" ? "Worker" : "Employer"}</span>
        </button>

        <div className="auth-divider">
          <span>or register with email</span>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="registerEmail">Email address</label>
            <input
              id="registerEmail"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="registerPassword">Password (min 8 characters)</label>
            <input
              id="registerPassword"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              className="form-input"
            />
          </div>

          <button type="submit" className="btn-auth-submit" disabled={loading}>
            {loading ? "Creating account..." : `Register as ${accountType === "worker" ? "Worker" : "Employer"}`}
          </button>
        </form>

        <div className="auth-footer">
          <span>Already have an account?</span>{" "}
          <Link href="/login" className="auth-link font-semibold">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="auth-page-wrapper">Loading...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
