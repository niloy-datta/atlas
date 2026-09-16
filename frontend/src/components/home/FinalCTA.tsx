"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FinalCTA() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      setNotice("Please enter a service or shift requirement.");
      return;
    }
    router.push(`/services?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <section className="py-16 section-container" aria-label="Quick Requirement Matcher">
      <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-blue-950/60 via-[#0E1626] to-indigo-950/60 border border-blue-500/30 shadow-2xl">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/50 border border-blue-500/30 text-blue-300 text-xs font-bold mb-4">
            <span>✨</span>
            <span>Intelligent Matching Prototype • Dhaka Pilot</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Still not sure where to start? Just describe what you need.
          </h2>

          <p className="text-sm sm:text-base text-slate-300 mt-3 max-w-xl mx-auto leading-relaxed">
            Whether you need a 4-hour barista shift filled tonight or an emergency electrician for your home, type your need below to find verified pros.
          </p>

          {notice && (
            <div className="mt-4 p-3 rounded-xl bg-blue-950 border border-blue-700 text-xs text-blue-200 inline-block">
              {notice}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
            <input
              type="text"
              placeholder="e.g. Need an emergency plumber for a burst pipe in Dhanmondi..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 px-4 py-3 bg-[#070B14] border border-slate-700 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none shadow-inner"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg transition shrink-0"
            >
              Find Match →
            </button>
          </form>

          <div className="mt-4 text-xs text-slate-400">
            Active in Dhaka • Guaranteed payment escrow • Direct bKash and bank payouts
          </div>
        </div>
      </div>
    </section>
  );
}
