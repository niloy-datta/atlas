"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "../../components/navigation/Navbar";
import WorkspaceSidebar from "../../components/navigation/WorkspaceSidebar";

interface SkillItem {
  id: string;
  name: string;
  level: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  progress: number;
  icon: string;
  category: string;
}

interface CertificateItem {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate: string;
  status: "Verified" | "Pending" | "Expired";
}

const INITIAL_SKILLS: SkillItem[] = [
  { id: "s1", name: "Equipment Operation", level: "Advanced", progress: 90, icon: "🔧", category: "Technical" },
  { id: "s2", name: "Teamwork", level: "Advanced", progress: 88, icon: "👥", category: "Soft Skills" },
  { id: "s3", name: "Workplace Safety", level: "Intermediate", progress: 70, icon: "🛡️", category: "Safety" },
  { id: "s4", name: "Communication", level: "Intermediate", progress: 65, icon: "💬", category: "Soft Skills" },
  { id: "s5", name: "Forklift Operation", level: "Advanced", progress: 85, icon: "🚜", category: "Logistics" },
  { id: "s6", name: "First Aid & CPR", level: "Intermediate", progress: 60, icon: "🩹", category: "Healthcare" },
  { id: "s7", name: "Construction Basics", level: "Beginner", progress: 40, icon: "👷", category: "Construction" },
  { id: "s8", name: "Problem Solving", level: "Intermediate", progress: 68, icon: "🧠", category: "Soft Skills" },
];

const INITIAL_CERTS: CertificateItem[] = [
  { id: "c1", name: "Forklift Operator Certificate", issuer: "JLG Training Academy", issueDate: "12 Jan 2024", expiryDate: "12 Jan 2027", status: "Verified" },
  { id: "c2", name: "Workplace Safety (OSHA)", issuer: "OSHA Bangladesh Hub", issueDate: "05 Mar 2023", expiryDate: "05 Mar 2026", status: "Verified" },
  { id: "c3", name: "First Aid & Emergency CPR", issuer: "Red Cross Society", issueDate: "10 Feb 2024", expiryDate: "10 Feb 2026", status: "Pending" },
];

