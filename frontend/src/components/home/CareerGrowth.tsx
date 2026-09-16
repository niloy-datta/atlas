import Link from "next/link";

export default function CareerGrowth() {
  const steps = [
    { role: "Junior Crew", pay: "৳350/hr", icon: "🌱" },
    { role: "Experienced Pro", pay: "৳450/hr", icon: "⭐" },
    { role: "Certified Specialist", pay: "৳600/hr", icon: "🏆" },
    { role: "Shift Supervisor", pay: "৳800+/hr", icon: "👔", isLeader: true },
  ];

  return (
    <section className="career-section" aria-label="Career Growth on WORVO">
      <div className="section-container">
        <div className="career-box">
          <div className="career-content">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2 block">
              SkillProof & Leveling
            </span>
            <h2 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
              Grow your career and hourly earnings
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-xl leading-relaxed">
              Every completed shift, punctuality record, and client review is stored on your permanent WorkPass. Earn verified SkillProof badges to unlock higher-paying roles and leadership positions.
            </p>

            <div className="career-pathway">
              {steps.map((s, idx) => (
                <div key={s.role} className="flex items-center gap-2">
                  <div className={`path-node ${s.isLeader ? "highlight" : ""}`}>
                    <span className="path-icon">{s.icon}</span>
                    <div>
                      <div className="font-bold text-white text-xs">{s.role}</div>
                      <div className="text-[10px] text-emerald-400">{s.pay}</div>
                    </div>
                  </div>
                  {idx < steps.length - 1 && (
                    <span className="text-slate-600 font-bold" aria-hidden="true">
                      →
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="career-right flex flex-col justify-center items-start sm:items-end">
            <p className="text-xs text-slate-400 text-left sm:text-right mb-4">
              Over 25+ verified micro-credentials available across hospitality, logistics, and skilled home trades.
            </p>
            <Link
              href="/skills"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition"
            >
              Explore SkillProof Badges →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
