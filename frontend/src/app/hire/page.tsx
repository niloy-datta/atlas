"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "../../components/navigation/Navbar";
import WorkspaceSidebar from "../../components/navigation/WorkspaceSidebar";

interface WorkerCandidate {
  id: string;
  name: string;
  avatar: string;
  role: string;
  rating: number;
  reviewsCount: number;
  shiftsCompleted: number;
  location: string;
  distance: string;
  hourlyRate: number;
  status: "Available Now" | "Available Today" | "Available Tomorrow";
  bestMatch?: boolean;
  skills: string[];
}

const INITIAL_WORKERS: WorkerCandidate[] = [
  {
    id: "w1",
    name: "Rafiq Hasan",
    avatar: "👨‍💼",
    role: "Warehouse Worker",
    rating: 4.9,
    reviewsCount: 128,
    shiftsCompleted: 120,
    location: "Dhanmondi",
    distance: "2.1 km",
    hourlyRate: 380,
    status: "Available Now",
    bestMatch: true,
    skills: ["Loading", "Inventory", "Teamwork", "Safety"],
  },
  {
    id: "w2",
    name: "Nusrat Jahan",
    avatar: "👩‍🍳",
    role: "Cleaner & Kitchen Prep",
    rating: 4.8,
    reviewsCount: 96,
    shiftsCompleted: 80,
    location: "Uttara",
    distance: "4.3 km",
    hourlyRate: 350,
    status: "Available Today",
    skills: ["Cleaning", "Time Management", "Reliable", "Sanitization"],
  },
  {
    id: "w3",
    name: "Imran Hossain",
    avatar: "👨‍🍳",
    role: "Chef & Food Specialist",
    rating: 4.9,
    reviewsCount: 210,
    shiftsCompleted: 200,
    location: "Gulshan",
    distance: "5.2 km",
    hourlyRate: 600,
    status: "Available Today",
    skills: ["Cooking", "Food Safety", "Team Leadership", "Menu Prep"],
  },
  {
    id: "w4",
    name: "Tanvir Islam",
    avatar: "🏍️",
    role: "Delivery Rider",
    rating: 4.7,
    reviewsCount: 88,
    shiftsCompleted: 150,
    location: "Mirpur",
    distance: "3.8 km",
    hourlyRate: 420,
    status: "Available Now",
    skills: ["Driving", "Punctual", "Route Planning", "Customer Care"],
  },
  {
    id: "w5",
    name: "Mahfuz Alam",
    avatar: "👷",
    role: "Construction Helper",
    rating: 4.6,
    reviewsCount: 74,
    shiftsCompleted: 120,
    location: "Keraniganj",
    distance: "7.1 km",
    hourlyRate: 400,
    status: "Available Tomorrow",
    skills: ["Heavy Lifting", "Safety Protocol", "Power Tools", "Physical Stamina"],
  },
];

