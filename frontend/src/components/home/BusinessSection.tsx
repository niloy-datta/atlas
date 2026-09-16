import Link from "next/link";

export default function BusinessSection() {
  return (
    <section className="business-section" id="business" aria-label="WORVO for Businesses">
      <div className="section-container">
        <div className="business-grid">
          {/* Left: Info & Benefits */}
          <div className="business-info">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 text-xs font-bold mb-4">
              <span>🏢</span>
              <span>For Businesses & Employers</span>
            </span>

            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight mb-4">
              Run a reliable, flexible workforce in Dhaka.
            </h2>

            <p className="text-sm sm:text-base text-slate-400 mb-6 leading-relaxed">
              Fill shifts in hospitality, warehousing, retail, and logistics with pre-vetted local workers. Reduce no-shows, streamline payroll, and keep operations running smoothly.
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3.5 p-3 rounded-xl bg-slate-900/50 border border-slate-800">
                <div className="text-xl p-2 rounded-lg bg-indigo-950 text-indigo-400 shrink-0">
                  ⚙️
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">My Flexible Team</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Save your top-performing workers to a private bench for 1-click rebooking and priority shift invites.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3 rounded-xl bg-slate-900/50 border border-slate-800">
                <div className="text-xl p-2 rounded-lg bg-emerald-950 text-emerald-400 shrink-0">
                  🛡️
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Automated Standby Backups</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Algorithm automatically provisions verified standby workers nearby to guarantee zero shift downtime.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/hire"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg transition"
              >
                Hire Workers Now →
              </Link>
              <Link
                href="/onboarding/employer"
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm rounded-xl border border-slate-700 transition"
              >
                Employer Portal
              </Link>
            </div>
          </div>

          {/* Right: Dashboard Mockup */}
          <div className="dashboard-mockup">
            <div className="dash-header flex items-center justify-between">
              <span className="dash-title">Artisan Roast • Dhanmondi Ops Dashboard</span>
              <span className="text-[10px] text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                ● Live Operations
              </span>
            </div>

            <div className="dash-stats-grid">
              <div className="dash-stat">
                <span className="stat-label">Active Shifts</span>
                <div className="stat-val">14</div>
                <span className="stat-sub text-emerald-400">12 filled</span>
              </div>
              <div className="dash-stat">
                <span className="stat-label">Fill Rate</span>
                <div className="stat-val">94%</div>
                <span className="stat-sub green">Target 90%</span>
              </div>
              <div className="dash-stat">
                <span className="stat-label">No-Show Risk</span>
                <div className="stat-val green">Low</div>
                <span className="stat-sub">1.8% predicted</span>
              </div>
              <div className="dash-stat">
                <span className="stat-label">Backups Ready</span>
                <div className="stat-val">6</div>
                <span className="stat-sub text-blue-400">Dhanmondi zone</span>
              </div>
            </div>

            {/* Upcoming Shifts Table */}
            <div className="dash-table">
              <div className="table-title">Upcoming Scheduled Shifts</div>

              <div className="table-row">
                <div className="min-w-0">
                  <div className="font-bold text-white text-xs">Senior Barista (Evening)</div>
                  <div className="text-[10px] text-slate-400">Today, 4:00 PM – 9:00 PM</div>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-bold">
                    4/4 Confirmed
                  </span>
                  <div className="text-[10px] text-slate-400 mt-0.5">৳450/hr</div>
                </div>
              </div>

              <div className="table-row">
                <div className="min-w-0">
                  <div className="font-bold text-white text-xs">Kitchen Helper & Dishwasher</div>
                  <div className="text-[10px] text-slate-400">Tomorrow, 11:00 AM – 7:00 PM</div>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 text-[10px] font-bold">
                    2/2 Confirmed
                  </span>
                  <div className="text-[10px] text-slate-400 mt-0.5">৳380/hr</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
