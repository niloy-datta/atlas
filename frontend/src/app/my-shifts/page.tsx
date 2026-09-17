"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "../../components/navigation/Navbar";
import WorkspaceSidebar from "../../components/navigation/WorkspaceSidebar";

interface MyShiftItem {
  id: string;
  dateBadge: { dayOfWeek: string; dateNum: string; month: string };
  badgeText?: string;
  role: string;
  organization: string;
  avatar: string;
  timeRange: string;
  duration: string;
  location: string;
  distance: string;
  hourlyRate: number;
  totalEstimated: number;
  tags: string[];
}

const UPCOMING_SHIFTS: MyShiftItem[] = [
  {
    id: "s1",
    dateBadge: { dayOfWeek: "TUE", dateNum: "16", month: "Sep" },
    badgeText: "Tomorrow",
    role: "Restaurant Waiter",
    organization: "The Food Lounge",
    avatar: "🍽️",
    timeRange: "6:00 PM – 11:00 PM",
    duration: "5h",
    location: "Dhanmondi, Dhaka",
    distance: "1.2 km away",
    hourlyRate: 450,
    totalEstimated: 2250,
    tags: ["Food & Beverage", "Uniform Provided", "Repeat Client"],
  },
  {
    id: "s2",
    dateBadge: { dayOfWeek: "WED", dateNum: "17", month: "Sep" },
    role: "Warehouse Assistant",
    organization: "RapidLogistics",
    avatar: "📦",
    timeRange: "10:00 PM – 6:00 AM",
    duration: "8h",
    location: "Savar EPZ, Dhaka",
    distance: "3.4 km away",
    hourlyRate: 380,
    totalEstimated: 3040,
    tags: ["Logistics", "Safety Gear Provided", "High Demand"],
  },
  {
    id: "s3",
    dateBadge: { dayOfWeek: "FRI", dateNum: "19", month: "Sep" },
    role: "Event Staff",
    organization: "Sky Events Gulshan",
    avatar: "🎪",
    timeRange: "4:00 PM – 10:00 PM",
    duration: "6h",
    location: "Gulshan-2, Dhaka",
    distance: "4.1 km away",
    hourlyRate: 400,
    totalEstimated: 2400,
    tags: ["Event", "Smart Casual", "New Client"],
  },
];

