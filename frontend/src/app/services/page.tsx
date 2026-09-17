"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "../../components/navigation/Navbar";
import Footer from "../../components/navigation/Footer";
import WorkspaceSidebar from "../../components/navigation/WorkspaceSidebar";

interface ServiceCategory {
  id: string;
  name: string;
  icon: string;
  tagline: string;
  startingPrice: number;
  popularTasks: string[];
  badge?: string;
}

const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: "electrical",
    name: "Electrical & Wiring",
    icon: "⚡",
    tagline: "Short circuits, wiring, DB boards, appliance installs",
    startingPrice: 500,
    popularTasks: ["Switch & Socket Repair", "Ceiling Fan Installation", "MCB / Circuit Fix", "Full Room Wiring"],
    badge: "Most Requested",
  },
  {
    id: "plumbing",
    name: "Plumbing & Sanitary",
    icon: "🔧",
    tagline: "Pipe leaks, pump servicing, faucet and bathroom fittings",
    startingPrice: 450,
    popularTasks: ["Leak Diagnosis", "Water Pump Repair", "Basin & Commode Fit", "Drain Unclogging"],
    badge: "Emergency Available",
  },
  {
    id: "ac-repair",
    name: "AC & Refrigeration",
    icon: "❄️",
    tagline: "Master jet cleaning, gas charging, cooling restoration",
    startingPrice: 800,
    popularTasks: ["Jet Wash Cleaning", "Gas Refill (R410/R32)", "Compressor Check", "AC Installation"],
  },
  {
    id: "cleaning",
    name: "Deep Home Cleaning",
    icon: "🧹",
    tagline: "Kitchen deep degreasing, bathroom scrubbing, full flat polish",
    startingPrice: 1500,
    popularTasks: ["Kitchen Deep Clean", "Bathroom Sanitization", "Sofa & Carpet Wash", "Full Flat Handover"],
  },
  {
    id: "handyman",
    name: "Carpentry & Handyman",
    icon: "🛠️",
    tagline: "Furniture assembly, door lock repairs, wall mounting",
    startingPrice: 400,
    popularTasks: ["Drill & Wall Mount", "Door Lock Replacement", "Cabinet Hinge Fix", "Furniture Repair"],
  },
  {
    id: "moving",
    name: "Moving & Heavy Lifting",
    icon: "📦",
    tagline: "Reliable loading crews, furniture shifting, pickup trucks",
    startingPrice: 2000,
    popularTasks: ["Room to Room Shift", "Appliance Moving", "Full House Move", "Truck + 2 Helpers"],
  },
];

const VERIFIED_PROS = [
  {
    id: "pro-1",
    name: "Kabir Ahmed",
    trade: "Licensed Electrician",
    avatar: "⚡",
    rating: 4.9,
    jobsCount: 142,
    location: "Dhanmondi, Dhaka",
    hourlyRate: 500,
    workpassId: "WP-DH-9082",
    verifiedItems: ["NID Verified", "Trade Certified", "Police Audited"],
  },
  {
    id: "pro-2",
    name: "Sumon Mia",
    trade: "Master Plumber",
    avatar: "🔧",
    rating: 4.8,
    jobsCount: 98,
    location: "Gulshan & Banani",
    hourlyRate: 450,
    workpassId: "WP-DH-4419",
    verifiedItems: ["NID Verified", "Pipe Master", "Escrow Protected"],
  },
  {
    id: "pro-3",
    name: "Farida Begum",
    trade: "Deep Cleaning Supervisor",
    avatar: "🧹",
    rating: 5.0,
    jobsCount: 215,
    location: "Uttara, Dhaka",
    hourlyRate: 600,
    workpassId: "WP-DH-1102",
    verifiedItems: ["NID Verified", "Background Checked", "Top Rated"],
  },
];

