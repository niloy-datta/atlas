export default function TrustBar() {
  return (
    <section className="border-y border-slate-800/80 bg-[#080D1A]/80 py-8 px-4 sm:px-8" aria-label="Pilot trust highlights">
      <div className="section-container space-y-6">
        {/* Honest Pilot Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-center">
          <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-900/40 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-blue-900/40 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-lg shrink-0">
              🛡️
            </div>
            <div>
              <div className="text-xl font-extrabold text-white">100% Verified</div>
              <div className="text-xs text-slate-400">NID & Trade Audit</div>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-900/40 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-emerald-900/40 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg shrink-0">
              ৳
            </div>
            <div>
              <div className="text-xl font-extrabold text-emerald-400">Escrow Protected</div>
              <div className="text-xs text-slate-400">Guaranteed hourly payout</div>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-900/40 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-purple-900/40 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold text-lg shrink-0">
              ⚡
            </div>
            <div>
              <div className="text-xl font-extrabold text-white">&lt; 15 Mins</div>
              <div className="text-xs text-slate-400">Rapid shift dispatch</div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-950/40 to-indigo-950/40 border border-blue-500/20 text-center sm:text-left">
            <div className="text-xs font-bold text-blue-300 italic leading-snug">
              &quot;Real People. Real Work. A Brighter Tomorrow.&quot;
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Dhaka Pilot Area • Dhanmondi, Gulshan, Banani, Uttara
            </div>
          </div>
        </div>

        {/* Pilot Partner Brands */}
        <div className="flex flex-col items-start gap-4 border-t border-slate-800/60 pt-5 text-xs font-bold text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-slate-500 text-[11px] uppercase tracking-wider">
            Supporting pilot employers & logistics:
          </span>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-slate-400 tracking-wider sm:gap-x-10">
            <span className="hover:text-white transition font-black text-sm text-pink-400">bKash</span>
            <span className="hover:text-white transition font-black text-sm text-red-400">Pathao</span>
            <span className="hover:text-white transition font-black text-sm text-amber-400">Daraz</span>
            <span className="hover:text-white transition font-black text-sm text-rose-400">Foodpanda</span>
            <span className="hover:text-white transition font-black text-sm text-emerald-400">Shwapno</span>
            <span className="hover:text-white transition font-black text-sm text-blue-400">City Group</span>
          </div>
        </div>
      </div>
    </section>
  );
}
