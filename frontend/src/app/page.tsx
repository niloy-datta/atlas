"use client";

import { useState } from "react";
import Navbar from "../components/navigation/Navbar";
import Footer from "../components/navigation/Footer";
import Hero from "../components/home/Hero";
import TrustBar from "../components/home/TrustBar";
import OpportunityPreview from "../components/home/OpportunityPreview";
import WorkPassPreview from "../components/home/WorkPassPreview";
import HowItWorks from "../components/home/HowItWorks";
import BusinessSection from "../components/home/BusinessSection";
import CareerGrowth from "../components/home/CareerGrowth";
import Testimonials from "../components/home/Testimonials";
import FinalCTA from "../components/home/FinalCTA";

export default function Home() {
  const [interactiveNotice, setInteractiveNotice] = useState<string | null>(null);

  const handleNotice = (msg: string) => {
    setInteractiveNotice(msg);
    setTimeout(() => {
      setInteractiveNotice((curr) => (curr === msg ? null : curr));
    }, 4500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#070B14] text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Global Navigation */}
      <Navbar />

      {/* Main Content Area */}
      <main id="main-content" className="flex-1 w-full">
        {/* Floating Global Notice */}
        {interactiveNotice && (
          <div
            className="fixed bottom-6 right-6 z-50 max-w-md p-4 rounded-2xl bg-blue-950/95 border border-blue-500/50 text-blue-100 text-xs shadow-2xl backdrop-blur-md flex items-start justify-between gap-3 animate-fade-in"
            role="status"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">📍</span>
              <span>{interactiveNotice}</span>
            </div>
            <button
              onClick={() => setInteractiveNotice(null)}
              className="text-blue-400 hover:text-white font-bold text-sm leading-none"
              aria-label="Dismiss notice"
            >
              ✕
            </button>
          </div>
        )}

        {/* Hero Section with Intent Switcher, Search & 3 Pathways */}
        <Hero onNotice={handleNotice} />

        {/* Pilot Trust & Verification Highlights */}
        <TrustBar />

        {/* Live Opportunities Feed (Dhaka Pilot) */}
        <OpportunityPreview />

        {/* WorkPass & Employer Trust Passports */}
        <WorkPassPreview />

        {/* How It Works (4 Steps) */}
        <HowItWorks />

        {/* For Businesses: Flexible Staffing & Ops Dashboard */}
        <BusinessSection />

        {/* Career Progression & SkillProof */}
        <CareerGrowth />

        {/* Real Pilot Testimonials */}
        <Testimonials />

        {/* AI / Intent Assistant Matcher */}
        <FinalCTA />
      </main>

      {/* Global Accessible Footer */}
      <Footer />
    </div>
  );
}
