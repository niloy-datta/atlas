"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

export default function WorkspaceSidebar() {
  const pathname = usePathname();
  const { atlasUser } = useAuth();
  const isEmployer = atlasUser?.roles?.some((role) => role.includes("EMPLOYER")) ?? false;
  const dashboardHref = isEmployer ? "/dashboard/employer" : "/dashboard/worker";
  const menuItems: Array<readonly [string, string, string]> = [
    ["⌂", "Dashboard", dashboardHref],
    ...(isEmployer
      ? [["◎", "Workforce", "/workforce"] as const]
      : [["◷", "Availability", "/availability"] as const]),
    ["⌕", "Find Work", "/jobs"],
    ["▣", "My Shifts", "/my-shifts"],
    ["♡", "Saved Jobs", "/jobs"],
    ["✧", "Skills & Certificates", "/skills"],
    ["▤", "Work Passport", "/workpass"],
    ["▣", "Messages", "/messages"],
    ["▥", "Earnings", "/earnings"],
    ["◫", "Career Growth", dashboardHref],
    ["⚙", "Settings", "/settings"],
  ];

  const isActive = (href: string, label: string) => {
    if (label === "Saved Jobs") return false;
    return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
  };

  return (
    <>
      {/* Keeps page content aligned beside the fixed desktop navigation. */}
      <div aria-hidden="true" className="hidden w-64 shrink-0 lg:block" />

      <aside className="fixed inset-y-0 left-0 z-[60] hidden w-64 flex-col overflow-y-auto border-r border-slate-800/80 bg-[#080d1a] p-5 lg:flex">
        <Link href="/" className="flex items-center gap-2.5 border-b border-slate-800/80 pb-5" aria-label="WORVO by SkillHub Home">
          <svg className="h-8 w-8 shrink-0" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <circle cx="10" cy="16" r="6" fill="#3B82F6" />
            <circle cx="22" cy="10" r="4" fill="#8B5CF6" />
            <circle cx="22" cy="22" r="4" fill="#10B981" />
            <line x1="14.5" y1="13.5" x2="18.5" y2="11.5" stroke="#60A5FA" strokeWidth="2" />
            <line x1="14.5" y1="18.5" x2="18.5" y2="20.5" stroke="#34D399" strokeWidth="2" />
          </svg>
          <span>
            <span className="block text-xl font-extrabold tracking-tight text-white">WORVO <span className="text-xs font-normal text-slate-400">by</span></span>
            <span className="block text-[11px] font-medium text-slate-400">SkillHub</span>
          </span>
        </Link>

        <nav className="mt-5 space-y-1" aria-label="Workspace navigation">
          {menuItems.map(([icon, label, href]) => {
            const active = isActive(href, label);
            return (
              <Link
                key={label}
                href={href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition ${active ? "border border-blue-500/30 bg-blue-600/20 text-white" : "text-slate-400 hover:bg-slate-800/60 hover:text-white"}`}
              >
                <span className="grid h-6 w-6 place-items-center rounded-md bg-white/5 text-sm leading-none">{icon}</span>
                <span>{label}</span>
                {label === "Messages" && <span className="ml-auto grid h-5 w-5 place-items-center rounded-full bg-rose-500 text-[10px] text-white">3</span>}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto rounded-2xl border border-indigo-500/40 bg-gradient-to-br from-[#151d50] via-[#11153a] to-[#09152b] p-4 shadow-xl shadow-indigo-950/20">
          <div className="text-2xl">♛</div>
          <h2 className="mt-2 text-sm font-extrabold text-white">Upgrade to Pro</h2>
          <p className="mt-1 text-[11px] leading-5 text-slate-400">Get priority access to high-paying opportunities.</p>
          <button type="button" className="mt-3 w-full rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-3 py-2 text-xs font-bold text-white">Upgrade Now →</button>
        </div>
      </aside>
    </>
  );
}
