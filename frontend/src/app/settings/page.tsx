"use client";

import { useState } from "react";
import Link from "next/link";

export default function SettingsPage() {
  const [fullName, setFullName] = useState("Niloy Chandra Datta");
  const [email, setEmail] = useState("niloy.datta.dev@shlshl.com");
  const [phone, setPhone] = useState("+880 1303-669249");
  const [title, setTitle] = useState("Student & Freelance Worker");
  const [bio, setBio] = useState("Passionate about learning, working and building a better tomorrow.");
  const [country, setCountry] = useState("Bangladesh");
  const [city, setCity] = useState("Dhaka");
  const [allowLocation, setAllowLocation] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [jobTypes, setJobTypes] = useState({
    fullTime: true,
    partTime: true,
    freelance: true,
    contract: true,
    onDemand: true,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    showToast("Profile information and work preferences updated successfully!");
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-3 rounded-xl shadow-2xl shadow-blue-500/20 border border-blue-400/30 text-sm font-medium flex items-center gap-3 animate-fade-in">
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#0B1120]/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
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
            <Link href="/messages" className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition">
              Messages
            </Link>
            <Link href="/settings" className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 shadow-md shadow-blue-500/20 transition">
              Settings
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
              <div className="text-[10px] text-blue-400 font-semibold">Worker Profile</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex max-w-[1700px] w-full mx-auto">
        {/* Left Sidebar */}
        <aside className="hidden xl:flex flex-col w-64 border-r border-slate-800/80 bg-[#080D1A]/60 p-5 shrink-0 gap-6">
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
            <Link href="/skills" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:text-white hover:bg-slate-800/50 transition">
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
            <Link href="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white bg-blue-600/20 border border-blue-500/30 font-bold transition">
              <span>⚙️</span> Settings
            </Link>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-7 space-y-6 overflow-x-hidden">
          {/* Hero Banner from d854214c */}
          <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-[#0E172B] via-[#111C35] to-[#16122E] border border-slate-800 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">Settings</h1>
              <p className="text-sm text-slate-300 font-medium mt-1">Manage your account, preferences and privacy.</p>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-blue-300 italic">Same People. Bigger Opportunities.</div>
              <div className="text-[10px] text-slate-400 mt-0.5">— WORVO Account Security</div>
            </div>
          </div>

          {/* Settings Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
            {[
              { id: "profile", label: "Profile", icon: "👤" },
              { id: "account", label: "Account", icon: "🔒" },
              { id: "notifications", label: "Notifications", icon: "🔔" },
              { id: "privacy", label: "Privacy", icon: "🛡️" },
              { id: "payouts", label: "Payment & Payouts", icon: "💳" },
              { id: "preferences", label: "Preferences", icon: "⚙️" },
              { id: "security", label: "Security", icon: "🔑" },
            ].map((tab) => (
              <button
                key={tab.id}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  tab.id === "profile"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "bg-[#0E1626] text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* 2-Column Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Form (8 cols) */}
            <form onSubmit={handleSaveProfile} className="lg:col-span-8 space-y-6">
              {/* Profile Information Card */}
              <div className="p-6 rounded-2xl bg-[#0E1626] border border-slate-800 space-y-5 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">Profile Information</h3>
                    <p className="text-[11px] text-slate-400">Keep your profile up to date. A complete profile gets 3x more opportunities.</p>
                  </div>
                  <Link href="/workpass" className="text-xs font-bold text-blue-400 hover:underline flex items-center gap-1">
                    View Public Profile ↗
                  </Link>
                </div>

                {/* Avatar and Change Photo */}
                <div className="flex items-center gap-4 pt-2">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-3xl font-bold text-white shadow-xl shadow-blue-500/20">
                      👨‍💼
                    </div>
                    <button
                      type="button"
                      onClick={() => showToast("Photo uploader opened")}
                      className="absolute -bottom-1 -right-1 p-1.5 bg-blue-600 text-white rounded-lg text-xs shadow-md"
                    >
                      📷
                    </button>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Profile Picture</div>
                    <div className="text-[11px] text-slate-400">JPG, PNG (Max 5 MB)</div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-[#080D1A] border border-slate-700/70 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#080D1A] border border-slate-700/70 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Phone Number</label>
                    <div className="flex gap-2">
                      <span className="px-2.5 py-2 bg-[#080D1A] border border-slate-700/70 rounded-xl text-xs flex items-center gap-1 text-slate-300">
                        🇧🇩
                      </span>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="flex-1 bg-[#080D1A] border border-slate-700/70 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Professional Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-[#080D1A] border border-slate-700/70 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Short Bio</label>
                    <textarea
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full bg-[#080D1A] border border-slate-700/70 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Location & Work Preferences Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="p-5 rounded-2xl bg-[#0E1626] border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <span>📍</span>
                    <span>Location</span>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Country</label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full bg-[#080D1A] border border-slate-700/70 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option>Bangladesh</option>
                      <option>United Arab Emirates</option>
                      <option>United Kingdom</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">City</label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-[#080D1A] border border-slate-700/70 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option>Dhaka</option>
                      <option>Chittagong</option>
                      <option>Sylhet</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-slate-300 pt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowLocation}
                      onChange={(e) => setAllowLocation(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-blue-600"
                    />
                    <span>Allow employers to see my pilot location</span>
                  </label>
                </div>

                <div className="p-5 rounded-2xl bg-[#0E1626] border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <span>💼</span>
                    <span>Work Preferences</span>
                  </div>
                  <div className="text-[11px] text-slate-400">Select preferred engagement types:</div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {Object.entries(jobTypes).map(([key, val]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setJobTypes({ ...jobTypes, [key]: !val })}
                        className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition ${
                          val ? "bg-blue-600 text-white" : "bg-slate-900 text-slate-400"
                        }`}
                      >
                        ✓ {key.replace(/([A-Z])/g, " $1")}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/20 transition"
                >
                  Save Settings Changes
                </button>
              </div>
            </form>

            {/* Right Column: Profile Completion & Quick Actions (4 cols) */}
            <div className="lg:col-span-4 space-y-5">
              {/* Profile Completion 85% */}
              <div className="p-5 rounded-2xl bg-[#0E1626] border border-slate-800 space-y-3 shadow-lg">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>Profile Completion</span>
                  <span className="text-emerald-400">85%</span>
                </div>

                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: "85%" }} />
                </div>

                <div className="space-y-2 pt-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <span>✓</span> <span>Add profile photo</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <span>✓</span> <span>Add phone number</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <span>✓</span> <span>Add skills (5+)</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <span>✓</span> <span>Add at least one certificate</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <span>○</span> <span>Write verified bio details</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="p-5 rounded-2xl bg-[#0E1626] border border-slate-800 space-y-3 shadow-lg">
                <span className="text-xs font-bold text-white">Quick Actions</span>
                <div className="space-y-1.5 text-xs">
                  <Link href="/skills" className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-900 text-slate-300 hover:text-white transition">
                    <span>✏️ Edit Skills</span>
                    <span>›</span>
                  </Link>
                  <Link href="/skills" className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-900 text-slate-300 hover:text-white transition">
                    <span>📜 Manage Certificates</span>
                    <span>›</span>
                  </Link>
                  <Link href="/workpass" className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-900 text-slate-300 hover:text-white transition">
                    <span>🛡️ Update Work Passport</span>
                    <span>›</span>
                  </Link>
                  <Link href="/earnings" className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-900 text-slate-300 hover:text-white transition">
                    <span>💳 Update Payment Details</span>
                    <span>›</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