export default function ServicesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("electrical");
  const [taskDescription, setTaskDescription] = useState("");
  const [preferredDate, setPreferredDate] = useState("Today");
  const [locationArea, setLocationArea] = useState("Dhanmondi");
  const [bookingStatus, setBookingStatus] = useState<string | null>(null);

  const activeCat = SERVICE_CATEGORIES.find((c) => c.id === selectedCategory) || SERVICE_CATEGORIES[0];

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskDescription.trim()) {
      setBookingStatus("Please describe what needs to be fixed or done.");
      return;
    }
    setBookingStatus(
      `Booking request recorded for "${activeCat.name}" in ${locationArea} (${preferredDate}). A verified pro will contact you via WorkPass Escrow.`
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#070B14] text-slate-100">
      <Navbar />

      <div className="flex flex-1 min-w-0">
        <WorkspaceSidebar />
        <main id="main-content" className="min-w-0 flex-1">
        {/* Hero Section */}
        <section className="py-12 sm:py-16 border-b border-slate-800/80 bg-gradient-to-b from-[#0A1020] to-[#070B14]">
          <div className="section-container">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-4">
                <span className="dot-green" />
                <span>Dhaka Pilot • 100% Verified Local Help</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Get trusted help for your home and everyday tasks.
              </h1>
              <p className="mt-4 text-base sm:text-lg text-slate-400 leading-relaxed">
                Book background-checked electricians, plumbers, cleaners, and handymen in Dhaka. Upfront BDT pricing, guaranteed escrow payment, and verified WorkPass credentials.
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t border-slate-800/60">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="text-xs text-slate-400 font-medium">Standard Response</div>
                <div className="text-xl font-black text-white mt-1">Under 30 mins</div>
                <div className="text-[11px] text-emerald-400 mt-0.5">Active pilot zones</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="text-xs text-slate-400 font-medium">Payment Protection</div>
                <div className="text-xl font-black text-emerald-400 mt-1">Escrow Hold</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Pay after inspection</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="text-xs text-slate-400 font-medium">Identity Audit</div>
                <div className="text-xl font-black text-white mt-1">NID & Police</div>
                <div className="text-[11px] text-blue-400 mt-0.5">WorkPass Verified</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="text-xs text-slate-400 font-medium">Starting Hourly</div>
                <div className="text-xl font-black text-white mt-1">From ৳400</div>
                <div className="text-[11px] text-slate-400 mt-0.5">No hidden callout fees</div>
              </div>
            </div>
          </div>
        </section>

        {/* Category Grid */}
        <section className="py-12 section-container">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Popular Home & Task Categories</h2>
              <p className="text-sm text-slate-400 mt-1">Select a trade to view transparent pilot pricing and request help.</p>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span>📍 Coverage:</span>
              <span className="font-semibold text-slate-200">Dhanmondi, Gulshan, Banani, Uttara, Mirpur</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SERVICE_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <div
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`p-6 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "bg-slate-900/90 border-blue-500 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500"
                      : "bg-[#0E1626] border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-3xl p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 inline-block">
                        {cat.icon}
                      </span>
                      {cat.badge && (
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-950 border border-blue-500/30 text-blue-300 text-[10px] font-bold">
                          {cat.badge}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-white">{cat.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{cat.tagline}</p>

                    <div className="mt-4 pt-3 border-t border-slate-800/70">
                      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        Common Tasks:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {cat.popularTasks.map((t) => (
                          <span key={t} className="px-2 py-0.5 rounded bg-slate-800/80 text-[11px] text-slate-300">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase">Starting From</div>
                      <div className="text-lg font-extrabold text-white">৳{cat.startingPrice}</div>
                    </div>
                    <button
                      type="button"
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                        isSelected
                          ? "bg-blue-600 text-white"
                          : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                      }`}
                    >
                      {isSelected ? "Selected" : "Select"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Task Booking & Scoping Form */}
        <section className="py-12 border-t border-slate-800/80 bg-[#0B1120]/60">
          <div className="section-container">
            <div className="max-w-3xl mx-auto p-6 sm:p-8 rounded-2xl bg-[#0E1626] border border-slate-800 shadow-xl">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
                <span className="text-2xl">{activeCat.icon}</span>
                <div>
                  <h3 className="text-xl font-bold text-white">Book {activeCat.name}</h3>
                  <p className="text-xs text-slate-400">Describe your requirement and get connected to verified Dhaka pros.</p>
                </div>
              </div>

              {bookingStatus && (
                <div className="mb-6 p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-sm flex items-start justify-between">
                  <div>
                    <div className="font-bold flex items-center gap-1.5">
                      <span>✓</span> Request Logged (Pilot Demo)
                    </div>
                    <p className="text-xs text-emerald-300/90 mt-1">{bookingStatus}</p>
                  </div>
                  <button onClick={() => setBookingStatus(null)} className="text-emerald-400 font-bold ml-4">
                    ✕
                  </button>
                </div>
              )}

              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <div>
                  <label htmlFor="taskDescription" className="block text-xs font-bold text-slate-300 mb-1.5">
                    What needs to be done? <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    id="taskDescription"
                    rows={3}
                    placeholder={`e.g. Need help with ${activeCat.popularTasks[0]} in our 2nd floor apartment. Water leaking or short circuit...`}
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    className="w-full bg-[#070B14] border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="locationArea" className="block text-xs font-bold text-slate-300 mb-1.5">
                      Dhaka Pilot Area
                    </label>
                    <select
                      id="locationArea"
                      value={locationArea}
                      onChange={(e) => setLocationArea(e.target.value)}
                      className="w-full bg-[#070B14] border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:border-blue-500 focus:outline-none"
                    >
                      <option value="Dhanmondi">Dhanmondi</option>
                      <option value="Gulshan">Gulshan 1 & 2</option>
                      <option value="Banani">Banani</option>
                      <option value="Uttara">Uttara (Sectors 1-14)</option>
                      <option value="Mirpur">Mirpur (1, 2, 10, 11)</option>
                      <option value="Mohakhali">Mohakhali / DOHS</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="preferredDate" className="block text-xs font-bold text-slate-300 mb-1.5">
                      When do you need it?
                    </label>
                    <select
                      id="preferredDate"
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      className="w-full bg-[#070B14] border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:border-blue-500 focus:outline-none"
                    >
                      <option value="Urgent (Within 2 Hours)">Urgent (Within 2 Hours)</option>
                      <option value="Today Evening">Today Evening</option>
                      <option value="Tomorrow Morning">Tomorrow Morning</option>
                      <option value="This Weekend">This Weekend</option>
                    </select>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <span>🛡️</span>
                    <span>Estimated Baseline: <strong>৳{activeCat.startingPrice}</strong> (Diagnostic & 1 hr service)</span>
                  </div>
                  <span className="text-emerald-400 font-semibold">Zero upfront payment</span>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/20 transition"
                >
                  Request Verified Pro →
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* Featured Dhaka Verified Pros */}
        <section className="py-12 section-container">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white tracking-tight">Verified Dhaka Professionals on Standby</h2>
            <p className="text-sm text-slate-400 mt-1">All pros undergo National ID verification, hands-on skill checks, and background review.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {VERIFIED_PROS.map((pro) => (
              <div key={pro.id} className="p-5 rounded-2xl bg-[#0E1626] border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-2xl border border-slate-700">
                        {pro.avatar}
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-white">{pro.name}</h4>
                        <p className="text-xs text-slate-400">{pro.trade}</p>
                      </div>
                    </div>
                    <span className="badge-verified">Verified</span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Rating</span>
                      <span className="text-amber-400 font-bold">★ {pro.rating} ({pro.jobsCount} jobs)</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Service Area</span>
                      <span className="text-slate-200">{pro.location}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Hourly Rate</span>
                      <span className="text-emerald-400 font-bold">৳{pro.hourlyRate}/hr</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>WorkPass ID</span>
                      <span className="font-mono text-[11px] text-blue-400">{pro.workpassId}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {pro.verifiedItems.map((item) => (
                      <span key={item} className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-300 font-medium">
                        ✓ {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800/80">
                  <Link
                    href={`/workpass/${pro.id}`}
                    className="w-full block text-center py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold transition"
                  >
                    View WorkPass Profile →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
        </main>
      </div>

      <Footer />
    </div>
  );
}
