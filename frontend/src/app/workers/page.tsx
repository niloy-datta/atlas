"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "../../components/navigation/Navbar";
import WorkspaceSidebar from "../../components/navigation/WorkspaceSidebar";

interface WorkerProfile {
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
  verified: boolean;
  age: number;
  languages: string[];
  experience: string;
  availability: string;
  workType: string;
  skills: string[];
  lat: number;
  lng: number;
  mapZone: string;
}

const WORKERS_DATA: WorkerProfile[] = [
  {
    id: "w1",
    name: "Rafiq Hasan",
    avatar: "👨‍💼",
    role: "Warehouse Worker",
    rating: 4.9,
    reviewsCount: 128,
    shiftsCompleted: 250,
    location: "Dhanmondi, Dhaka",
    distance: "2.1 km away",
    hourlyRate: 380,
    status: "Available Now",
    verified: true,
    age: 26,
    languages: ["Bengali", "English"],
    experience: "2+ years",
    availability: "Full-time / Part-time",
    workType: "Shift / Contract / Long-term",
    skills: ["Loading", "Inventory", "Teamwork", "Forklift Certified"],
    lat: 23.7465,
    lng: 90.376,
    mapZone: "Dhanmondi",
  },
  {
    id: "w2",
    name: "Nusrat Jahan",
    avatar: "👩‍🍳",
    role: "Cleaner & Facility Prep",
    rating: 4.8,
    reviewsCount: 96,
    shiftsCompleted: 150,
    location: "Uttara, Dhaka",
    distance: "4.3 km away",
    hourlyRate: 350,
    status: "Available Today",
    verified: true,
    age: 24,
    languages: ["Bengali"],
    experience: "3 years",
    availability: "Morning & Evening",
    workType: "Shift / Hourly",
    skills: ["Sanitization", "Deep Clean", "Time Management", "Eco-Chemicals"],
    lat: 23.8759,
    lng: 90.3795,
    mapZone: "Uttara",
  },
  {
    id: "w3",
    name: "Imran Hossain",
    avatar: "👨‍🍳",
    role: "Chef & Kitchen Maestro",
    rating: 4.9,
    reviewsCount: 210,
    shiftsCompleted: 300,
    location: "Gulshan, Dhaka",
    distance: "5.2 km away",
    hourlyRate: 600,
    status: "Available Today",
    verified: true,
    age: 31,
    languages: ["Bengali", "English", "Hindi"],
    experience: "5+ years",
    availability: "Flexible Shifts",
    workType: "Event / Restaurant Shift",
    skills: ["Continental & Desi", "Food Safety ISO", "Menu Engineering", "Team Lead"],
    lat: 23.7925,
    lng: 90.4078,
    mapZone: "Banani",
  },
  {
    id: "w4",
    name: "Tanvir Islam",
    avatar: "🏍️",
    role: "Delivery Rider",
    rating: 4.7,
    reviewsCount: 88,
    shiftsCompleted: 200,
    location: "Mirpur, Dhaka",
    distance: "3.8 km away",
    hourlyRate: 420,
    status: "Available Today",
    verified: true,
    age: 23,
    languages: ["Bengali", "Basic English"],
    experience: "2 years",
    availability: "Instant / Urgent Shifts",
    workType: "Express Delivery / Courier",
    skills: ["Motorcycle Valid License", "Route Optimization", "Cash Collection", "Punctual"],
    lat: 23.8223,
    lng: 90.3654,
    mapZone: "Mirpur",
  },
  {
    id: "w5",
    name: "Mahfuz Alam",
    avatar: "👷",
    role: "Construction Helper",
    rating: 4.6,
    reviewsCount: 74,
    shiftsCompleted: 120,
    location: "Keraniganj, Dhaka",
    distance: "7.1 km away",
    hourlyRate: 400,
    status: "Available Tomorrow",
    verified: true,
    age: 28,
    languages: ["Bengali"],
    experience: "4 years",
    availability: "Day Shifts (8 AM - 5 PM)",
    workType: "Contract / Site Labor",
    skills: ["Scaffolding", "Masonry Support", "Safety First", "Heavy Material Transit"],
    lat: 23.685,
    lng: 90.38,
    mapZone: "Keraniganj",
  },
];

