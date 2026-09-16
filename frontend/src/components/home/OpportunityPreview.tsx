import Link from "next/link";

interface OpportunityItem {
  id: string;
  role: string;
  badge: string;
  badgeColor: "emerald" | "blue" | "amber";
  icon: string;
  company: string;
  timeText: string;
  distance: string;
  location: string;
  hourlyRate: number;
  totalEst: number;
}

const LIVE_OPPORTUNITIES: OpportunityItem[] = [
  {
    id: "opp-1",
    role: "Barista & Café Counter",
    badge: "High Match",
    badgeColor: "emerald",
    icon: "☕",
    company: "Artisan Roast Roastery",
    timeText: "Today 4:00 PM – 9:00 PM (5 hrs)",
    distance: "1.2 km away",
    location: "Dhanmondi 27",
    hourlyRate: 450,
    totalEst: 2250,
  },
  {
    id: "opp-2",
    role: "Warehouse Assistant",
    badge: "Verified Shift",
    badgeColor: "blue",
    icon: "📦",
    company: "RapidLogistics Hub",
    timeText: "Tomorrow 8:00 AM – 4:00 PM (8 hrs)",
    distance: "2.4 km away",
    location: "Mirpur 10",
    hourlyRate: 380,
    totalEst: 3040,
  },
  {
    id: "opp-3",
    role: "Express Delivery Rider",
    badge: "Starts in 30 min",
    badgeColor: "amber",
    icon: "🏍️",
    company: "CityExpress Logistics",
    timeText: "Instant Dispatch (4 hrs)",
    distance: "0.8 km away",
    location: "Gulshan 1",
    hourlyRate: 420,
    totalEst: 1680,
  },
];

export default function OpportunityPreview() {
  return (
    <section className="py-14 section-container" aria-label="Live Opportunities in Dhaka">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-2">
            <span className="dot-green" aria-hidden="true" />
            <span>Real-Time Dhaka Pilot Feed</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Live Opportunities Near You
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Verified hourly shifts and immediate task needs across active Dhaka pilot zones.
          </p>
        </div>
        <Link
          href="/shifts"
          className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 shrink-0"
        >
          See all shifts ({LIVE_OPPORTUNITIES.length}+ active) →
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 3 Shift Cards (7 cols) */}
        <div className="lg:col-span-7 space-y-3.5">
          {LIVE_OPPORTUNITIES.map((opp) => (
            <div
              key={opp.id}
              className="p-4 sm:p-5 rounded-2xl bg-[#0E1626] border border-slate-800 hover:border-blue-500/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-700 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                  {opp.icon}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-bold text-white truncate">{opp.role}</h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                        opp.badgeColor === "emerald"
                          ? "bg-emerald-950 text-emerald-300 border-emerald-500/30"
                          : opp.badgeColor === "blue"
                          ? "bg-blue-950 text-blue-300 border-blue-500/30"
                          : "bg-amber-950 text-amber-300 border-amber-500/30"
                      }`}
                    >
                      {opp.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    <span className="font-semibold text-slate-200">{opp.company}</span> • {opp.timeText}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                    <span>📍 {opp.distance}</span>
                    <span>•</span>
                    <span>{opp.location}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center sm:flex-col justify-between sm:justify-center sm:items-end shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
                <div className="text-left sm:text-right">
                  <div className="text-base font-black text-white">
                    ৳{opp.hourlyRate}
                    <span className="text-xs font-normal text-slate-400">/hr</span>
                  </div>
                  <div className="text-[11px] text-emerald-400 font-semibold">
                    ~৳{opp.totalEst.toLocaleString()} est. total
                  </div>
                </div>
                <Link
                  href={`/shifts/${opp.id}`}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-sm transition sm:mt-2"
                >
                  View Shift
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Map Simulation & Worker Voice (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative h-64 rounded-2xl overflow-hidden bg-[#0A0F1D] border border-slate-800 shadow-xl flex flex-col justify-between p-5">
            <div className="absolute inset-0 bg-[radial-gradient(#1E293B_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

            <div className="relative z-10 flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>📍</span> Work Near You (Dhaka)
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold">
                Pilot Active
              </span>
            </div>

            {/* Visual Map Pins */}
            <div className="relative z-10 my-auto h-24">
              <div
                className="absolute left-[25%] top-[15%] w-7 h-7 rounded-full bg-blue-600 border border-white flex items-center justify-center text-xs shadow-lg"
                title="Dhanmondi Shift"
              >
                ☕
              </div>
              <div
                className="absolute left-[70%] top-[25%] w-7 h-7 rounded-full bg-purple-600 border border-white flex items-center justify-center text-xs shadow-lg"
                title="Gulshan Shift"
              >
                📦
              </div>
              <div
                className="absolute left-[40%] top-[65%] w-7 h-7 rounded-full bg-emerald-600 border border-white flex items-center justify-center text-xs shadow-lg"
                title="Mohakhali Pro"
              >
                🏍️
              </div>
              <div
                className="absolute left-[80%] top-[60%] w-7 h-7 rounded-full bg-amber-600 border border-white flex items-center justify-center text-xs shadow-lg"
                title="Uttara Pro"
              >
                🧹
              </div>
            </div>

            <div className="relative z-10 flex items-center justify-between pt-2 border-t border-slate-800/80">
              <span className="text-xs text-slate-400">Dhanmondi • Gulshan • Mirpur</span>
              <Link
                href="/workers"
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-md transition"
              >
                Open Map Feed →
              </Link>
            </div>
          </div>

          {/* Testimonial Quote */}
          <div className="p-4 rounded-2xl bg-[#0E1626] border border-slate-800 flex items-center gap-3.5 shadow-md">
            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center text-xl font-bold text-white shrink-0">
              👨‍💼
            </div>
            <div className="text-xs">
              <p className="text-slate-300 italic leading-relaxed">
                &quot;WORVO allows me to take hospitality shifts in Dhanmondi between my classes. The hourly pay is directly deposited without delay.&quot;
              </p>
              <div className="text-slate-400 text-[11px] mt-1 font-semibold">
                — Tanvir Hasan, Barista & Student (Dhanmondi)
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
