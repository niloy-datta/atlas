import Link from "next/link";

export default function PathwayCards() {
  return (
    <section aria-label="Explore marketplace entry pathways" className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-8">
        {/* Pathway 1: Workers */}
        <Link
          href="/shifts"
          className="p-4 rounded-2xl bg-[#0E1626]/90 hover:bg-[#131E33] border border-blue-900/40 hover:border-blue-500/60 transition-all duration-200 shadow-md group flex items-center gap-3.5"
        >
          <div className="w-11 h-11 rounded-xl bg-blue-950/80 border border-blue-500/30 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition">
            👤
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-white group-hover:text-blue-300 transition truncate">
                I Need Work
              </h3>
              <span className="px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 text-[9px] font-extrabold uppercase">
                Worker
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              Hourly shifts, jobs & fast payouts
            </p>
          </div>
          <span className="text-slate-500 group-hover:text-blue-400 text-lg transition font-bold" aria-hidden="true">
            ›
          </span>
        </Link>

        {/* Pathway 2: Employers */}
        <Link
          href="/hire"
          className="p-4 rounded-2xl bg-[#0E1626]/90 hover:bg-[#131E33] border border-indigo-900/40 hover:border-indigo-500/60 transition-all duration-200 shadow-md group flex items-center gap-3.5"
        >
          <div className="w-11 h-11 rounded-xl bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition">
            👥
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition truncate">
                I Need People
              </h3>
              <span className="px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 text-[9px] font-extrabold uppercase">
                Employer
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              Hire verified staff & fill shifts
            </p>
          </div>
          <span className="text-slate-500 group-hover:text-indigo-400 text-lg transition font-bold" aria-hidden="true">
            ›
          </span>
        </Link>

        {/* Pathway 3: Customers / Local Help */}
        <Link
          href="/services"
          className="p-4 rounded-2xl bg-[#0E1626]/90 hover:bg-[#131E33] border border-emerald-900/40 hover:border-emerald-500/60 transition-all duration-200 shadow-md group flex items-center gap-3.5"
        >
          <div className="w-11 h-11 rounded-xl bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition">
            🏠
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition truncate">
                I Need Help
              </h3>
              <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 text-[9px] font-extrabold uppercase">
                Tasks
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              Everyday home tasks & repairs
            </p>
          </div>
          <span className="text-slate-500 group-hover:text-emerald-400 text-lg transition font-bold" aria-hidden="true">
            ›
          </span>
        </Link>
      </div>
    </section>
  );
}