export default function FindWorkersPage() {
  const [workers] = useState<WorkerProfile[]>(WORKERS_DATA);
  const [selectedWorker, setSelectedWorker] = useState<WorkerProfile>(WORKERS_DATA[0]);
  const [activeTab, setActiveTab] = useState<"overview" | "skills" | "experience" | "reviews">("overview");
  const [filterPill, setFilterPill] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const filteredWorkers = workers.filter((w) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!w.name.toLowerCase().includes(q) && !w.role.toLowerCase().includes(q) && !w.skills.some((s) => s.toLowerCase().includes(q))) {
        return false;
      }
    }
    if (filterPill === "Available Now" && w.status !== "Available Now") return false;
    if (filterPill === "Top Rated" && w.rating < 4.8) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
      <Navbar />
      {/* Notification Toast */}
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

          <nav className="hidden md:flex items-center gap-2">
            <Link href="/jobs" className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition">
              Find Work
            </Link>
            <Link href="/hire" className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition">
              Hire People
            </Link>
            <Link href="/workers" className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 shadow-md shadow-blue-500/20 transition">
              Find Workers
            </Link>
            <Link href="/shifts" className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition">
              Shifts
            </Link>
            <Link href="/workpass" className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition">
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

          <Link href="/hire" className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full text-xs font-bold shadow-md shadow-blue-500/20">
            Post a Shift →
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 min-w-0 w-full max-w-[1700px] mx-auto">
        <WorkspaceSidebar />
        <main className="min-w-0 flex-1 p-4 sm:p-7 space-y-6">
        {/* Hero Section from find work ui.png */}
        <div className="relative rounded-3xl p-6 sm:p-8 overflow-hidden bg-gradient-to-r from-[#0E172B] via-[#111C35] to-[#14122E] border border-slate-800 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-xl z-10">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight mb-2">
              Find the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">right workers.</span>
            </h1>
            <p className="text-sm text-slate-300 font-medium mb-5">
              Verified. Skilled. Ready to work across Dhaka pilot zones.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-2.5 rounded-xl bg-[#090F1C]/80 border border-slate-800">
                <div className="text-xs font-bold text-white">50K+</div>
                <div className="text-[10px] text-slate-400">Verified workers</div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#090F1C]/80 border border-slate-800">
                <div className="text-xs font-bold text-white">Instant Matching</div>
                <div className="text-[10px] text-slate-400">Under 15 minutes</div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#090F1C]/80 border border-slate-800">
                <div className="text-xs font-bold text-white">Flexible Hiring</div>
                <div className="text-[10px] text-slate-400">Hourly / Daily</div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#090F1C]/80 border border-slate-800">
                <div className="text-xs font-bold text-white">Trusted by 1,200+</div>
                <div className="text-[10px] text-slate-400">Dhaka businesses</div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 z-10 shrink-0">
            <Link
              href="/hire"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/20 transition flex items-center gap-2"
            >
              <span>➕</span> Post a Shift
            </Link>
            <button
              onClick={() => showToast("Build a Team wizard opened. Select roles to bundle your workforce.")}
              className="px-5 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 transition"
            >
              Build a Team
            </button>
          </div>
        </div>

        {/* Search & Filter bar */}
        <div className="p-4 rounded-2xl bg-[#0E1626] border border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search by skill, name or keyword (e.g. waiter, cleaner, driver...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#080D1A] border border-slate-700/70 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <span className="absolute left-3 top-3 text-slate-400 text-xs">🔍</span>
            </div>

            <div className="flex items-center gap-2">
              <select className="bg-[#080D1A] border border-slate-700/70 rounded-xl px-3 py-2.5 text-xs text-slate-300">
                <option>Dhaka, BD (All)</option>
                <option>Dhanmondi</option>
                <option>Gulshan / Banani</option>
                <option>Uttara</option>
                <option>Mirpur</option>
                <option>Savar</option>
              </select>

              <select className="bg-[#080D1A] border border-slate-700/70 rounded-xl px-3 py-2.5 text-xs text-slate-300">
                <option>All Categories</option>
                <option>Warehouse & Logistics</option>
                <option>Hospitality & Food</option>
                <option>Cleaning & Sanitization</option>
                <option>Delivery & Courier</option>
              </select>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
            <div className="flex flex-wrap gap-1.5">
              {["All", "Available Now", "Verified", "Top Rated", "Nearby", "Has Experience", "Background Checked"].map((pill) => (
                <button
                  key={pill}
                  onClick={() => setFilterPill(pill)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                    filterPill === pill
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                      : "bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700"
                  }`}
                >
                  {pill}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Sort by:</span>
              <span className="text-xs font-bold text-blue-400 cursor-pointer">Best Match ▼</span>
            </div>
          </div>
        </div>

        {/* 2-Column Map & Candidate View */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Worker Candidate Cards (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">
                {filteredWorkers.length * 248} workers found
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    viewMode === "list" ? "bg-slate-800 text-blue-400" : "text-slate-400"
                  }`}
                >
                  List
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    viewMode === "grid" ? "bg-slate-800 text-blue-400" : "text-slate-400"
                  }`}
                >
                  Grid
                </button>
              </div>
            </div>

            {filteredWorkers.map((worker) => {
              const isSelected = selectedWorker.id === worker.id;
              return (
                <div
                  key={worker.id}
                  onClick={() => setSelectedWorker(worker)}
                  className={`p-4 rounded-2xl bg-[#0E1626] border cursor-pointer transition-all ${
                    isSelected
                      ? "border-blue-500 ring-2 ring-blue-500/30 shadow-xl shadow-blue-500/10"
                      : "border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-700 flex items-center justify-center text-3xl shadow-inner">
                          {worker.avatar}
                        </div>
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#0E1626]" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white hover:text-blue-400 transition">
                            {worker.name}
                          </h4>
                          {worker.verified && (
                            <span className="text-blue-400 text-xs font-bold" title="Verified Worker">✓</span>
                          )}
                          <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-[10px] font-semibold">
                            {worker.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{worker.role}</p>

                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1.5">
                          <span className="text-yellow-400 font-bold">★ {worker.rating}</span>
                          <span>({worker.reviewsCount})</span>
                          <span>•</span>
                          <span>{worker.shiftsCompleted}+ shifts</span>
                          <span>•</span>
                          <span className="text-slate-300 font-medium">📍 {worker.location} ({worker.distance})</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-black text-white">
                        ৳{worker.hourlyRate}<span className="text-xs font-normal text-slate-400">/hr</span>
                      </div>
                      <div className="text-[10px] text-slate-400">Estimated min</div>
                    </div>
                  </div>

                  <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1.5">
                      {worker.skills.map((s) => (
                        <span key={s} className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] text-slate-300">
                          {s}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedWorker(worker);
                        }}
                        className="px-3.5 py-1.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition"
                      >
                        View Profile
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          showToast(`Direct hire inquiry initiated for ${worker.name}. Match request generated!`);
                        }}
                        className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition"
                      >
                        Hire Now
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Dark Dhaka Map + Candidate Detail Drawer (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Dark Neon Interactive Dhaka Map */}
            <div className="relative h-80 rounded-2xl overflow-hidden bg-[#0A0F1D] border border-slate-800 shadow-xl flex flex-col justify-between p-4">
              {/* Map background grid simulation */}
              <div className="absolute inset-0 bg-[radial-gradient(#1E293B_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

              {/* Glowing Roads Simulation */}
              <svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                <path d="M 50 150 Q 150 100 250 140 T 450 180" stroke="#3B82F6" strokeWidth="2" fill="none" />
                <path d="M 120 50 Q 180 180 200 300" stroke="#8B5CF6" strokeWidth="2" fill="none" />
                <path d="M 280 40 Q 240 180 320 320" stroke="#10B981" strokeWidth="1.5" fill="none" />
              </svg>

              {/* Map Controls */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex rounded-xl bg-slate-900/90 backdrop-blur-md p-1 border border-slate-800 text-xs">
                  <button className="px-3 py-1 rounded-lg bg-blue-600 text-white font-bold">Map View</button>
                  <button className="px-3 py-1 rounded-lg text-slate-400 hover:text-white">List View</button>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 text-[11px] text-slate-300">
                  <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                  <span>Search this area</span>
                </div>
              </div>

              {/* Dhaka Landmarks & Pins */}
              <div className="relative z-10 w-full h-full my-auto">
                {/* Savar Pin */}
                <div className="absolute left-[12%] top-[38%] flex flex-col items-center group cursor-pointer">
                  <div className="w-7 h-7 rounded-full bg-blue-600/90 border-2 border-white flex items-center justify-center text-xs shadow-lg shadow-blue-500/50">
                    👨
                  </div>
                  <span className="text-[10px] font-bold text-slate-300 bg-black/60 px-1.5 rounded mt-0.5">Savar</span>
                </div>

                {/* Uttara Pin */}
                <div className="absolute left-[70%] top-[15%] flex flex-col items-center group cursor-pointer">
                  <div className="w-7 h-7 rounded-full bg-purple-600/90 border-2 border-white flex items-center justify-center text-xs shadow-lg shadow-purple-500/50">
                    👩
                  </div>
                  <span className="text-[10px] font-bold text-slate-300 bg-black/60 px-1.5 rounded mt-0.5">Uttara</span>
                </div>

                {/* Mirpur Pin */}
                <div className="absolute left-[45%] top-[30%] flex flex-col items-center group cursor-pointer">
                  <div className="w-7 h-7 rounded-full bg-emerald-600/90 border-2 border-white flex items-center justify-center text-xs shadow-lg shadow-emerald-500/50">
                    🏍️
                  </div>
                  <span className="text-[10px] font-bold text-slate-300 bg-black/60 px-1.5 rounded mt-0.5">Mirpur</span>
                </div>

                {/* Center Pulse (YOU) */}
                <div className="absolute left-[52%] top-[52%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 animate-ping absolute inset-0" />
                    <div className="w-6 h-6 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center text-[9px] text-white font-black shadow-lg">
                      YOU
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-blue-300 mt-1">Dhaka Central</span>
                </div>

                {/* Selected Worker Callout on Map */}
                <div className="absolute left-[58%] top-[40%] flex flex-col items-start bg-[#0E1626]/95 border border-blue-500 rounded-xl p-2 shadow-2xl backdrop-blur-md animate-fade-in z-20">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{selectedWorker.avatar}</span>
                    <div>
                      <div className="text-[11px] font-bold text-white flex items-center gap-1">
                        {selectedWorker.name} <span className="text-blue-400">✓</span>
                      </div>
                      <div className="text-[9px] text-emerald-400 font-bold">
                        ৳{selectedWorker.hourlyRate}/hr • {selectedWorker.distance}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dhanmondi Pin */}
                <div className="absolute left-[40%] top-[65%] flex flex-col items-center group cursor-pointer">
                  <div className="w-7 h-7 rounded-full bg-amber-600/90 border-2 border-white flex items-center justify-center text-xs shadow-lg shadow-amber-500/50">
                    👨
                  </div>
                  <span className="text-[10px] font-bold text-slate-300 bg-black/60 px-1.5 rounded mt-0.5">Dhanmondi</span>
                </div>

                {/* Keraniganj Pin */}
                <div className="absolute left-[30%] top-[82%] flex flex-col items-center group cursor-pointer">
                  <div className="w-7 h-7 rounded-full bg-slate-700 border-2 border-white flex items-center justify-center text-xs shadow-lg">
                    👷
                  </div>
                  <span className="text-[10px] font-bold text-slate-300 bg-black/60 px-1.5 rounded mt-0.5">Keraniganj</span>
                </div>
              </div>

              {/* Map Zoom Controls */}
              <div className="relative z-10 flex items-center justify-between text-xs text-slate-400">
                <span className="bg-black/50 px-2 py-0.5 rounded text-[10px]">Real-time worker telemetry</span>
                <div className="flex gap-1">
                  <button className="w-6 h-6 rounded bg-slate-900 border border-slate-800 text-white font-bold flex items-center justify-center">+</button>
                  <button className="w-6 h-6 rounded bg-slate-900 border border-slate-800 text-white font-bold flex items-center justify-center">-</button>
                </div>
              </div>
            </div>

            {/* Candidate Detail Drawer underneath map */}
            <div className="p-5 rounded-2xl bg-[#0E1626] border border-slate-800 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-700 flex items-center justify-center text-2xl shadow-inner">
                    {selectedWorker.avatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-bold text-white">{selectedWorker.name}</h3>
                      <span className="text-blue-400 text-xs font-bold">✓</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/30 text-emerald-300 font-semibold">
                        {selectedWorker.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{selectedWorker.role}</p>
                    <div className="text-[11px] text-slate-400 mt-1">
                      ★ {selectedWorker.rating} ({selectedWorker.reviewsCount} reviews) • {selectedWorker.shiftsCompleted}+ shifts completed
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-base font-black text-white">৳{selectedWorker.hourlyRate}/hr</div>
                  <div className="text-[10px] text-slate-400">{selectedWorker.distance}</div>
                </div>
              </div>

              {/* Drawer Tabs */}
              <div className="flex border-b border-slate-800 text-xs font-semibold">
                {(["overview", "skills", "experience", "reviews"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2 text-center capitalize transition border-b-2 ${
                      activeTab === tab
                        ? "border-blue-500 text-white font-bold"
                        : "border-transparent text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              {activeTab === "overview" && (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block mb-0.5">Age</span>
                    <span className="font-bold text-white">{selectedWorker.age} years old</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block mb-0.5">Languages</span>
                    <span className="font-bold text-white">{selectedWorker.languages.join(", ")}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block mb-0.5">Experience</span>
                    <span className="font-bold text-white">{selectedWorker.experience}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block mb-0.5">Work Type</span>
                    <span className="font-bold text-white">{selectedWorker.workType}</span>
                  </div>
                </div>
              )}

              {activeTab === "skills" && (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {selectedWorker.skills.map((s) => (
                      <span key={s} className="px-3 py-1.5 rounded-xl bg-blue-900/30 border border-blue-500/30 text-xs font-semibold text-blue-300">
                        {s}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400 pt-2">
                    Verified through SkillHub WorkPass skill assessments and peer evaluations.
                  </p>
                </div>
              )}

              {activeTab === "experience" && (
                <div className="space-y-2 text-xs text-slate-300">
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                    <div className="font-bold text-white">RapidLogistics Hub (Dhanmondi)</div>
                    <div className="text-[11px] text-slate-400">120+ shifts • 99% punctuality score</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                    <div className="font-bold text-white">Daraz Fulfillment Centre</div>
                    <div className="text-[11px] text-slate-400">80+ shifts • Inventory audit & sorting</div>
                  </div>
                </div>
              )}

              {activeTab === "reviews" && (
                <div className="space-y-2 text-xs text-slate-300">
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                    <div className="flex items-center justify-between text-[11px] text-yellow-400 font-bold mb-1">
                      <span>★ 5.0 - Supervisor Karim</span>
                      <span className="text-slate-500">2 days ago</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      &quot;Extremely reliable and punctual. Finished warehouse loading 40 minutes ahead of target!&quot;
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => showToast(`Message thread opened with ${selectedWorker.name}`)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 transition flex items-center justify-center gap-2"
                >
                  <span>💬</span> Message
                </button>
                <button
                  onClick={() => showToast(`Direct shift offer sent to ${selectedWorker.name} at ৳${selectedWorker.hourlyRate}/hr!`)}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-bold text-white shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-2"
                >
                  <span>📅</span> Hire Now
                </button>
              </div>
            </div>
          </div>
        </div>
        </main>
      </div>
    </div>
  );
}