export default function HirePeoplePage() {
  const [workers] = useState<WorkerCandidate[]>(INITIAL_WORKERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedQuickFilter, setSelectedQuickFilter] = useState<string | null>("Available Now");
  const [invitedWorkers, setInvitedWorkers] = useState<Record<string, boolean>>({});
  const [activeShiftTab, setActiveShiftTab] = useState<"one-time" | "long-term">("one-time");
  const [shiftRole, setShiftRole] = useState("Warehouse Worker");
  const [workersCount, setWorkersCount] = useState(5);
  const [hourlyRate, setHourlyRate] = useState(400);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleInvite = (workerId: string, workerName: string) => {
    setInvitedWorkers((prev) => ({ ...prev, [workerId]: true }));
    showToast(`Invitation sent to ${workerName}! They have been notified on WhatsApp & SMS.`);
  };

  const handleAiPromptClick = () => {
    setShiftRole("Warehouse Worker");
    setWorkersCount(5);
    setHourlyRate(400);
    showToast("AI parsed: 5 Warehouse Workers in Savar from 6 PM to 12 AM (৳400/hr)");
  };

  const filteredWorkers = workers.filter((w) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesName = w.name.toLowerCase().includes(q);
      const matchesRole = w.role.toLowerCase().includes(q);
      const matchesSkills = w.skills.some((s) => s.toLowerCase().includes(q));
      if (!matchesName && !matchesRole && !matchesSkills) return false;
    }
    if (selectedQuickFilter === "Available Now" && w.status !== "Available Now") return false;
    if (selectedQuickFilter === "Top Rated" && w.rating < 4.8) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
      <Navbar />
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-3 rounded-xl shadow-2xl shadow-blue-500/20 border border-blue-400/30 text-sm font-medium flex items-center gap-3 animate-fade-in">
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="hidden">
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

          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            <Link href="/jobs" className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition">
              Find Work
            </Link>
            <Link href="/hire" className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 shadow-md shadow-blue-500/20 transition">
              Hire People
            </Link>
            <Link href="/shifts" className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition">
              Shifts
            </Link>
            <Link href="/dashboard/employer" className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition">
              For Business
            </Link>
            <Link href="/workpass" className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition">
              WorkPass
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative hidden lg:block w-72">
            <input
              type="text"
              placeholder="Search workers, skills or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0E1626] border border-slate-700/70 rounded-full pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
            <span className="absolute left-3 top-2 text-slate-400 text-xs">🔍</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0E1626] border border-slate-800 rounded-full text-xs font-medium text-slate-300">
            <span className="text-red-400">📍</span>
            <span>Dhaka, BD</span>
            <span className="text-slate-500 text-[10px]">▼</span>
          </div>

          <div className="relative p-2 bg-[#0E1626] border border-slate-800 rounded-full text-slate-300 hover:text-white cursor-pointer">
            <span>🔔</span>
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
              3
            </span>
          </div>

          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-blue-400">
              SHL
            </div>
            <div className="hidden sm:block text-left text-xs">
              <div className="font-semibold text-slate-200">SHL International</div>
              <div className="text-[10px] text-emerald-400 font-medium">Business Account ▼</div>
            </div>
          </div>
        </div>
      </header>

      {/* Workspace Area: Sidebar + Content */}
      <div className="flex-1 flex max-w-[1700px] w-full mx-auto">
        <WorkspaceSidebar />
        {/* Left Sidebar */}
        <aside className="hidden">
          <div className="p-3.5 rounded-xl bg-[#0E1626] border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-900/40 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
              SHL
            </div>
            <div>
              <div className="text-sm font-bold text-slate-200">SHL International</div>
              <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
                <span>✓</span> Verified Business
              </div>
            </div>
          </div>

          <nav className="flex flex-col gap-1 text-xs font-semibold text-slate-400">
            <Link href="/dashboard/employer" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:text-white hover:bg-slate-800/50 transition">
              <span>📊</span> Dashboard
            </Link>
            <Link href="/hire" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white bg-blue-600/20 border border-blue-500/30 font-bold transition">
              <span>👥</span> Hire People
            </Link>
            <Link href="#post-shift-form" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:text-white hover:bg-slate-800/50 transition">
              <span>➕</span> Post a Shift
            </Link>
            <Link href="/shifts" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:text-white hover:bg-slate-800/50 transition">
              <span>📅</span> My Shifts
            </Link>
            <Link href="/workers" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:text-white hover:bg-slate-800/50 transition">
              <span>🔎</span> Find Workers
            </Link>
            <a href="#saved" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:text-white hover:bg-slate-800/50 transition">
              <span>🔖</span> Saved Candidates
            </a>
            <a href="#messages" className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:text-white hover:bg-slate-800/50 transition">
              <span className="flex items-center gap-3">
                <span>💬</span> Messages
              </span>
              <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">3</span>
            </a>
            <a href="#payments" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:text-white hover:bg-slate-800/50 transition">
              <span>💳</span> Payments
            </a>
            <a href="#team" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:text-white hover:bg-slate-800/50 transition">
              <span>🏢</span> Team Management
            </a>
            <a href="#analytics" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:text-white hover:bg-slate-800/50 transition">
              <span>📈</span> Analytics
            </a>
            <a href="#settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:text-white hover:bg-slate-800/50 transition">
              <span>⚙️</span> Settings
            </a>
          </nav>

          {/* AI Banner */}
          <div className="mt-auto p-4 rounded-2xl bg-gradient-to-b from-[#121B30] to-[#0A101D] border border-blue-500/20 text-center">
            <div className="text-3xl mb-1">🤖</div>
            <h4 className="text-xs font-bold text-white mb-1">Need workers fast?</h4>
            <p className="text-[11px] text-slate-400 mb-3">Use AI to build and deploy your on-demand workforce.</p>
            <button
              onClick={handleAiPromptClick}
              className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-blue-500/20"
            >
              Try AI Hiring →
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-7 space-y-7 overflow-x-hidden">
          {/* Hero Banner from Design */}
          <div className="relative rounded-3xl p-6 sm:p-9 overflow-hidden bg-gradient-to-r from-[#0E172B] via-[#111C35] to-[#15132B] border border-slate-800/80 shadow-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-2xl">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight mb-3">
                Hire the right people. <br />
                Build a <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">stronger team.</span>
              </h1>
              <p className="text-sm text-slate-300 font-medium mb-6">
                Post a shift, find verified workers, and get the job done — faster.
              </p>

              {/* Badges / Value Props */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#090F1C]/80 border border-slate-800">
                  <span className="text-lg">🛡️</span>
                  <div className="text-left">
                    <div className="text-[11px] font-bold text-white">Verified Workers</div>
                    <div className="text-[10px] text-slate-400">ID & skill checked</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#090F1C]/80 border border-slate-800">
                  <span className="text-lg">⚡</span>
                  <div className="text-left">
                    <div className="text-[11px] font-bold text-white">AI Matching</div>
                    <div className="text-[10px] text-slate-400">Best candidates</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#090F1C]/80 border border-slate-800">
                  <span className="text-lg">⏱️</span>
                  <div className="text-left">
                    <div className="text-[11px] font-bold text-white">Flexible Hiring</div>
                    <div className="text-[10px] text-slate-400">Hours or long-term</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#090F1C]/80 border border-slate-800">
                  <span className="text-lg">🇧🇩</span>
                  <div className="text-left">
                    <div className="text-[11px] font-bold text-white">Trusted by 12K+</div>
                    <div className="text-[10px] text-slate-400">Dhaka & Savar</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4-Step Process Bar & Hiring Impact Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* 4 Steps */}
            <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#0E1626] border border-blue-500/30 flex items-center gap-3 shadow-md">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                  1
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Post a Shift</div>
                  <div className="text-[10px] text-slate-400">Tell us what you need</div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#0E1626] border border-slate-800 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center shrink-0">
                  2
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200">Review Matches</div>
                  <div className="text-[10px] text-slate-400">Check profiles & ratings</div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#0E1626] border border-slate-800 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center shrink-0">
                  3
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200">Select & Hire</div>
                  <div className="text-[10px] text-slate-400">Confirm your team</div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#0E1626] border border-slate-800 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center shrink-0">
                  4
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200">Manage & Track</div>
                  <div className="text-[10px] text-slate-400">Stay in control</div>
                </div>
              </div>
            </div>

            {/* Impact Widget */}
            <div className="p-3.5 rounded-2xl bg-[#0E1626] border border-slate-800 flex items-center justify-between">
              <div className="text-center">
                <div className="text-base font-black text-blue-400">42</div>
                <div className="text-[10px] text-slate-400">Shifts</div>
              </div>
              <div className="text-center">
                <div className="text-base font-black text-emerald-400">186</div>
                <div className="text-[10px] text-slate-400">Workers</div>
              </div>
              <div className="text-center">
                <div className="text-base font-black text-yellow-400">★ 4.8</div>
                <div className="text-[10px] text-slate-400">Avg Rating</div>
              </div>
              <div className="text-center">
                <div className="text-base font-black text-purple-400">96%</div>
                <div className="text-[10px] text-slate-400">Show-up</div>
              </div>
            </div>
          </div>

          {/* 3-Column Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Filter Column (3 cols) */}
            <div className="lg:col-span-3 space-y-5">
              <div className="p-4 rounded-2xl bg-[#0E1626] border border-slate-800 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-xs font-bold text-white">Active Filters</span>
                  <button
                    onClick={() => {
                      setSelectedQuickFilter(null);
                      setSearchQuery("");
                    }}
                    className="text-[11px] text-blue-400 hover:underline"
                  >
                    Clear All
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2.5 py-1 rounded-full bg-blue-900/40 border border-blue-500/30 text-[11px] text-blue-300 flex items-center gap-1">
                    Dhaka, BD <span className="cursor-pointer">×</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-slate-800 text-[11px] text-slate-300 flex items-center gap-1">
                    Available Today <span className="cursor-pointer">×</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-slate-800 text-[11px] text-slate-300 flex items-center gap-1">
                    ৳300 - ৳600/hr <span className="cursor-pointer">×</span>
                  </span>
                </div>

                {/* Quick Filters */}
                <div className="pt-2 space-y-2">
                  <div className="text-xs font-bold text-slate-300 mb-2">Quick Filters</div>
                  {[
                    { label: "Available Now", count: 124 },
                    { label: "Verified Workers", count: 892 },
                    { label: "Top Rated", count: 476 },
                    { label: "Nearby (Within 5 km)", count: 620 },
                    { label: "Worked With You", count: 98 },
                  ].map((qf) => (
                    <button
                      key={qf.label}
                      onClick={() => setSelectedQuickFilter(selectedQuickFilter === qf.label ? null : qf.label)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition ${
                        selectedQuickFilter === qf.label
                          ? "bg-blue-600/20 border border-blue-500 text-white font-semibold"
                          : "bg-slate-900/40 hover:bg-slate-800/60 text-slate-300"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{selectedQuickFilter === qf.label ? "✓" : "○"}</span>
                        <span>{qf.label}</span>
                      </span>
                      <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded-full">
                        {qf.count}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Skills Checkboxes */}
                <div className="pt-3 border-t border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-slate-300 mb-2">Required Skills</div>
                  {[
                    { name: "Loading & Unloading", count: 320 },
                    { name: "Inventory Management", count: 284 },
                    { name: "Forklift Operation", count: 120 },
                    { name: "Packaging & Sorting", count: 410 },
                    { name: "Food Handling / Cooking", count: 190 },
                  ].map((sk) => (
                    <label key={sk.name} className="flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" className="rounded bg-slate-800 border-slate-700 text-blue-600" />
                        <span>{sk.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">{sk.count}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Middle Candidate List Column (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {filteredWorkers.length} available workers
                  </h3>
                  <p className="text-[11px] text-slate-400">Verified and ready for immediate shifts in Dhaka</p>
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <span>Sort by:</span>
                  <span className="font-bold text-blue-400 cursor-pointer">Best Match ▼</span>
                </div>
              </div>

              {filteredWorkers.map((worker) => (
                <div
                  key={worker.id}
                  className={`relative p-4 rounded-2xl bg-[#0E1626] border transition-all hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 ${
                    worker.bestMatch ? "border-blue-500/60 ring-1 ring-blue-500/30" : "border-slate-800"
                  }`}
                >
                  {worker.bestMatch && (
                    <span className="absolute -top-2.5 left-4 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-bold shadow-md">
                      ★ Best Match
                    </span>
                  )}

                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-700 flex items-center justify-center text-2xl shadow-inner">
                        {worker.avatar}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-bold text-white">{worker.name}</h4>
                          <span className="text-blue-400 text-xs" title="Verified Worker">✓</span>
                        </div>
                        <p className="text-xs text-slate-400">{worker.role}</p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                          <span className="text-yellow-400 font-bold">★ {worker.rating}</span>
                          <span>({worker.reviewsCount})</span>
                          <span>•</span>
                          <span>{worker.shiftsCompleted}+ shifts</span>
                          <span>•</span>
                          <span>{worker.location} ({worker.distance})</span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <div className="text-base font-black text-white">৳{worker.hourlyRate}<span className="text-xs font-normal text-slate-400">/hr</span></div>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        worker.status === "Available Now"
                          ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500/30"
                          : "bg-blue-950/80 text-blue-300 border border-blue-500/30"
                      }`}>
                        {worker.status}
                      </span>
                    </div>
                  </div>

                  {/* Tags & Action */}
                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1">
                      {worker.skills.map((skill) => (
                        <span key={skill} className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] text-slate-300">
                          {skill}
                        </span>
                      ))}
                    </div>

                    <button
                      onClick={() => handleInvite(worker.id, worker.name)}
                      disabled={invitedWorkers[worker.id]}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0 ${
                        invitedWorkers[worker.id]
                          ? "bg-emerald-900/50 border border-emerald-500/40 text-emerald-300 cursor-default"
                          : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-600/20"
                      }`}
                    >
                      {invitedWorkers[worker.id] ? "✓ Invited" : "Invite →"}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Form & AI Assistant Column (4 cols) */}
            <div className="lg:col-span-4 space-y-5">
              {/* AI Hiring Assistant card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#131B33] via-[#0F162A] to-[#181530] border border-blue-500/30 shadow-lg space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <span className="p-1.5 rounded-lg bg-blue-600 text-white text-xs">✨</span>
                  <span>AI Hiring Assistant</span>
                </div>
                <p className="text-xs text-slate-300">
                  Describe your shift need, and SkillHub will auto-fill your job parameters and match top-scoring candidates.
                </p>

                <div
                  onClick={handleAiPromptClick}
                  className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/60 text-xs text-slate-300 cursor-pointer hover:border-blue-400 hover:bg-slate-900 transition flex items-center justify-between group"
                >
                  <span className="min-w-0 flex-1 italic">&quot;I need 5 warehouse workers tomorrow from 6 PM to 12 AM in Savar&quot;</span>
                  <span className="text-blue-400 font-bold group-hover:translate-x-0.5 transition-transform">↗</span>
                </div>
              </div>

              {/* Post a New Shift Form Card */}
              <div id="post-shift-form" className="p-5 rounded-2xl bg-[#0E1626] border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">Post a New Shift</h3>
                  <span className="text-[11px] text-slate-400">Fast Match</span>
                </div>

                <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setActiveShiftTab("one-time")}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                      activeShiftTab === "one-time" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    One-time Shift
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveShiftTab("long-term")}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                      activeShiftTab === "long-term" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Long-term Job
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Job Title</label>
                    <input
                      type="text"
                      value={shiftRole}
                      onChange={(e) => setShiftRole(e.target.value)}
                      placeholder="e.g. Warehouse Worker, Cleaner, Waiter"
                      className="w-full bg-[#080D1A] border border-slate-700/70 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Workers Needed</label>
                      <div className="flex items-center rounded-xl bg-[#080D1A] border border-slate-700/70 p-1">
                        <button
                          type="button"
                          onClick={() => setWorkersCount(Math.max(1, workersCount - 1))}
                          className="w-7 h-7 rounded-lg bg-slate-800 text-white text-xs font-bold hover:bg-slate-700"
                        >
                          -
                        </button>
                        <span className="flex-1 text-center text-xs font-bold text-white">{workersCount}</span>
                        <button
                          type="button"
                          onClick={() => setWorkersCount(workersCount + 1)}
                          className="w-7 h-7 rounded-lg bg-slate-800 text-white text-xs font-bold hover:bg-slate-700"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Hourly Rate (BDT)</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-bold">৳</span>
                        <input
                          type="number"
                          value={hourlyRate}
                          onChange={(e) => setHourlyRate(Number(e.target.value))}
                          className="w-full bg-[#080D1A] border border-slate-700/70 rounded-xl pl-6 pr-2 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Date & Pilot Zone</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        defaultValue="2026-09-16"
                        className="w-full bg-[#080D1A] border border-slate-700/70 rounded-xl px-2.5 py-1.5 text-xs text-slate-200"
                      />
                      <select className="w-full bg-[#080D1A] border border-slate-700/70 rounded-xl px-2 py-1.5 text-xs text-slate-200">
                        <option>Dhanmondi, Dhaka</option>
                        <option>Gulshan, Dhaka</option>
                        <option>Uttara, Dhaka</option>
                        <option>Savar EPZ, Dhaka</option>
                        <option>Mirpur, Dhaka</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => showToast(`Shift requirement posted for ${workersCount} ${shiftRole}s at ৳${hourlyRate}/hr! Candidates notified.`)}
                    className="w-full py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/25 transition flex items-center justify-center gap-2"
                  >
                    <span>✨</span> Find Best Matches
                  </button>
                </div>
              </div>

              {/* Recent Posts summary */}
              <div className="p-4 rounded-2xl bg-[#0E1626] border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>Recent Posts</span>
                  <Link href="/dashboard/employer" className="text-blue-400 hover:underline text-[11px]">View All</Link>
                </div>

                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-200">Warehouse Worker</div>
                      <div className="text-[10px] text-slate-400">5 workers • Today</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                      Active
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-200">Cleaner</div>
                      <div className="text-[10px] text-slate-400">3 workers • Tomorrow</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                      Active
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-200">Delivery Rider</div>
                      <div className="text-[10px] text-slate-400">2 workers • 18 Sep</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-blue-950 border border-blue-500/30 text-blue-300 text-[10px] font-bold">
                      Scheduled
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
