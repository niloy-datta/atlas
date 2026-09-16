export default function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "Choose Your Intent",
      desc: "Whether you want to pick up flexible hourly shifts, hire pre-vetted staff, or book home help.",
      icon: "🎯",
    },
    {
      num: "02",
      title: "Verified Matching",
      desc: "ATLAS algorithm matches requests with verified WorkPass profiles based on proximity in Dhaka and proven skills.",
      icon: "🛡️",
    },
    {
      num: "03",
      title: "Escrow Secured",
      desc: "Pay rates and agreements are locked upfront in guaranteed escrow. Zero payment disputes or surprises.",
      icon: "🔒",
    },
    {
      num: "04",
      title: "Work & Instant Payout",
      desc: "QR/GPS check-in confirms arrival. Payouts transfer directly to worker bKash or bank upon shift sign-off.",
      icon: "⚡",
    },
  ];

  return (
    <section className="py-16 section-container" id="how-it-works" aria-label="How WORVO Works">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
          How WORVO Works
        </h2>
        <p className="text-sm text-slate-400 mt-2">
          A seamless, transparent workflow designed for workers, businesses, and everyday customers.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
        {steps.map((step, idx) => (
          <div
            key={step.num}
            className="p-6 rounded-2xl bg-[#0E1626] border border-slate-800 hover:border-blue-500/40 transition-all flex flex-col justify-between shadow-md relative group"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 inline-block">
                  {step.icon}
                </span>
                <span className="text-2xl font-black text-slate-700 group-hover:text-blue-500/60 transition">
                  {step.num}
                </span>
              </div>
              <h3 className="text-base font-bold text-white mb-2">{step.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
            </div>

            {idx < steps.length - 1 && (
              <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-slate-600 font-bold text-lg pointer-events-none">
                ›
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
