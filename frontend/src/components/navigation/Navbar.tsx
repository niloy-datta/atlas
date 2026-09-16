"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import MobileNavDrawer from "./MobileNavDrawer";

export default function Navbar() {
  const { firebaseUser, atlasUser, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="navbar" role="banner">
        <div className="nav-container">
          <div className="nav-left">
            <Link href="/" className="brand-logo" aria-label="WORVO by SkillHub Home">
              <svg className="logo-icon" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <circle cx="10" cy="16" r="6" fill="#3B82F6" />
                <circle cx="22" cy="10" r="4" fill="#8B5CF6" />
                <circle cx="22" cy="22" r="4" fill="#10B981" />
                <line x1="14.5" y1="13.5" x2="18.5" y2="11.5" stroke="#60A5FA" strokeWidth="2" />
                <line x1="14.5" y1="18.5" x2="18.5" y2="20.5" stroke="#34D399" strokeWidth="2" />
              </svg>
              <span className="logo-text font-extrabold tracking-tight">
                WORVO <span className="text-xs font-normal text-slate-400">by SkillHub</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6" aria-label="Primary navigation">
              <Link href="/shifts" className="nav-link">
                Find Shifts
              </Link>
              <Link href="/jobs" className="nav-link">
                Jobs
              </Link>
              <Link href="/hire" className="nav-link">
                Hire People
              </Link>
              <Link href="/services" className="nav-link">
                Local Help
              </Link>
              <Link href="/workers" className="nav-link">
                Workers
              </Link>
              <Link href="/workpass" className="nav-link">
                WorkPass
              </Link>
            </nav>
          </div>

          <div className="nav-right">
            {/* Pilot Zone Indicator */}
            <div
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/70 border border-slate-700/60 text-xs font-semibold text-slate-300"
              title="Current Active Pilot: Dhaka Metropolitan Area"
            >
              <span className="dot-green" aria-hidden="true" />
              <span>Dhaka, BD</span>
            </div>

            {/* Desktop Auth */}
            <div className="hidden lg:flex items-center gap-3">
              {firebaseUser ? (
                <>
                  <Link
                    href={
                      atlasUser?.roles?.some((r) => r.includes("EMPLOYER"))
                        ? "/dashboard/employer"
                        : "/dashboard/worker"
                    }
                    className="px-3.5 py-1.5 bg-blue-900/50 border border-blue-500/40 text-blue-300 hover:bg-blue-800/60 rounded-full text-xs font-bold transition-colors shadow-sm"
                  >
                    Go to Dashboard →
                  </Link>

                  <div className="user-badge" data-testid="user-profile-badge">
                    <span className="max-w-[140px] truncate text-xs text-slate-200">
                      {atlasUser?.email || firebaseUser.email}
                    </span>
                    {atlasUser?.roles?.[0] && (
                      <span className="role-tag">{atlasUser.roles[0].replace("ROLE_", "")}</span>
                    )}
                  </div>

                  <button
                    onClick={() => signOut()}
                    className="btn-text text-xs text-slate-400 hover:text-white"
                    data-testid="logout-button"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="btn-text">
                    Log in
                  </Link>
                  <Link href="/register" className="btn-primary text-xs font-bold">
                    Get started
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/70 text-slate-200 hover:text-white hover:bg-slate-700 focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="Open navigation menu"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-navigation-drawer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <MobileNavDrawer isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
    </>
  );
}
