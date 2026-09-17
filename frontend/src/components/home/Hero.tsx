"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import IntentSwitcher, { type UserIntent } from "./IntentSwitcher";
import WorkSearch from "./WorkSearch";
import PathwayCards from "./PathwayCards";

interface HeroProps {
  onNotice?: (msg: string) => void;
}

export default function Hero({ onNotice }: HeroProps) {
  const [activeIntent, setActiveIntent] = useState<UserIntent>("worker");

  return (
    <section className="hero-section" aria-label="Hero Introduction">
      <div className="hero-container">
        {/* Left Column: Heading, Intent Switcher, Search, Pathways */}
        <div className="hero-content">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/70 border border-blue-500/30 text-blue-300 text-xs font-bold mb-4">
            <span className="dot-green" aria-hidden="true" />
            <span>Dhaka Pilot • Verified Physical Workforce Platform</span>
          </div>

          <h1 className="hero-title">
            Work when{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
              you want.
            </span>
            <br />
            Hire when{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              you need.
            </span>
          </h1>

          <p className="hero-subtitle">
            Jobs, shifts and local tasks — real work, real people, real opportunities. On-demand hourly shifts and trusted local services across Dhaka with guaranteed escrow payouts.
          </p>

          {/* Interactive Intent Switcher & Search Bar */}
          <IntentSwitcher activeIntent={activeIntent} onSelectIntent={setActiveIntent} />
          <WorkSearch activeIntent={activeIntent} onNotice={onNotice} />

          {/* Three Direct Entry Pathway Cards */}
          <PathwayCards />

          {/* Pilot Indicators & Platform Stats */}
          <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-[#0B1426]/90 border border-slate-800/90 shadow-lg mt-5">
            <div className="text-center">
              <div className="text-base sm:text-xl font-black text-white">50K+</div>
              <div className="text-[11px] text-slate-400 font-medium">Active workers</div>
            </div>
            <div className="text-center border-x border-slate-800">
              <div className="text-base sm:text-xl font-black text-blue-400">12K+</div>
              <div className="text-[11px] text-slate-400 font-medium">Businesses</div>
            </div>
            <div className="text-center">
              <div className="text-base sm:text-xl font-black text-emerald-400">200K+</div>
              <div className="text-[11px] text-slate-400 font-medium">Shifts completed</div>
            </div>
          </div>
        </div>

        {/* Right Column: Hero Visual with Real Proof Cards from Master Mockup */}
        <div className="hero-visual hidden lg:block space-y-4">
          {/* Pro image & Live Opportunities Near You */}
          <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-[#0B1426]/90 p-4 shadow-2xl space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="text-sm font-extrabold text-white">Live Opportunities Near You</h3>
              </div>
              <Link href="/shifts" className="text-xs font-bold text-blue-400 hover:text-blue-300">
                See all →
              </Link>
            </div>

            {/* Opportunity Cards matching Master Design Screen 1 */}
            <div className="space-y-2.5">
              {/* Card 1: Waiter */}
              <div className="p-3 rounded-xl bg-[#070D1B] border border-slate-800/90 flex items-center justify-between gap-3 hover:border-blue-500/50 transition">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-500/30 flex items-center justify-center text-lg shrink-0">
                    ☕
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-white">Restaurant Waiter</h4>
                      <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 text-[9px] font-bold">
                        High Match
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">The Food Lounge • Today 6 PM - 11 PM</p>
                    <p className="text-[10px] text-slate-500">📍 1.2 km away • Dhanmondi</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-black text-emerald-400">৳450/hr</div>
                  <Link
                    href="/shifts/demo"
                    className="mt-1 inline-block px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold shadow-sm transition"
                  >
                    View
                  </Link>
                </div>
              </div>

              {/* Card 2: Warehouse Assistant */}
              <div className="p-3 rounded-xl bg-[#070D1B] border border-slate-800/90 flex items-center justify-between gap-3 hover:border-blue-500/50 transition">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-950/80 border border-blue-500/30 flex items-center justify-center text-lg shrink-0">
                    📦
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-white">Warehouse Assistant</h4>
                      <span className="px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 text-[9px] font-bold">
                        Verified
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">RapidLogistics • Tomorrow 8 AM - 4 PM</p>
                    <p className="text-[10px] text-slate-500">📍 2.8 km away • Mirpur</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-black text-emerald-400">৳380/hr</div>
                  <Link
                    href="/shifts/demo"
                    className="mt-1 inline-block px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold shadow-sm transition"
                  >
                    View
                  </Link>
                </div>
              </div>

              {/* Card 3: Delivery Rider */}
              <div className="p-3 rounded-xl bg-[#070D1B] border border-slate-800/90 flex items-center justify-between gap-3 hover:border-blue-500/50 transition">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-500/30 flex items-center justify-center text-lg shrink-0">
                    🛵
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-white">Delivery Rider</h4>
                      <span className="px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 text-[9px] font-bold">
                        Starts in 45m
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">CityEats • Flexible shifts</p>
                    <p className="text-[10px] text-slate-500">📍 0.9 km away • Gulshan</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-black text-emerald-400">৳420/hr</div>
                  <Link
                    href="/shifts/demo"
                    className="mt-1 inline-block px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold shadow-sm transition"
                  >
                    View
                  </Link>
                </div>
              </div>
            </div>

            {/* Work Near You Mini-Map Card */}
            <div className="p-3 rounded-xl bg-gradient-to-r from-blue-950/50 via-indigo-950/40 to-[#070D1B] border border-blue-500/30 flex items-center justify-between">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="text-xl">🗺️</span>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white">Work Near You in Dhaka</h4>
                  <p className="text-[11px] text-slate-400">Over 320 shifts active within 5 km</p>
                </div>
              </div>
              <Link
                href="/shifts"
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow transition"
              >
                Open Map
              </Link>
            </div>

            {/* Testimonial Quote Chip */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3">
              <Image
                src="/assets/daniel_morgan.jpg"
                alt="Rahim avatar"
                width={36}
                height={36}
                className="rounded-full ring-1 ring-blue-400 object-cover shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-slate-300 italic leading-snug">
                  &quot;SkillHub gave me flexible work and helped me support my family.&quot;
                </p>
                <p className="text-[10px] text-blue-400 font-semibold mt-0.5">
                  — Rahim, Verified Delivery Partner (Dhaka)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
