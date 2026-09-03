"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";

export default function ForgotPasswordPage() {
  const { sendPasswordReset, error, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();
    if (!email) {
      setLocalError("Please enter your email address.");
      return;
    }
    setLoading(true);
    try {
      await sendPasswordReset(email);
      setSubmitted(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send password reset email.";
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
          <h1 className="auth-title">Reset your password</h1>
          <p className="auth-subtitle">
            Enter your registered email address and we&apos;ll send you a link to reset your password.
          </p>
        </div>

        {submitted ? (
          <div className="auth-alert success" role="status">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <div>
              <strong>Reset link sent!</strong>
              <p className="text-sm mt-1">
                Check your inbox at <strong>{email}</strong> for instructions to reset your password.
              </p>
            </div>
          </div>
        ) : (
          <>
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

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="resetEmail">Email address</label>
                <input
                  id="resetEmail"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="form-input"
                />
              </div>

              <button type="submit" className="btn-auth-submit" disabled={loading}>
                {loading ? "Sending link..." : "Send reset link"}
              </button>
            </form>
          </>
        )}

        <div className="auth-footer">
          <Link href="/login" className="auth-link font-semibold">
            &larr; Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
