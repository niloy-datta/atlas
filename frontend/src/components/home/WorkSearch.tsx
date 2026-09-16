"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { UserIntent } from "./IntentSwitcher";

interface WorkSearchProps {
  activeIntent: UserIntent;
  onNotice?: (msg: string) => void;
}

export default function WorkSearch({ activeIntent, onNotice }: WorkSearchProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedArea, setSelectedArea] = useState("Dhaka (All Zones)");

  const intentConfig = {
    worker: {
      placeholder: "Search shifts or jobs (e.g. Barista, Warehouse, Electrician)...",
      buttonText: "Find Shifts",
      buttonGradient: "from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500",
      destination: "/shifts",
      popularTags: ["Barista", "Electrician", "Warehouse", "Delivery", "Retail", "Chef Prep"],
    },
    employer: {
      placeholder: "What workforce do you need? (e.g. 4 Warehouse Helpers, Barista)...",
      buttonText: "Hire Staff",
      buttonGradient: "from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500",
      destination: "/hire",
      popularTags: ["Warehouse Crew", "Event Baristas", "Delivery Fleet", "Dishwashers", "Retail Cashiers"],
    },
    customer: {
      placeholder: "What home task do you need help with? (e.g. AC service, Water leak)...",
      buttonText: "Book Help",
      buttonGradient: "from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500",
      destination: "/services",
      popularTags: ["AC Jet Wash", "Water Leak Repair", "Deep Cleaning", "Electrician", "Handyman"],
    },
  }[activeIntent];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchTerm.trim();
    if (query) {
      if (onNotice) {
        onNotice(`Searching active pilot opportunities for "${query}" in ${selectedArea}.`);
      }
      router.push(`${intentConfig.destination}?q=${encodeURIComponent(query)}`);
    } else {
      router.push(intentConfig.destination);
    }
  };

  const handleTagClick = (tag: string) => {
    setSearchTerm(tag);
    if (onNotice) {
      onNotice(`Selected "${tag}". Click '${intentConfig.buttonText}' to explore matching Dhaka pilot opportunities.`);
    }
  };

  return (
    <div
      id="panel-search"
      role="tabpanel"
      aria-labelledby={`tab-${activeIntent}`}
      className="p-3 sm:p-4 rounded-2xl bg-[#0E1626]/90 border border-slate-800 shadow-xl backdrop-blur-md mb-6"
    >
      <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5">
        {/* Keyword Input */}
        <div className="flex-1 flex items-center bg-[#070B14] border border-slate-800/90 rounded-xl px-3.5 py-2.5 focus-within:border-blue-500 transition">
          <span className="text-slate-400 mr-2.5 text-base" aria-hidden="true">
            🔍
          </span>
          <input
            type="text"
            placeholder={intentConfig.placeholder}
            className="bg-transparent text-sm text-slate-100 outline-none w-full placeholder:text-slate-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search term"
          />
        </div>

        {/* Dhaka Pilot Location Selector */}
        <div className="flex items-center bg-[#070B14] border border-slate-800/90 rounded-xl px-3 py-2.5 sm:w-52 focus-within:border-blue-500 transition">
          <span className="text-slate-400 mr-2 text-sm" aria-hidden="true">
            📍
          </span>
          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="bg-transparent text-xs sm:text-sm text-slate-200 outline-none w-full cursor-pointer"
            aria-label="Filter by Dhaka area"
          >
            <option value="Dhaka (All Zones)" className="bg-[#070B14] text-slate-200">
              Dhaka (All Zones)
            </option>
            <option value="Dhanmondi" className="bg-[#070B14] text-slate-200">
              Dhanmondi
            </option>
            <option value="Gulshan & Banani" className="bg-[#070B14] text-slate-200">
              Gulshan & Banani
            </option>
            <option value="Uttara" className="bg-[#070B14] text-slate-200">
              Uttara
            </option>
            <option value="Mirpur" className="bg-[#070B14] text-slate-200">
              Mirpur
            </option>
            <option value="Mohakhali" className="bg-[#070B14] text-slate-200">
              Mohakhali
            </option>
          </select>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className={`px-6 py-2.5 bg-gradient-to-r ${intentConfig.buttonGradient} text-white font-bold text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-1.5 shrink-0`}
        >
          <span>{intentConfig.buttonText}</span>
          <span aria-hidden="true">→</span>
        </button>
      </form>

      {/* Popular Suggestions */}
      <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2.5 border-t border-slate-800/70 text-xs">
        <span className="font-semibold text-slate-500 mr-1">Popular in Dhaka:</span>
        {intentConfig.popularTags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => handleTagClick(tag)}
            className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition text-[11px] font-medium"
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}
