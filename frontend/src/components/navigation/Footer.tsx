import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer-v2" role="contentinfo">
      <div className="section-container">
        <div className="footer-grid-v2">
          {/* Brand Column */}
          <div className="footer-brand-v2">
            <Link href="/" className="brand-logo light" aria-label="WORVO by SkillHub Home">
              <svg className="logo-icon" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <circle cx="10" cy="16" r="6" fill="#3B82F6" />
                <circle cx="22" cy="10" r="4" fill="#8B5CF6" />
                <circle cx="22" cy="22" r="4" fill="#10B981" />
                <line x1="14.5" y1="13.5" x2="18.5" y2="11.5" stroke="#60A5FA" strokeWidth="2" />
                <line x1="14.5" y1="18.5" x2="18.5" y2="20.5" stroke="#34D399" strokeWidth="2" />
              </svg>
              <span className="logo-text font-bold">
                WORVO <span className="text-xs font-normal text-slate-400">by SkillHub</span>
              </span>
            </Link>
            <p className="brand-sub">
              Verified workforce marketplace for on-demand shifts, skilled jobs, and local services in Dhaka. Powered by ATLAS domain authority and WorkPass verification infrastructure.
            </p>
            <div className="flex items-center gap-2 mt-4 text-xs text-slate-400">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
              <span>Pilot active in Dhaka Metropolitan Area (BDT ৳)</span>
            </div>
          </div>

          {/* Column 1: Platform & Work */}
          <div className="footer-col">
            <h5>Find Work</h5>
            <ul>
              <li>
                <Link href="/shifts">Hourly Shifts</Link>
              </li>
              <li>
                <Link href="/jobs">Jobs & Positions</Link>
              </li>
              <li>
                <Link href="/earnings">Worker Earnings</Link>
              </li>
              <li>
                <Link href="/skills">Skill Proof & Badges</Link>
              </li>
              <li>
                <Link href="/my-shifts">My Scheduled Shifts</Link>
              </li>
            </ul>
          </div>

          {/* Column 2: For Businesses */}
          <div className="footer-col">
            <h5>For Businesses</h5>
            <ul>
              <li>
                <Link href="/hire">Hire Workers Fast</Link>
              </li>
              <li>
                <Link href="/workers">Workers Directory</Link>
              </li>
              <li>
                <Link href="/shifts/create">Post a Shift</Link>
              </li>
              <li>
                <Link href="/jobs/create">Post a Job</Link>
              </li>
              <li>
                <Link href="/onboarding/employer">Employer Portal</Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Local Services */}
          <div className="footer-col">
            <h5>Get Local Help</h5>
            <ul>
              <li>
                <Link href="/services">Electrical & Wiring</Link>
              </li>
              <li>
                <Link href="/services">Plumbing & Sanitary</Link>
              </li>
              <li>
                <Link href="/services">Deep Home Cleaning</Link>
              </li>
              <li>
                <Link href="/services">AC Repair & Service</Link>
              </li>
              <li>
                <Link href="/services">Moving & Heavy Lifting</Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Verification & Trust */}
          <div className="footer-col">
            <h5>Verification & Trust</h5>
            <ul>
              <li>
                <Link href="/workpass">WorkPass Overview</Link>
              </li>
              <li>
                <Link href="/credentials">Credential Storage</Link>
              </li>
              <li>
                <Link href="/dashboard/worker">Worker Dashboard</Link>
              </li>
              <li>
                <Link href="/dashboard/employer">Employer Dashboard</Link>
              </li>
              <li>
                <Link href="/messages">Direct In-App Messages</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom-v2">
          <p>© {new Date().getFullYear()} WORVO by SkillHub. Verified workforce marketplace. All rights reserved.</p>
          <div className="bottom-controls flex items-center gap-4 text-xs">
            <span className="text-slate-400">📍 Dhaka, Bangladesh</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">Currency: BDT (৳)</span>
            <span className="text-slate-500">|</span>
            <span className="text-blue-400 font-mono text-[11px]">ATLAS Verified Infrastructure</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
