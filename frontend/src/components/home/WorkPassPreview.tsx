import Image from "next/image";
import Link from "next/link";

export default function WorkPassPreview() {
  return (
    <section className="passports-section bg-[#080D1A]/50" aria-label="WorkPass and Trust Passports">
      <div className="section-container">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/70 border border-blue-500/30 text-blue-300 text-xs font-bold mb-3">
            <span>🛡️</span>
            <span>ATLAS Cryptographic Verification</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            WorkPass & Employer Trust Passports
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Eliminating resume fraud and unpaid shifts with portable verified identities and mutual ratings.
          </p>
        </div>

        <div className="passports-grid">
          {/* 1. Worker WorkPass Card */}
          <div className="passport-card">
            <div className="passport-header">
              <div className="shield-badge green" aria-hidden="true">
                🛡️
              </div>
              <div>
                <h3>Worker WorkPass</h3>
                <p className="text-[11px] text-emerald-400 font-semibold">Cryptographically Verified</p>
              </div>
            </div>

            <div className="passport-profile">
              <Image
                src="/assets/maria_santos.jpg"
                alt="Farzana Akhter"
                width={48}
                height={48}
                className="passport-avatar"
              />
              <div>
                <h4 className="text-sm font-bold text-white">Farzana Akhter</h4>
                <p className="text-xs text-slate-400">Barista & Front of House</p>
                <span className="inline-block mt-1 font-mono text-[10px] text-blue-400">WP-BD-DH-2940</span>
              </div>
            </div>

            <div className="passport-details">
              <div className="detail-row">
                <span>National ID (NID)</span>
                <span className="val green">✓ Verified</span>
              </div>
              <div className="detail-row">
                <span>Police Clearance</span>
                <span className="val green">✓ Verified</span>
              </div>
              <div className="detail-row">
                <span>Completed Shifts</span>
                <span className="val">84 shifts</span>
              </div>
              <div className="detail-row">
                <span>Reliability Rating</span>
                <span className="val text-amber-400">4.9 ★</span>
              </div>
              <div className="detail-row">
                <span>On-time Arrival</span>
                <span className="val">98%</span>
              </div>
              <div className="detail-row">
                <span>Languages</span>
                <span className="val">Bengali, English</span>
              </div>
              <div className="detail-row">
                <span>Skills Proven</span>
                <span className="val">Espresso, POS, Food Hygiene</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800">
              <Link
                href="/workpass"
                className="w-full block text-center py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-bold transition"
              >
                Learn About WorkPass →
              </Link>
            </div>
          </div>

          {/* 2. Employer Trust Passport Card */}
          <div className="passport-card">
            <div className="passport-header">
              <div className="shield-badge blue" aria-hidden="true">
                🏢
              </div>
              <div>
                <h3>Employer Trust Passport</h3>
                <p className="text-[11px] text-blue-400 font-semibold">Verified Business Rating</p>
              </div>
            </div>

            <div className="passport-profile">
              <div className="employer-avatar">
                ARTISAN
                <br />
                ROAST
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Artisan Roast Roastery</h4>
                <p className="text-xs text-slate-400">Specialty Coffee & Bakery</p>
                <span className="inline-block mt-1 font-mono text-[10px] text-blue-400">ORG-BD-8831</span>
              </div>
            </div>

            <div className="passport-details">
              <div className="detail-row">
                <span>Trade License & Tax (TIN)</span>
                <span className="val green">✓ Verified</span>
              </div>
              <div className="detail-row">
                <span>Worker Review Rating</span>
                <span className="val text-amber-400">4.9 ★ (68 reviews)</span>
              </div>
              <div className="detail-row">
                <span>Shifts Honored</span>
                <span className="val">99%</span>
              </div>
              <div className="detail-row">
                <span>On-time Payout</span>
                <span className="val text-emerald-400">100% (Automated)</span>
              </div>
              <div className="detail-row">
                <span>Repeat Worker Rate</span>
                <span className="val">88%</span>
              </div>
              <div className="detail-row">
                <span>Location</span>
                <span className="val">Dhanmondi, Dhaka</span>
              </div>
              <div className="detail-row">
                <span>Industry</span>
                <span className="val">Hospitality & Food Service</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800">
              <Link
                href="/hire"
                className="w-full block text-center py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-bold transition"
              >
                Hire With Trust →
              </Link>
            </div>
          </div>

          {/* 3. Featured Shift Card */}
          <div className="featured-shift-card">
            <div className="shift-card-header">
              <span className="text-slate-400">Featured Pilot Shift</span>
              <span className="badge-verified">Verified Escrow</span>
            </div>

            <div className="shift-img-wrapper">
              <Image
                src="/assets/barista_shift.jpg"
                alt="Barista brewing espresso"
                width={400}
                height={160}
                className="shift-img"
              />
            </div>

            <div className="shift-info">
              <div className="flex items-center justify-between">
                <div>
                  <h4>Senior Barista</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Artisan Roast • Dhanmondi</p>
                </div>
                <div className="text-right">
                  <span className="text-base font-black text-white">৳450</span>
                  <span className="text-xs text-slate-400">/hr</span>
                </div>
              </div>

              <div className="shift-meta-grid">
                <div className="meta-item">
                  <span className="meta-label">📅 Date</span>
                  <span>Today</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">🕒 Timing</span>
                  <span>4:00 PM – 9:00 PM</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">⏱️ Duration</span>
                  <span>5 Hours</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">💰 Total Payout</span>
                  <span className="text-emerald-400 font-bold">৳2,250 BDT</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">📍 Distance</span>
                  <span>1.2 km away</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">💳 Payout Mode</span>
                  <span className="text-blue-400 font-semibold">bKash / Bank</span>
                </div>
              </div>

              <Link
                href="/shifts"
                className="btn-blue-action text-center block"
              >
                Apply for Shift →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
