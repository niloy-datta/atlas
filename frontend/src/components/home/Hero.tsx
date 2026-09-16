"use client";

import { useState } from "react";
import Image from "next/image";
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
            On-demand hourly shifts, verified job roles, and trusted local services across Dhaka. Real people, verified skills, and guaranteed escrow payouts.
          </p>

          {/* Interactive Intent Switcher & Search Bar */}
          <IntentSwitcher activeIntent={activeIntent} onSelectIntent={setActiveIntent} />
          <WorkSearch activeIntent={activeIntent} onNotice={onNotice} />

          {/* Three Direct Entry Pathway Cards */}
          <PathwayCards />

          {/* Pilot Indicators */}
          <div className="hero-indicators">
            <div className="indicator-item">
              <span className="dot-green" aria-hidden="true" />
              <span>
                Coverage: <strong>Dhaka Pilot (Dhanmondi, Gulshan, Uttara)</strong>
              </span>
            </div>
            <div className="indicator-item">
              <span className="dot-green" aria-hidden="true" />
              <span>
                Trust: <strong>100% NID & Trade Verified</strong>
              </span>
            </div>
            <div className="indicator-item">
              <span className="text-emerald-400 font-bold">৳</span>
              <span>
                Rates: <strong>Shifts starting from ৳350/hr</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Hero Visual with Real Proof Cards */}
        <div className="hero-visual hidden md:block">
          <div className="pro-image-container">
            <Image
              src="/assets/electrician_hero.jpg"
              alt="WORVO Verified Tradesperson at Work in Dhaka"
              width={600}
              height={500}
              priority
              className="hero-bg-img"
            />

            {/* Floating Card 1: Verified Worker Match */}
            <div className="floating-status-card top">
              <span className="status-card-label">Verified Worker</span>
              <div className="status-card-body">
                <Image
                  src="/assets/daniel_morgan.jpg"
                  alt="Rafiq Hasan avatar"
                  width={36}
                  height={36}
                  className="mini-avatar"
                />
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">Rafiq Hasan</h4>
                  <p className="text-[11px] text-slate-300">Barista • ৳450/hr</p>
                  <div className="text-[10px] text-amber-400 font-semibold mt-0.5">
                    ★ 4.9 <span className="text-slate-400 font-normal">• Dhanmondi</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Card 2: Shift Opportunity */}
            <div className="floating-status-card middle">
              <span className="status-card-label">Tomorrow 8 AM - 4 PM</span>
              <div className="status-card-body">
                <div className="shift-icon-box" aria-hidden="true">
                  📦
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">Warehouse Assistant</h4>
                  <p className="text-[11px] text-emerald-400 font-bold">৳380/hr • ৳3,040 total</p>
                  <p className="text-[10px] text-slate-400 truncate">RapidLogistics • Mirpur</p>
                </div>
              </div>
            </div>

            {/* Floating Card 3: WorkPass Escrow Protection */}
            <div className="floating-status-card bottom">
              <span className="status-card-label">ATLAS Protected Payout</span>
              <div className="status-card-body">
                <div className="shield-icon-box" aria-hidden="true">
                  🛡️
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white">WorkPass Escrow</h4>
                  <p className="text-[10px] text-slate-400">Guaranteed hourly payout</p>
                  <span className="badge-protected mt-1">Protected</span>
                </div>
              </div>
            </div>

            <div className="concept-note">WORVO Pilot Demo • Dhaka</div>
          </div>
        </div>
      </div>
    </section>
  );
}