export default function SkillsAndCertificatesPage() {
  const [activeTab, setActiveTab] = useState<"skills" | "certs" | "recommended" | "training">("skills");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [skills, setSkills] = useState<SkillItem[]>(INITIAL_SKILLS);
  const [certificates] = useState<CertificateItem[]>(INITIAL_CERTS);
  const [showAddSkillModal, setShowAddSkillModal] = useState(false);
  const [newSkillName, setNewSkillName] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;
    const newSkill: SkillItem = {
      id: `s-${Date.now()}`,
      name: newSkillName.trim(),
      level: "Intermediate",
      progress: 70,
      icon: "✨",
      category: "General",
    };
    setSkills([...skills, newSkill]);
    setNewSkillName("");
    setShowAddSkillModal(false);
    showToast(`Skill "${newSkill.name}" added and queued for verification!`);
  };

  const filteredSkills = skills.filter((s) => {
    if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (categoryFilter !== "All" && s.category !== categoryFilter) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
      <Navbar />
      {/* Toast */}
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
            <Link href="/my-shifts" className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition">
              My Shifts
            </Link>
            <Link href="/skills" className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 shadow-md shadow-blue-500/20 transition">
              Skills & Certificates
            </Link>
            <Link href="/workpass" className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition">
              WorkPass
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-md">
              N
            </div>
            <div className="hidden sm:block text-left text-xs">
              <div className="font-semibold text-slate-200">Niloy Chandra Datta</div>
              <div className="text-[10px] text-blue-400 font-semibold">Frontline Worker</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex max-w-[1700px] w-full mx-auto">
        <WorkspaceSidebar />
        {/* Left Sidebar from a77c80ec and fac82dd9 */}
        <aside className="hidden">
          <nav className="flex flex-col gap-1 text-xs font-semibold text-slate-400">
            <Link href="/dashboard/worker" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:text-white hover:bg-slate-800/50 transition">
              <span>📊</span> Dashboard
            </Link>
            <Link href="/jobs" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:text-white hover:bg-slate-800/50 transition">
              <span>🔎</span> Find Work
            </Link>
            <Link href="/my-shifts" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:text-white hover:bg-slate-800/50 transition">
              <span>📅</span> My Shifts
            </Link>
            <Link href="/skills" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white bg-blue-600/20 border border-blue-500/30 font-bold transition">
              <span>⚙️</span> Skills & Certificates
            </Link>
            <Link href="/workpass" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:text-white hover:bg-slate-800/50 transition">
              <span>🛡️</span> Work Passport
            </Link>
            <Link href="/messages" className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:text-white hover:bg-slate-800/50 transition">
              <span className="flex items-center gap-3">
                <span>💬</span> Messages
              </span>
              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">3</span>
            </Link>
            <Link href="/earnings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:text-white hover:bg-slate-800/50 transition">
              <span>💰</span> Earnings
            </Link>
            <Link href="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:text-white hover:bg-slate-800/50 transition">
              <span>⚙️</span> Settings
            </Link>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-7 space-y-6 overflow-x-hidden">
          {/* Hero Banner */}
          <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-[#0E172B] via-[#111C35] to-[#16122E] border border-slate-800 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="inline-block px-3 py-1 rounded-full bg-blue-900/40 border border-blue-500/30 text-xs font-bold text-blue-300 mb-2">
                💼 SKILLS & CERTIFICATES
              </div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">
                Build Your Skills. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
                  Get Better Opportunities.
                </span>
              </h1>
              <p className="text-sm text-slate-300 font-medium mt-2">
                Showcase your skills and certificates to stand out in the workforce.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowAddSkillModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/20 transition flex items-center gap-1.5"
              >
                <span>➕</span> Add Skill
              </button>
              <button
                onClick={() => showToast("Upload certificate dialog opened")}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 transition flex items-center gap-1.5"
              >
                <span>📄</span> Add Certificate
              </button>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            {([
              { id: "skills", label: "My Skills" },
              { id: "certs", label: "My Certificates" },
              { id: "recommended", label: "Recommended" },
              { id: "training", label: "Learning & Training" },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "bg-[#0E1626] text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 2-Column Main Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Content (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              {/* My Skills Grid */}
              <div className="p-5 rounded-2xl bg-[#0E1626] border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">My Skills ({filteredSkills.length})</h3>
                    <p className="text-[11px] text-slate-400">Higher skill levels help you get more and higher-paying jobs.</p>
                  </div>
                  <button
                    onClick={() => setShowAddSkillModal(true)}
                    className="text-xs font-bold text-blue-400 hover:underline"
                  >
                    Manage Skills →
                  </button>
                </div>

                {/* Search & Category Pills */}
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search skills (e.g. forklift, cleaning, customer service...)"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#080D1A] border border-slate-700/70 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                    <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {["All", "Technical", "Logistics", "Healthcare", "Construction", "Soft Skills"].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                          categoryFilter === cat
                            ? "bg-blue-600 text-white"
                            : "bg-slate-900 text-slate-400 hover:text-white"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Skills Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {filteredSkills.map((s) => (
                    <div
                      key={s.id}
                      className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-blue-500/40 transition space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">{s.icon}</span>
                          <div>
                            <h4 className="text-xs font-bold text-white">{s.name}</h4>
                            <span className="text-[10px] text-blue-400 font-semibold">{s.level}</span>
                          </div>
                        </div>
                        <span className="text-xs font-black text-slate-300">{s.progress}%</span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full"
                          style={{ width: `${s.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* My Certificates Section */}
              <div className="p-5 rounded-2xl bg-[#0E1626] border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">My Certificates ({certificates.length})</h3>
                    <p className="text-[11px] text-slate-400">Verified credentials build trust with employers.</p>
                  </div>
                  <button
                    onClick={() => showToast("Certificate upload started")}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition"
                  >
                    + Upload Certificate
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {certificates.map((cert) => (
                    <div
                      key={cert.id}
                      className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xl">📜</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          cert.status === "Verified"
                            ? "bg-emerald-950 border border-emerald-500/30 text-emerald-300"
                            : "bg-amber-950 border border-amber-500/30 text-amber-300"
                        }`}>
                          {cert.status}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white line-clamp-1">{cert.name}</h4>
                      <p className="text-[10px] text-slate-400">{cert.issuer}</p>
                      <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/80">
                        Expires: {cert.expiryDate}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Skill Match & In-Demand (4 cols) */}
            <div className="lg:col-span-4 space-y-5">
              {/* Skill Match Score Meter from Screen 5 */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#121B32] via-[#0E1626] to-[#15112B] border border-blue-500/30 text-center space-y-3 shadow-xl">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>Skill Match Score</span>
                  <span className="text-blue-400">92%</span>
                </div>

                <div className="relative w-28 h-28 mx-auto rounded-full border-4 border-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <div className="text-center">
                    <div className="text-2xl font-black text-white">92%</div>
                    <div className="text-[9px] text-emerald-400 font-bold">Great Match!</div>
                  </div>
                </div>

                <p className="text-xs text-slate-300">
                  Your skills match 92% of available jobs in your preferred categories.
                </p>

                <Link
                  href="/jobs"
                  className="block w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition"
                >
                  View Matched Jobs →
                </Link>
              </div>

              {/* Top In-Demand Skills */}
              <div className="p-5 rounded-2xl bg-[#0E1626] border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>🔥 Top In-Demand Skills</span>
                  <span className="text-[11px] text-slate-400">Dhaka</span>
                </div>

                <div className="space-y-2 text-xs">
                  {[
                    { name: "Workplace Safety", pct: "96%" },
                    { name: "Equipment Operation", pct: "92%" },
                    { name: "Communication", pct: "88%" },
                    { name: "First Aid & CPR", pct: "85%" },
                    { name: "Teamwork", pct: "82%" },
                  ].map((sk) => (
                    <div key={sk.name} className="flex items-center justify-between text-slate-300">
                      <span>{sk.name}</span>
                      <span className="font-bold text-emerald-400">{sk.pct}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Training Courses */}
              <div className="p-5 rounded-2xl bg-[#0E1626] border border-slate-800 space-y-3">
                <div className="text-xs font-bold text-white">Recommended Courses</div>
                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <h5 className="text-xs font-bold text-white">Advanced Workplace Safety</h5>
                    <p className="text-[10px] text-slate-400">2h 30m • Certificate included</p>
                    <button onClick={() => showToast("Enrolled in Workplace Safety course")} className="text-[11px] font-bold text-blue-400 hover:underline">
                      Enroll Free →
                    </button>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <h5 className="text-xs font-bold text-white">Forklift Practical Training</h5>
                    <p className="text-[10px] text-slate-400">3h • In-person at Savar Hub</p>
                    <button onClick={() => showToast("Seat reserved for Savar Hub training")} className="text-[11px] font-bold text-blue-400 hover:underline">
                      Reserve Seat →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Add Skill Modal */}
      {showAddSkillModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#0E1626] border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Add New Skill</h3>
            <form onSubmit={handleAddSkill} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Skill Name</label>
                <input
                  type="text"
                  placeholder="e.g. Forklift Operation, Food Prep"
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  className="w-full bg-[#080D1A] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  autoFocus
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddSkillModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white"
                >
                  Add Skill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
