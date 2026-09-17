"use client";

import Link from "next/link";

interface SkillNode {
  id: string;
  title: string;
  payRange: string;
  status: "COMPLETED" | "IN_PROGRESS" | "LOCKED";
  progressPercent?: number;
  description: string;
}

const SKILL_NODES: SkillNode[] = [
  {
    id: "general-worker",
    title: "General Worker",
    payRange: "৳100 – ৳400/hr",
    status: "COMPLETED",
    progressPercent: 100,
    description: "Physical loading, sorting, and manual task foundations.",
  },
  {
    id: "picker-packer",
    title: "Picker / Packer",
    payRange: "৳450 – ৳700/hr",
    status: "COMPLETED",
    progressPercent: 100,
    description: "Barcode scanning, inventory pick precision, packaging speed.",
  },
  {
    id: "forklift-operator",
    title: "Forklift Operator",
    payRange: "৳750 – ৳900/hr",
    status: "IN_PROGRESS",
    progressPercent: 60,
    description: "OSHA certified pallet maneuvering, high-rack storage safety.",
  },
  {
    id: "team-lead",
    title: "Shift Team Lead",
    payRange: "৳900 – ৳1,100/hr",
    status: "LOCKED",
    progressPercent: 0,
    description: "Shift allocation, worker supervision, productivity monitoring.",
  },
  {
    id: "warehouse-supervisor",
    title: "Warehouse Supervisor",
    payRange: "৳1,200 – ৳1,600/hr",
    status: "LOCKED",
    progressPercent: 0,
    description: "Full site dispatch, safety audits, workforce operations.",
  },
];

export default function SkillTree() {
  return (
    <div className="space-y-6">
      {/* Skill Tree Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
            <span>🌿</span> Skill Tree & Career Ladder
          </h3>
          <p className="text-xs text-slate-400">
            Your verified path to higher pay rates, leadership roles, and premium engagements.
          </p>
        </div>
        <Link
          href="/skills"
          className="text-xs font-bold text-blue-400 hover:text-blue-300 transition flex items-center gap-1"
        >
          <span>Manage Skills</span>
          <span>→</span>
        </Link>
      </div>

      {/* Vertical Skill Tree Progression */}
      <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-emerald-500 before:via-blue-500 before:to-slate-700">
        {SKILL_NODES.map((node) => {
          const isCompleted = node.status === "COMPLETED";
          const isInProgress = node.status === "IN_PROGRESS";
          const isLocked = node.status === "LOCKED";

          return (
            <div
              key={node.id}
              className={`relative p-4 rounded-2xl border transition-all ${
                isCompleted
                  ? "bg-[#0B1528] border-emerald-500/40 shadow-sm"
                  : isInProgress
                  ? "bg-[#0E1B33] border-blue-500/80 shadow-lg shadow-blue-500/10 ring-1 ring-blue-400/30"
                  : "bg-[#080E1C]/60 border-slate-800/80 opacity-60"
              }`}
            >
              {/* Dot Icon on timeline */}
              <div
                className={`absolute -left-[27px] top-5 w-4 h-4 rounded-full border-2 flex items-center justify-center text-[8px] ${
                  isCompleted
                    ? "bg-emerald-500 border-emerald-300 text-white"
                    : isInProgress
                    ? "bg-blue-600 border-blue-300 ring-4 ring-blue-500/30 text-white"
                    : "bg-slate-800 border-slate-600 text-slate-500"
                }`}
              >
                {isCompleted ? "✓" : isInProgress ? "●" : "🔒"}
              </div>

              {/* Node Content */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">{node.title}</h4>
                    {isCompleted && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold">
                        Completed
                      </span>
                    )}
                    {isInProgress && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-950/80 text-blue-300 border border-blue-500/50 text-[10px] font-bold animate-pulse">
                        In Progress (60%)
                      </span>
                    )}
                    {isLocked && (
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-semibold">
                        Locked
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{node.description}</p>
                </div>

                {/* Pay rate badge */}
                <div className="shrink-0 text-right">
                  <span className="text-xs font-black text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                    {node.payRange}
                  </span>
                </div>
              </div>

              {/* Progress Bar for In-Progress item */}
              {isInProgress && (
                <div className="mt-3 pt-2 border-t border-slate-700/60">
                  <div className="flex items-center justify-between text-[11px] font-semibold mb-1">
                    <span className="text-slate-300">Forklift Practical Exam & Logbook</span>
                    <span className="text-blue-400">12 / 20 hours logged</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: "60%" }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Estimated Earnings Growth Box */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#0C152B] via-[#0F1C38] to-[#0A1324] border border-blue-500/30 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Projected Earning Growth</span>
            <h4 className="text-base font-extrabold text-white mt-0.5">
              Upskill. Earn more. A brighter future.
            </h4>
            <p className="text-xs text-slate-300 max-w-md mt-1">
              Workers who complete Forklift and Team Lead certifications increase their average hourly rate by up to 157%.
            </p>
          </div>

          {/* Rate Steps */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center min-w-[75px]">
              <span className="text-[10px] text-slate-400 block">Current</span>
              <span className="text-sm font-extrabold text-white">৳350/hr</span>
            </div>
            <span className="text-slate-600 font-bold">→</span>
            <div className="p-2.5 rounded-xl bg-blue-950/80 border border-blue-500/40 text-center min-w-[85px]">
              <span className="text-[10px] text-blue-300 block">After Forklift</span>
              <span className="text-sm font-extrabold text-blue-300">৳550/hr</span>
            </div>
            <span className="text-slate-600 font-bold">→</span>
            <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-center min-w-[80px]">
              <span className="text-[10px] text-emerald-300 block">Team Lead</span>
              <span className="text-sm font-extrabold text-emerald-400">৳900/hr</span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <span className="text-xs text-slate-400">Verified certification providers: OSHA BD & Technical Board</span>
          <Link
            href="/skills"
            className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md"
          >
            Explore Training →
          </Link>
        </div>
      </div>
    </div>
  );
}
