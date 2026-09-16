"use client";

import { useState } from "react";
import Link from "next/link";

export default function WorkPassPage() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-3 rounded-xl shadow-2xl shadow-blue-500/20 border border-blue-400/30 text-sm font-medium flex items-center gap-3 animate-fade-in">
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#0B1120]/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-black shadow-lg shadow-blue-500/20">
              S
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight text-white">SkillHub</span>
              <span className="hidden sm:inline-block text-[11px] text-slate-400 block -mt-1 font-medium">Work Today, A Brighter Tomorrow.</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-2">
            <Link href="/" className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition">
              Home
            </Link>
            <Link href="/jobs" className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition">
              Find Work
            </Link>
            <Link href="/my-shifts" className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition">
              My Shifts
            </Link>
            <Link href="/workpass" className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 shadow-md shadow-blue-500/20 transition">
              WorkPass
            </Link>
            <Link href="/dashboard/worker" className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition">
              Earnings
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => showToast("WorkPass public link copied to clipboard: skillhub.bd/pass/niloy-datta")}
            className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-full text-xs font-bold shadow-md shadow-blue-500/20 transition flex items-center gap-1.5"
          >
            <span>🔗</span> Share Passport
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8 space-y-7">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Work Passport</h1>
            <p className="text-sm text-slate-400 mt-1">Your verifiable digital credential. Real reputation, secured mobility.</p>
          </div>
          <div className="px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <span>🛡️</span> Cryptographically Verified by SkillHub Trust Engine
          </div>
        </div>

        {/* Worker ID Card + QR Section from Screen 4 */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#0E1626] border border-slate-800 shadow-2xl grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Worker Info (8 cols) */}
          <div className="md:col-span-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-3xl font-bold text-white shadow-xl shadow-blue-500/20">
                👨‍💼
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">Niloy Chandra Datta</h2>
                  <span className="text-blue-400 text-sm font-bold">✓</span>
                </div>
                <p className="text-sm text-slate-400">Warehouse Operations Specialist • Dhaka, BD</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-yellow-400 font-bold">
                  <span>★ 4.9 (128 client reviews)</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400 font-medium">Passport ID: #WP-8842-DH</span>
                </div>
              </div>
            </div>

            {/* 4 Core Verification Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 text-center">
                <div className="text-xl font-black text-emerald-400">98%</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Attendance</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 text-center">
                <div className="text-xl font-black text-blue-400">720h</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Verified Hours</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 text-center">
                <div className="text-xl font-black text-purple-400">96%</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Reliability</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 text-center">
                <div className="text-xl font-black text-amber-400">87%</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Repeat Hire</div>
              </div>
            </div>

            {/* Skill Badges */}
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="px-3 py-1 rounded-xl bg-blue-900/30 border border-blue-500/30 text-xs font-semibold text-blue-300">
                Warehouse Logistics
              </span>
              <span className="px-3 py-1 rounded-xl bg-purple-900/30 border border-purple-500/30 text-xs font-semibold text-purple-300">
                Forklift (In Progress)
              </span>
              <span className="px-3 py-1 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300">
                Team Player
              </span>
              <span className="px-3 py-1 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300">
                English (Working)
              </span>
              <span className="px-3 py-1 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300">
                Bangla (Native)
              </span>
            </div>
          </div>

          {/* QR Code & Scan Badge (4 cols) */}
          <div className="md:col-span-4 p-5 rounded-2xl bg-gradient-to-b from-[#111C32] to-[#0A0F1D] border border-blue-500/30 text-center space-y-3 shadow-xl">
            <div className="w-32 h-32 mx-auto bg-white p-2 rounded-2xl shadow-inner flex items-center justify-center">
              {/* QR Pattern Simulation */}
              <div className="w-full h-full border-4 border-black p-1 grid grid-cols-5 gap-1 bg-white">
                <div className="bg-black" /><div className="bg-black" /><div className="bg-black" /><div className="bg-white" /><div className="bg-black" />
                <div className="bg-black" /><div className="bg-white" /><div className="bg-black" /><div className="bg-black" /><div className="bg-black" />
                <div className="bg-black" /><div className="bg-black" /><div className="bg-white" /><div className="bg-black" /><div className="bg-black" />
                <div className="bg-white" /><div className="bg-black" /><div className="bg-black" /><div className="bg-white" /><div className="bg-black" />
                <div className="bg-black" /><div className="bg-black" /><div className="bg-black" /><div className="bg-black" /><div className="bg-black" />
              </div>
            </div>

            <div>
              <div className="text-xs font-bold text-white flex items-center justify-center gap-1.5">
                <span className="text-blue-400">✓</span> Verified Worker
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Scan to view live on-chain credentials</div>
            </div>

            <button
              onClick={() => showToast("Downloading PDF WorkPass Credential...")}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 transition flex items-center justify-center gap-2"
            >
              <span>📥</span> Download Card
            </button>
          </div>
        </div>

        {/* Career Progression & Skill Tree Section from Screen 4 */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Skill Tree (7 cols) */}
          <div className="md:col-span-7 p-6 rounded-3xl bg-[#0E1626] border border-slate-800 space-y-5">
            <div>
              <h3 className="text-base font-bold text-white">Skill Tree & Role Ladder</h3>
              <p className="text-xs text-slate-400">Your roadmap to higher hourly pay and seniority.</p>
            </div>

            <div className="space-y-4">
              {/* Step 1 */}
              <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-xs font-bold">
                    ✓
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">General Worker</div>
                    <div className="text-[10px] text-slate-400">Completed 40 shifts</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-400">৳300 - ৳400/hr</span>
              </div>

              {/* Step 2 */}
              <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-xs font-bold">
                    ✓
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Picker / Packer</div>
                    <div className="text-[10px] text-slate-400">Completed 80 shifts</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-400">৳350 - ৳450/hr</span>
              </div>

              {/* Step 3 (In Progress) */}
              <div className="p-3.5 rounded-2xl bg-blue-950/40 border border-blue-500/40 flex items-center justify-between ring-1 ring-blue-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                    ⚙️
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">Forklift Operator</span>
                      <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[9px] font-extrabold">In Progress (60%)</span>
                    </div>
                    <div className="text-[10px] text-blue-300">Practical test scheduled this Friday</div>
                  </div>
                </div>
                <span className="text-xs font-black text-blue-400">৳500 - ৳700/hr</span>
              </div>

              {/* Step 4 */}
              <div className="p-3.5 rounded-2xl bg-slate-900/30 border border-slate-800/80 flex items-center justify-between opacity-60">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center text-xs font-bold">
                    🔒
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-400">Shift Team Lead</div>
                    <div className="text-[10px] text-slate-500">Requires 200 completed shifts & Forklift</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-400">৳700 - ৳1,100/hr</span>
              </div>
            </div>
          </div>

          {/* Earnings Growth Projection (5 cols) */}
          <div className="md:col-span-5 p-6 rounded-3xl bg-[#0E1626] border border-slate-800 space-y-5 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Estimated Earnings Growth</h3>
              <p className="text-xs text-slate-400">Higher certifications directly unlock better wages.</p>

              {/* Bar Chart Simulation */}
              <div className="mt-6 flex items-end justify-between gap-4 h-36 px-4 pb-2 border-b border-slate-800">
                <div className="flex flex-col items-center gap-2 flex-1">
                  <span className="text-xs font-bold text-slate-300">৳380</span>
                  <div className="w-full bg-slate-700 rounded-t-xl h-16" />
                  <span className="text-[10px] text-slate-400">Current</span>
                </div>

                <div className="flex flex-col items-center gap-2 flex-1">
                  <span className="text-xs font-bold text-blue-400">৳600</span>
                  <div className="w-full bg-gradient-to-t from-blue-600 to-indigo-500 rounded-t-xl h-24 shadow-lg shadow-blue-500/20" />
                  <span className="text-[10px] text-blue-300 font-bold">After Forklift</span>
                </div>

                <div className="flex flex-col items-center gap-2 flex-1">
                  <span className="text-xs font-bold text-emerald-400">৳950</span>
                  <div className="w-full bg-gradient-to-t from-emerald-600 to-teal-500 rounded-t-xl h-32" />
                  <span className="text-[10px] text-emerald-300 font-bold">Team Lead</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#131E35] to-[#0B101E] border border-blue-500/20 space-y-2">
              <div className="text-xs font-bold text-white">Ready for your certification?</div>
              <p className="text-[11px] text-slate-400">
                Partner institutes in Dhaka offer subsidized practical training for registered SkillHub workers.
              </p>
              <button
                onClick={() => showToast("Subsidized Forklift & Heavy Logistics training catalog opened.")}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition"
              >
                Explore Training & Upskill →
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
