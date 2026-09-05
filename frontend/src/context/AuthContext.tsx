"use client";

import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "firebase/auth";
import {
  onAuthChange,
  signInWithEmail as fbSignInWithEmail,
  signUpWithEmail as fbSignUpWithEmail,
  signInWithGoogle as fbSignInWithGoogle,
  signOutUser as fbSignOutUser,
  sendPasswordReset as fbSendPasswordReset,
  sendVerificationEmail as fbSendVerificationEmail,
  checkRedirectResult,
} from "../lib/firebase/auth";
import { atlasApi, type AtlasUser, ApiError } from "../lib/api/client";

export interface AuthContextType {
  firebaseUser: User | null;
  atlasUser: AtlasUser | null;
  loading: boolean;
  error: string | null;
  isEmailVerified: boolean;
  isProvisioned: boolean;
  pendingBootstrap: boolean;
  clearError: () => void;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, accountType: "worker" | "employer") => Promise<void>;
  signInWithGoogle: (preferredAccountType?: "worker" | "employer") => Promise<void>;
  bootstrapAccount: (accountType: "worker" | "employer") => Promise<AtlasUser>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  refreshAtlasUser: () => Promise<AtlasUser | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [atlasUser, setAtlasUser] = useState<AtlasUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingBootstrap, setPendingBootstrap] = useState(false);

  // Sync internal Atlas user from backend
  const syncAtlasUser = async (user: User, fallbackAccountType?: "worker" | "employer"): Promise<AtlasUser | null> => {
    try {
      const me = await atlasApi.getMe();
      setAtlasUser(me);
      setPendingBootstrap(false);
      return me;
    } catch (err: unknown) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 404)) {
        // Account not yet provisioned in ATLAS
        if (fallbackAccountType) {
          const res = await atlasApi.bootstrap(fallbackAccountType);
          setAtlasUser(res.user);
          setPendingBootstrap(false);
          return res.user;
        } else {
          setAtlasUser(null);
          setPendingBootstrap(true);
          return null;
        }
      } else {
        const message = err instanceof Error ? err.message : "Failed to load Atlas user profile";
        console.error("Error syncing Atlas user:", err);
        setError(message);
        return null;
      }
    }
  };

  useEffect(() => {
    // Check if returning from Google redirect
    checkRedirectResult().then(async (redirectUser) => {
      if (redirectUser) {
        const storedRole = (sessionStorage.getItem("atlas_pending_role") as "worker" | "employer") || "worker";
        sessionStorage.removeItem("atlas_pending_role");
        await syncAtlasUser(redirectUser, storedRole);
      }
    });

    const unsubscribe = onAuthChange(async (user) => {
      setFirebaseUser(user);
      if (user) {
        await syncAtlasUser(user);
      } else {
        setAtlasUser(null);
        setPendingBootstrap(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const clearError = () => setError(null);

  const signInWithEmail = async (email: string, pass: string) => {
    setError(null);
    setLoading(true);
    try {
      const user = await fbSignInWithEmail(email, pass);
      await syncAtlasUser(user);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Invalid credentials";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, accountType: "worker" | "employer") => {
    setError(null);
    setLoading(true);
    try {
      await fbSignUpWithEmail(email, pass);
      // Immediately bootstrap the internal ATLAS account with the chosen role
      const res = await atlasApi.bootstrap(accountType);
      setAtlasUser(res.user);
      setPendingBootstrap(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Registration failed";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (preferredAccountType: "worker" | "employer" = "worker") => {
    setError(null);
    setLoading(true);
    try {
      sessionStorage.setItem("atlas_pending_role", preferredAccountType);
      const user = await fbSignInWithGoogle();
      if (user) {
        await syncAtlasUser(user, preferredAccountType);
        sessionStorage.removeItem("atlas_pending_role");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Google sign-in failed";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const bootstrapAccount = async (accountType: "worker" | "employer") => {
    setError(null);
    try {
      const res = await atlasApi.bootstrap(accountType);
      setAtlasUser(res.user);
      setPendingBootstrap(false);
      return res.user;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to bootstrap account";
      setError(message);
      throw err;
    }
  };

  const signOut = async () => {
    setError(null);
    setLoading(true);
    try {
      await fbSignOutUser();
      setFirebaseUser(null);
      setAtlasUser(null);
      setPendingBootstrap(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to sign out";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const sendPasswordReset = async (email: string) => {
    setError(null);
    try {
      await fbSendPasswordReset(email);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send password reset email";
      setError(message);
      throw err;
    }
  };

  const resendVerificationEmail = async () => {
    setError(null);
    try {
      await fbSendVerificationEmail();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to resend verification email";
      setError(message);
      throw err;
    }
  };

  const refreshAtlasUser = async () => {
    if (!firebaseUser) return null;
    return syncAtlasUser(firebaseUser);
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        atlasUser,
        loading,
        error,
        isEmailVerified: Boolean(firebaseUser?.emailVerified),
        isProvisioned: Boolean(atlasUser?.id),
        pendingBootstrap,
        clearError,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        bootstrapAccount,
        signOut,
        sendPasswordReset,
        resendVerificationEmail,
        refreshAtlasUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
