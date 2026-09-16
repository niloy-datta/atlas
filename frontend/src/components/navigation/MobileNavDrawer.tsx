"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileNavDrawer({ isOpen, onClose }: MobileNavDrawerProps) {
  const { firebaseUser, atlasUser, signOut } = useAuth();
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Close on ESC key and trap focus / manage body scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Focus close button on open
    setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 50);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Mobile Navigation Menu"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out Panel */}
      <div
        ref={drawerRef}
        className="fixed inset-y-0 right-0 w-full max-w-sm bg-[#0A0F1D] border-l border-slate-800 p-6 flex flex-col justify-between shadow-2xl overflow-y-auto"
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-5 border-b border-slate-800/80">
            <Link href="/" onClick={onClose} className="flex items-center gap-2">
              <svg className="w-7 h-7" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <circle cx="10" cy="16" r="6" fill="#3B82F6" />
                <circle cx="22" cy="10" r="4" fill="#8B5CF6" />
                <circle cx="22" cy="22" r="4" fill="#10B981" />
                <line x1="14.5" y1="13.5" x2="18.5" y2="11.5" stroke="#60A5FA" strokeWidth="2" />
                <line x1="14.5" y1="18.5" x2="18.5" y2="20.5" stroke="#34D399" strokeWidth="2" />
              </svg>
              <span className="font-extrabold text-white text-lg tracking-tight">
                WORVO <span className="text-xs text-slate-400 font-normal">by SkillHub</span>
              </span>
            </Link>
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition"
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>

          {/* Pilot Location Indicator */}
          <div className="mt-4 p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <span>📍</span>
              <span className="font-semibold">Dhaka Pilot Zone</span>
            </div>
            <span className="text-emerald-400 font-bold">● Active</span>
          </div>

          {/* Navigation Links Grouped by Audience */}
          <div className="mt-6 space-y-6">
            {/* Find Work */}
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                For Workers
              </div>
              <ul className="space-y-1">
                <li>
                  <Link
                    href="/shifts"
                    onClick={onClose}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-slate-800/80 hover:text-white transition"
                  >
                    <span className="flex items-center gap-2.5">
                      <span>⏱️</span> Hourly Shifts
                    </span>
                    <span className="text-xs text-emerald-400 font-semibold">Immediate</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/jobs"
                    onClick={onClose}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-slate-800/80 hover:text-white transition"
                  >
                    <span className="flex items-center gap-2.5">
                      <span>💼</span> Jobs & Roles
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/my-shifts"
                    onClick={onClose}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-slate-800/80 hover:text-white transition"
                  >
                    <span className="flex items-center gap-2.5">
                      <span>📋</span> My Shifts
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/earnings"
                    onClick={onClose}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-slate-800/80 hover:text-white transition"
                  >
                    <span className="flex items-center gap-2.5">
                      <span>৳</span> Earnings & Payouts
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/skills"
                    onClick={onClose}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-slate-800/80 hover:text-white transition"
                  >
                    <span className="flex items-center gap-2.5">
                      <span>⭐</span> Skills & Badges
                    </span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Hire People */}
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                For Businesses & Hiring
              </div>
              <ul className="space-y-1">
                <li>
                  <Link
                    href="/hire"
                    onClick={onClose}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-slate-800/80 hover:text-white transition"
                  >
                    <span className="flex items-center gap-2.5">
                      <span>👥</span> Hire Verified Workers
                    </span>
                    <span className="text-[10px] bg-blue-950 text-blue-300 px-2 py-0.5 rounded-full font-bold">Fast</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/workers"
                    onClick={onClose}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-slate-800/80 hover:text-white transition"
                  >
                    <span className="flex items-center gap-2.5">
                      <span>🗂️</span> Workers Directory
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/shifts/create"
                    onClick={onClose}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-slate-800/80 hover:text-white transition"
                  >
                    <span className="flex items-center gap-2.5">
                      <span>➕</span> Post a Shift
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/jobs/create"
                    onClick={onClose}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-slate-800/80 hover:text-white transition"
                  >
                    <span className="flex items-center gap-2.5">
                      <span>📝</span> Post a Job
                    </span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Local Help & Platform */}
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                Local Services & Platform
              </div>
              <ul className="space-y-1">
                <li>
                  <Link
                    href="/services"
                    onClick={onClose}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-slate-800/80 hover:text-white transition"
                  >
                    <span className="flex items-center gap-2.5">
                      <span>🏠</span> Local Home & Task Services
                    </span>
                    <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-full font-bold">Dhaka</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/workpass"
                    onClick={onClose}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-slate-800/80 hover:text-white transition"
                  >
                    <span className="flex items-center gap-2.5">
                      <span>🛡️</span> WorkPass Verification
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/messages"
                    onClick={onClose}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-slate-800/80 hover:text-white transition"
                  >
                    <span className="flex items-center gap-2.5">
                      <span>💬</span> Messages
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/settings"
                    onClick={onClose}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-slate-800/80 hover:text-white transition"
                  >
                    <span className="flex items-center gap-2.5">
                      <span>⚙️</span> Settings
                    </span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer Auth Section in Drawer */}
        <div className="pt-6 mt-6 border-t border-slate-800">
          {firebaseUser ? (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
                <div className="text-slate-400">Signed in as</div>
                <div className="font-bold text-white truncate mt-0.5">
                  {atlasUser?.email || firebaseUser.email}
                </div>
                {atlasUser?.roles?.[0] && (
                  <span className="inline-block mt-1 px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 text-[10px] font-bold">
                    {atlasUser.roles[0].replace("ROLE_", "")}
                  </span>
                )}
              </div>

              <Link
                href={
                  atlasUser?.roles?.some((r) => r.includes("EMPLOYER"))
                    ? "/dashboard/employer"
                    : "/dashboard/worker"
                }
                onClick={onClose}
                className="w-full block text-center py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-md transition"
              >
                Go to Dashboard →
              </Link>

              <button
                onClick={() => {
                  signOut();
                  onClose();
                }}
                className="w-full text-center py-2 text-slate-400 hover:text-red-400 text-xs font-semibold transition"
              >
                Log out
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/login"
                onClick={onClose}
                className="text-center py-2.5 px-4 bg-slate-800/90 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-bold transition"
              >
                Log in
              </Link>
              <Link
                href="/register"
                onClick={onClose}
                className="text-center py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold shadow-md transition"
              >
                Get started
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
