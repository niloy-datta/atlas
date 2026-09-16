"use client";

export type UserIntent = "worker" | "employer" | "customer";

interface IntentSwitcherProps {
  activeIntent: UserIntent;
  onSelectIntent: (intent: UserIntent) => void;
}

export default function IntentSwitcher({ activeIntent, onSelectIntent }: IntentSwitcherProps) {
  return (
    <div
      className="inline-flex p-1.5 rounded-2xl bg-[#080E1C] border border-slate-800/90 shadow-inner mb-4 max-w-full overflow-x-auto"
      role="tablist"
      aria-label="Marketplace intent selection"
    >
      <button
        role="tab"
        id="tab-worker"
        aria-selected={activeIntent === "worker"}
        aria-controls="panel-search"
        onClick={() => onSelectIntent("worker")}
        className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
          activeIntent === "worker"
            ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400/40"
            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
        }`}
      >
        <span>💼</span>
        <span>Find Work</span>
      </button>

      <button
        role="tab"
        id="tab-employer"
        aria-selected={activeIntent === "employer"}
        aria-controls="panel-search"
        onClick={() => onSelectIntent("employer")}
        className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
          activeIntent === "employer"
            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400/40"
            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
        }`}
      >
        <span>👥</span>
        <span>Hire People</span>
      </button>

      <button
        role="tab"
        id="tab-customer"
        aria-selected={activeIntent === "customer"}
        aria-controls="panel-search"
        onClick={() => onSelectIntent("customer")}
        className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
          activeIntent === "customer"
            ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400/40"
            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
        }`}
      >
        <span>🏠</span>
        <span>Get Local Help</span>
      </button>
    </div>
  );
}