export default function MyShiftsPage() {
  const [activeTab, setActiveTab] = useState<"upcoming" | "completed" | "cancelled" | "earnings" | "calendar">("upcoming");
  const [checklist, setChecklist] = useState({
    uniform: true,
    early: true,
    idCard: true,
    details: false,
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
      <Navbar />
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-3 rounded-xl shadow-2xl shadow-blue-500/20 border border-blue-400/30 text-sm font-medium flex items-center gap-3 animate-fade-in">
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="hidden">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5">
            <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
              <circle cx="10" cy="16" r="6" fill="#3B82F6" />
              <circle cx="22" cy="10" r="4" fill="#8B5CF6" />
              <circle cx="22" cy="22" r="4" fill="#10B981" />
              <line x1="14.5" y1="13.5" x2="18.5" y2="11.5" stroke="#60A5FA" strokeWidth="2" />
              <line x1="14.5" y1="18.5" x2="18.5" y2="20.5" stroke="#34D399" strokeWidth="2" />
            </svg>
            <div>
              <span className="text-xl font-black tracking-tight text-white">WORVO</span>
              <span className="hidden sm:inline-block text-[10px] text-slate-400 block -mt-1 font-semibold uppercase tracking-wider">Work Your Way</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-2">
            <Link href="/" className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition">
              Home
            </Link>
            <Link href="/jobs" className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition">
              Find Work
            </Link>
            <Link href="/my-shifts" className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 shadow-md shadow-blue-500/20 transition">
              My Shifts
            </Link>
            <Link href="/dashboard/worker" className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition">
              Earnings
            </Link>
            <Link href="/workpass" className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition">
              WorkPass
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
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
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-md">
              N
            </div>
            <div className="hidden sm:block text-left text-xs">
              <div className="font-semibold text-slate-200">Niloy Chandra Datta</div>
              <div className="text-[10px] text-blue-400 font-semibold">Verified Worker</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex max-w-[1700px] w-full mx-auto">
        <WorkspaceSidebar />
        {/* Left Sidebar */}
        <aside className="hidden">
          <div className="p-3.5 rounded-2xl bg-[#0E1626] border border-slate-800 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-lg font-bold text-white shadow-md">
              👨‍💼
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200">Niloy Chandra Datta</div>
              <div className="text-[10px] text-blue-400 flex items-center gap-1 font-semibold">
                <span>✓</span> Verified Worker
              </div>
              <div className="text-[10px] text-yellow-400 font-bold mt-0.5">★ 4.8 (120 reviews)</div>
            </div>
          </div>

          <nav className="flex flex-col gap-1 text-xs font-semibold text-slate-400">
            <Link href="/dashboard/worker" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:text-white hover:bg-slate-800/50 transition">
              <span>📊</span> Overview
            </Link>
            <Link href="/my-shifts" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white bg-blue-600/20 border border-blue-500/30 font-bold transition">
              <span>📅</span> My Shifts
            </Link>
            <Link href="/jobs" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:text-white hover:bg-slate-800/50 transition">
              <span>🔎</span> Find Work
            </Link>
            <Link href="/dashboard/worker" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:text-white hover:bg-slate-800/50 transition">
              <span>💰</span> Earnings
            </Link>
            <Link href="/workpass" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:text-white hover:bg-slate-800/50 transition">
              <span>🛡️</span> Work Passport
            </Link>
            <a href="#messages" className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:text-white hover:bg-slate-800/50 transition">
              <span className="flex items-center gap-3">
                <span>💬</span> Messages
              </span>
              <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">3</span>
            </a>
            <a href="#settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:text-white hover:bg-slate-800/50 transition">
              <span>⚙️</span> Settings
            </a>
          </nav>

          {/* Level Up Banner */}
          <div className="mt-auto p-4 rounded-2xl bg-gradient-to-b from-[#131E35] to-[#0A101D] border border-blue-500/20 text-center">
            <div className="text-2xl mb-1">📈</div>
            <h4 className="text-xs font-bold text-white mb-1">Level Up Earn More</h4>
            <p className="text-[11px] text-slate-400 mb-3">Complete more verified shifts to unlock higher hourly tier rates.</p>
            <Link
              href="/workpass"
              className="block w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-blue-500/20"
            >
              View Progress →
            </Link>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-7 space-y-6 overflow-x-hidden">
          {/* Header Banner from my shift ui.png */}
          <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-[#0E172B] via-[#111C35] to-[#16122E] border border-slate-800 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="inline-block px-3 py-1 rounded-full bg-blue-900/40 border border-blue-500/30 text-xs font-bold text-blue-300 mb-2">
                ✨ Every Shift Builds a Brighter You
              </div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">My Shifts</h1>
              <p className="text-sm text-slate-300 font-medium mt-1">Your schedule. Your earnings. Your growth.</p>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#090F1C]/80 border border-slate-800">
              <div className="text-2xl">👋</div>
              <div>
                <div className="text-xs font-bold text-white">Good work, Niloy!</div>
                <div className="text-[11px] text-emerald-400 font-semibold">3 shifts this week • Keep it up!</div>
              </div>
            </div>
          </div>

          {/* Shift Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
            {([
              { key: "upcoming", label: "Upcoming", count: 3 },
              { key: "completed", label: "Completed", count: 18 },
              { key: "cancelled", label: "Cancelled", count: 1 },
              { key: "earnings", label: "Earnings", count: null },
              { key: "calendar", label: "Calendar", count: null },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  activeTab === tab.key
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "bg-[#0E1626] text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    activeTab === tab.key ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* 2-Column Main Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Upcoming Shifts List (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Upcoming Shifts</h3>
                  <p className="text-[11px] text-slate-400">Your confirmed shifts. Be ready and on time.</p>
                </div>
                <button
                  onClick={() => showToast("Calendar view synced with Google Calendar")}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
                >
                  📅 View Calendar
                </button>
              </div>

              {UPCOMING_SHIFTS.map((shift) => (
                <div
                  key={shift.id}
                  className="p-5 rounded-2xl bg-[#0E1626] border border-slate-800 hover:border-slate-700 transition shadow-lg space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-4">
                      {/* Date Badge */}
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-[#162138] to-[#0A0F1D] border border-blue-500/30 flex flex-col items-center justify-center text-center shrink-0 shadow-inner">
                        <span className="text-[10px] font-extrabold text-blue-400 tracking-wider uppercase">
                          {shift.dateBadge.dayOfWeek}
                        </span>
                        <span className="text-xl font-black text-white leading-tight">
                          {shift.dateBadge.dateNum}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {shift.dateBadge.month}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-white">{shift.role}</h4>
                          <span className="text-blue-400 text-xs font-bold" title="Verified Business">✓</span>
                          {shift.badgeText && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-950 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
                              {shift.badgeText}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">{shift.organization}</p>

                        <div className="flex items-center gap-3 text-xs text-slate-300 mt-2 font-medium">
                          <span>🕒 {shift.timeRange} ({shift.duration})</span>
                          <span>•</span>
                          <span>📍 {shift.location} ({shift.distance})</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-black text-emerald-400">
                        ৳{shift.hourlyRate}<span className="text-xs font-normal text-slate-400">/hr</span>
                      </div>
                      <div className="text-xs font-bold text-slate-300 mt-0.5">
                        ৳{shift.totalEstimated} estimated
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-1.5">
                      {shift.tags.map((tag) => (
                        <span key={tag} className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-[10px] text-slate-300">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <button
                      onClick={() => showToast(`Shift details for ${shift.role} opened. Navigation coordinates confirmed.`)}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition flex items-center gap-1.5"
                    >
                      View Details →
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Column: Calendar & Telemetry Map (5 cols) */}
            <div className="lg:col-span-5 space-y-5">
              {/* September 2026 Calendar Widget */}
              <div className="p-4 rounded-2xl bg-[#0E1626] border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">September 2026</span>
                  <div className="flex gap-1">
                    <button className="w-6 h-6 rounded bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white flex items-center justify-center">&lt;</button>
                    <button className="w-6 h-6 rounded bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white flex items-center justify-center">&gt;</button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-slate-500 font-bold">
                  <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-xs">
                  {/* Calendar day cells */}
                  {[30, 31, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30].map((d, i) => {
                    const isUpcoming = d === 16 || d === 17 || d === 19;
                    const isPast = d < 16 && d > 5;
                    return (
                      <div
                        key={i}
                        className={`py-2 rounded-lg font-medium transition cursor-pointer ${
                          isUpcoming
                            ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-500/30"
                            : isPast
                            ? "text-emerald-400 hover:bg-slate-800"
                            : "text-slate-400 hover:bg-slate-800"
                        }`}
                      >
                        {d}
                        {isUpcoming && <span className="block w-1 h-1 rounded-full bg-white mx-auto mt-0.5" />}
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-800">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" /> Your Shift</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Completed</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-600" /> Today</span>
                </div>
              </div>

              {/* Weekly Performance Stats */}
              <div className="p-4 rounded-2xl bg-[#0E1626] border border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-white">This Week</span>
                  <span className="text-[11px] text-blue-400 font-semibold cursor-pointer">View All</span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                    <div className="text-lg font-black text-blue-400">3</div>
                    <div className="text-[10px] text-slate-400">Upcoming</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                    <div className="text-lg font-black text-emerald-400">18</div>
                    <div className="text-[10px] text-slate-400">Completed</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                    <div className="text-lg font-black text-white">৳12,450</div>
                    <div className="text-[10px] text-slate-400">Total Earnings</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                    <div className="text-lg font-black text-purple-400">98%</div>
                    <div className="text-[10px] text-slate-400">Attendance</div>
                  </div>
                </div>
              </div>

              {/* Next Shift Location Mini Map Preview */}
              <div className="p-4 rounded-2xl bg-[#0E1626] border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <span>📍</span>
                    <span>Next Shift Location</span>
                  </div>
                  <span className="text-[11px] text-slate-400">1.2 km • 12 min</span>
                </div>

                {/* Road Path Simulation */}
                <div className="relative h-28 rounded-xl bg-[#090F1C] border border-slate-800 overflow-hidden flex items-center justify-center p-3">
                  <svg className="w-full h-full opacity-60" xmlns="http://www.w3.org/2000/svg">
                    <path d="M 30 70 Q 120 20 220 50 T 320 30" stroke="#8B5CF6" strokeWidth="3" strokeDasharray="5,5" fill="none" />
                  </svg>
                  <div className="absolute left-6 bottom-4 flex items-center gap-1 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
                    <span>You</span>
                  </div>
                  <div className="absolute right-6 top-4 flex items-center gap-1 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
                    <span>The Food Lounge</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-4">
                    <span>🚶 18 min</span>
                    <span>🚲 12 min</span>
                    <span>🚗 6 min</span>
                  </div>

                  <button
                    onClick={() => showToast("Opening Google Maps directions to The Food Lounge Dhanmondi...")}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition"
                  >
                    Get Directions
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section: Checklist + Reschedule + Promo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4">
            {/* Shift Checklist */}
            <div className="p-4 rounded-2xl bg-[#0E1626] border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <span>🧰</span>
                <span>Shift Checklist</span>
              </div>
              <p className="text-[11px] text-slate-400">Be prepared for your next shift.</p>

              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2.5 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.uniform}
                    onChange={(e) => setChecklist({ ...checklist, uniform: e.target.checked })}
                    className="rounded bg-slate-800 border-slate-700 text-blue-600"
                  />
                  <span>Uniform (black pants, white shirt)</span>
                </label>
                <label className="flex items-center gap-2.5 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.early}
                    onChange={(e) => setChecklist({ ...checklist, early: e.target.checked })}
                    className="rounded bg-slate-800 border-slate-700 text-blue-600"
                  />
                  <span>Arrive 10 minutes early</span>
                </label>
                <label className="flex items-center gap-2.5 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.idCard}
                    onChange={(e) => setChecklist({ ...checklist, idCard: e.target.checked })}
                    className="rounded bg-slate-800 border-slate-700 text-blue-600"
                  />
                  <span>Bring ID / WorkPass card</span>
                </label>
                <label className="flex items-center gap-2.5 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.details}
                    onChange={(e) => setChecklist({ ...checklist, details: e.target.checked })}
                    className="rounded bg-slate-800 border-slate-700 text-blue-600"
                  />
                  <span>Check shift supervisor instructions</span>
                </label>
              </div>
            </div>

            {/* Need to Reschedule? */}
            <div className="p-4 rounded-2xl bg-[#0E1626] border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <span>⏱️</span>
                <span>Need to Reschedule?</span>
              </div>
              <p className="text-[11px] text-slate-400">Plans changed? Let your client know in advance.</p>

              <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-[11px] text-amber-300">
                ⚠️ Please inform at least 12 hours before the shift to protect your WorkPass reliability rating.
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => showToast("Reschedule request submitted to supervisor")}
                  className="flex-1 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-xs font-bold text-slate-200"
                >
                  Request Change
                </button>
                <button
                  onClick={() => showToast("Shift cancellation ticket opened")}
                  className="flex-1 py-2 rounded-xl bg-red-950/50 border border-red-500/30 hover:bg-red-900/50 text-xs font-bold text-red-300"
                >
                  Cancel Shift
                </button>
              </div>
            </div>

            {/* More Shifts Higher Earnings Promo */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#121E38] via-[#0F162A] to-[#171432] border border-blue-500/30 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-white mb-1">
                  <span>🚀</span>
                  <span>More Shifts Higher Earnings</span>
                </div>
                <p className="text-xs text-slate-300">
                  Complete 5 more shifts with 95%+ ratings to level up to Senior Partner and unlock ৳550/hr shifts!
                </p>
              </div>

              <Link
                href="/jobs"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold text-center shadow-lg shadow-blue-500/20 transition"
              >
                Explore Opportunities →
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
