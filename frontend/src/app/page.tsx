"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { firebaseUser, atlasUser, signOut } = useAuth();
  const [composerInput, setComposerInput] = useState("");
  const [interactiveNotice, setInteractiveNotice] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setInteractiveNotice(msg);
    setTimeout(() => setInteractiveNotice(null), 4000);
  };

  const handleHeroSubmit = () => {
    if (!composerInput.trim()) {
      showNotice("Please enter a service or shift requirement first.");
      return;
    }
    showNotice(`Scoping requirement for: "${composerInput.trim()}". Discovering verified professionals in pilot zones.`);
  };

  const handleServiceClick = (name: string) => {
    showNotice(`Exploring ${name} category in active pilot zones.`);
  };

  const handleShiftApply = () => {
    showNotice("Demo shift application recorded for preview. Sign up or log in to submit real applications.");
  };

  return (
    <>


  {/* Top Navbar */}
  <header className="navbar">
    <div className="nav-container">
      <div className="nav-left">
        <Link href="/" className="brand-logo">
          <svg className="logo-icon" viewBox="0 0 32 32" fill="none">
            <circle cx="10" cy="16" r="6" fill="#3B82F6"/>
            <circle cx="22" cy="10" r="4" fill="#8B5CF6"/>
            <circle cx="22" cy="22" r="4" fill="#10B981"/>
            <line x1="14.5" y1="13.5" x2="18.5" y2="11.5" stroke="#60A5FA" strokeWidth="2"/>
            <line x1="14.5" y1="18.5" x2="18.5" y2="20.5" stroke="#34D399" strokeWidth="2"/>
          </svg>
          <span className="logo-text font-bold tracking-tight">WORVO <span className="text-xs font-normal text-slate-400">by SkillHub</span></span>
        </Link>
        <nav className="nav-links">
          <Link href="/jobs" className="nav-link">Find Work</Link>
          <Link href="/shifts" className="nav-link">Shifts</Link>
          <Link href="/hire" className="nav-link">Hire People</Link>
          <Link href="/workers" className="nav-link">Workers</Link>
          <Link href="/my-shifts" className="nav-link">My Shifts</Link>
          <Link href="/workpass" className="nav-link">WorkPass</Link>
        </nav>
      </div>

      <div className="nav-right">
        <div className="location-picker">
          <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" strokeWidth="2" fill="none"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <span>Dhaka, BD</span>
          <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2" fill="none"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <div className="lang-picker">
          <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
          <span>EN</span>
          <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2" fill="none"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        {firebaseUser ? (
          <div className="flex items-center gap-3">
            <Link
              href={atlasUser?.roles?.some((r) => r.includes("EMPLOYER")) ? "/dashboard/employer" : "/dashboard/worker"}
              className="px-3.5 py-1.5 bg-blue-900/50 border border-blue-500/40 text-blue-300 hover:bg-blue-800/60 rounded-full text-sm font-semibold transition-colors"
            >
              Go to Dashboard →
            </Link>
            <div className="user-badge !bg-slate-800 !text-slate-200" data-testid="user-profile-badge">
              <span>{atlasUser?.email || firebaseUser.email}</span>
              {atlasUser?.roles?.[0] && (
                <span className="role-tag">{atlasUser.roles[0].replace("ROLE_", "")}</span>
              )}
            </div>
            <button
              onClick={() => signOut()}
              className="btn-text !text-slate-400 hover:!text-white"
              data-testid="logout-button"
            >
              Log out
            </button>
          </div>
        ) : (
          <>
            <Link href="/login" className="btn-text">Log in</Link>
            <Link href="/register" className="btn-primary">Get started</Link>
          </>
        )}
      </div>
    </div>
  </header>

  {/* Hero Section */}
  <section className="hero-section">
    <div className="hero-container">
      <div className="hero-content">
        <h1 className="hero-title">
          Work when <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">you want.</span><br />
          Hire when <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">you need.</span>
        </h1>
        <p className="hero-subtitle">
          Jobs, shifts and local tasks — real work, real people, real opportunities. Powered by verified identity and secured payouts.
        </p>

        {/* Search / Filter Bar from Design */}
        <div className="composer-card">
          <div className="flex items-center gap-2 mb-3 border-b border-slate-800 pb-2.5">
            <button className="px-3.5 py-1.5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm">
              <span>💼</span> Jobs
            </button>
            <Link href="/shifts" className="px-3.5 py-1.5 rounded-full bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition">
              <span>⏱️</span> Shifts
            </Link>
            <Link href="/shifts" className="px-3.5 py-1.5 rounded-full bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition">
              <span>⚡</span> Tasks
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex items-center bg-[#070b14] border border-slate-800 rounded-lg px-3 py-2">
              <span className="text-slate-400 mr-2">🔍</span>
              <input
                type="text"
                placeholder="What work are you looking for? (e.g. Waiter, Driver)"
                className="bg-transparent text-sm text-slate-200 outline-none w-full placeholder:text-slate-500"
                value={composerInput}
                onChange={(e) => setComposerInput(e.target.value)}
              />
            </div>
            <div className="flex items-center bg-[#070b14] border border-slate-800 rounded-lg px-3 py-2 sm:w-44">
              <span className="text-slate-400 mr-2">📍</span>
              <span className="text-sm text-slate-300">Dhaka, BD</span>
            </div>
            <button
              onClick={handleHeroSubmit}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-lg shadow-lg shadow-blue-500/20 transition"
            >
              Search
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-3 pt-2 text-xs text-slate-400">
            <span className="font-semibold text-slate-500">Popular:</span>
            {["Waiter", "Cleaner", "Warehouse", "Driver", "Retail", "Delivery"].map((tag) => (
              <button
                key={tag}
                onClick={() => setComposerInput(tag)}
                className="px-2.5 py-0.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* 3 Pathway Cards */}
        <div className="pathway-grid">
          <Link href="/shifts" className="pathway-card blue">
            <div className="pathway-icon">
              <span className="text-xl">👤</span>
            </div>
            <div className="pathway-text">
              <h4>I Need Work</h4>
              <p>Find jobs, shifts and local tasks</p>
            </div>
            <span className="pathway-arrow">&rsaquo;</span>
          </Link>

          <Link href="/hire" className="pathway-card orange">
            <div className="pathway-icon">
              <span className="text-xl">👥</span>
            </div>
            <div className="pathway-text">
              <h4>I Need People</h4>
              <p>Hire trusted workers fast</p>
            </div>
            <span className="pathway-arrow">&rsaquo;</span>
          </Link>

          <Link href="/jobs" className="pathway-card green">
            <div className="pathway-icon">
              <span className="text-xl">🏠</span>
            </div>
            <div className="pathway-text">
              <h4>I Need Help</h4>
              <p>Get help with everyday tasks</p>
            </div>
            <span className="pathway-arrow">&rsaquo;</span>
          </Link>
        </div>

        {interactiveNotice && (
          <div className="mb-6 p-4 rounded-lg bg-blue-950/60 border border-blue-800 text-blue-200 text-sm flex items-center justify-between" role="status">
            <span>{interactiveNotice}</span>
            <button onClick={() => setInteractiveNotice(null)} className="text-blue-400 font-bold ml-4">✕</button>
          </div>
        )}

        {/* Pilot Indicators */}
        <div className="hero-indicators">
          <div className="indicator-item">
            <span className="dot-green"></span>
            <span>Workforce discovery • <strong>Dhaka, BD pilot area</strong></span>
          </div>
          <div className="indicator-item">
            <span className="dot-green"></span>
            <span>WorkPass verification • <strong>Verified identities</strong></span>
          </div>
          <div className="indicator-item">
            <svg viewBox="0 0 24 24" width="15" height="15" stroke="#34D399" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span>Flexible scheduling • <strong>Shifts starting from ৳350/hr</strong></span>
          </div>
        </div>
      </div>

      {/* Hero Visuals & Floating Status Cards */}
      <div className="hero-visual">
        <div className="pro-image-container">
          <Image src="/assets/electrician_hero.jpg" alt="SkillHub Professional" width={600} height={600} priority className="hero-bg-img" />

          {/* Card 1: Best Match */}
          <div className="floating-status-card top">
            <span className="status-card-label">Live Opportunity</span>
            <div className="status-card-body">
              <Image src="/assets/daniel_morgan.jpg" alt="Rafiq Hasan" width={40} height={40} className="mini-avatar" />
              <div>
                <h5>Rafiq Hasan</h5>
                <p>Waiter • ৳450/hr</p>
                <div className="mini-rating">★ 4.9 <span className="muted">• 2.1 km away</span></div>
                <span className="badge-verified">✔ Verified</span>
              </div>
            </div>
          </div>

          {/* Card 2: Shift Capacity */}
          <div className="floating-status-card middle">
            <span className="status-card-label">Tomorrow 8 AM - 4 PM</span>
            <div className="status-card-body">
              <div className="shift-icon-box">📦</div>
              <div>
                <h5>Warehouse Assistant</h5>
                <p>৳380/hr • ৳3,040 total</p>
                <p className="muted">RapidLogistics, Dhanmondi</p>
                <span className="badge-filled">Confirmed</span>
              </div>
            </div>
          </div>

          {/* Card 3: SkillProof Verified */}
          <div className="floating-status-card bottom">
            <span className="status-card-label">Verified Work Outcome</span>
            <div className="status-card-body">
              <div className="shield-icon-box">🛡️</div>
              <div>
                <h5>WorkPass Verified</h5>
                <p className="muted">Guaranteed payment escrow</p>
                <span className="badge-protected">Protected</span>
              </div>
            </div>
          </div>

          <div className="concept-note">WORVO Live Demonstration • Dhaka Pilot</div>
        </div>
      </div>
    </div>
  </section>

  {/* Stats & Trust Bar from Screen 1 */}
  <section className="border-y border-slate-800/80 bg-[#080D1A]/70 py-8 px-4 sm:px-8">
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-900/40 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-lg">
            👤
          </div>
          <div>
            <div className="text-2xl font-black text-white">50K+</div>
            <div className="text-xs text-slate-400 font-medium">Active workers</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-900/40 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg">
            🏢
          </div>
          <div>
            <div className="text-2xl font-black text-white">12K+</div>
            <div className="text-xs text-slate-400 font-medium">Businesses</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-900/40 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold text-lg">
            ⚡
          </div>
          <div>
            <div className="text-2xl font-black text-white">200K+</div>
            <div className="text-xs text-slate-400 font-medium">Shifts completed</div>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-950/40 to-indigo-950/40 border border-blue-500/20 text-center sm:text-right">
          <div className="text-xs font-bold text-blue-300 italic">&quot;Real People, Real Work, A Brighter Tomorrow&quot;</div>
          <div className="text-[10px] text-slate-400 mt-0.5">WORVO by SkillHub • Dhaka, Bangladesh</div>
        </div>
      </div>

      {/* Trusted By Brands */}
      <div className="pt-4 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-4 text-xs font-bold text-slate-400">
        <span className="text-slate-500 text-[11px] uppercase tracking-wider">Trusted by growing businesses:</span>
        <div className="flex flex-wrap items-center gap-6 sm:gap-10 text-slate-400 tracking-wider">
          <span className="hover:text-white transition font-black text-sm">bKash</span>
          <span className="hover:text-white transition font-black text-sm text-red-400">Pathao</span>
          <span className="hover:text-white transition font-black text-sm text-blue-400">Unilever</span>
          <span className="hover:text-white transition font-black text-sm text-amber-400">Daraz</span>
          <span className="hover:text-white transition font-black text-sm">REHAB</span>
          <span className="hover:text-white transition font-black text-sm">CITY GROUP</span>
        </div>
      </div>
    </div>
  </section>

  {/* Live Opportunities & Work Near You Map Card (from Screen 1) */}
  <section className="py-12 px-4 sm:px-8 max-w-7xl mx-auto space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Live Opportunities Near You</h2>
        <p className="text-sm text-slate-400 mt-0.5">Verified hourly shifts and immediate task needs across Dhaka pilot zones.</p>
      </div>
      <Link href="/shifts" className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1">
        See all shifts →
      </Link>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* 3 Live Shift Cards (7 cols) */}
      <div className="lg:col-span-7 space-y-3.5">
        <div className="p-4 rounded-2xl bg-[#0E1626] border border-slate-800 hover:border-blue-500/50 transition flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center text-2xl shadow-inner">
              🍽️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white">Waiter</h4>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/30 text-emerald-300 text-[9px] font-extrabold">High Match</span>
              </div>
              <p className="text-xs text-slate-400">The Food Lounge • Today 6 PM - 11 PM</p>
              <p className="text-[11px] text-slate-500 mt-0.5">📍 1.2 km away • Dhanmondi</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-base font-black text-white">৳450<span className="text-xs font-normal text-slate-400">/hr</span></div>
            <Link href="/shifts" className="inline-block mt-1 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-sm transition">
              View
            </Link>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0E1626] border border-slate-800 hover:border-blue-500/50 transition flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center text-2xl shadow-inner">
              📦
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white">Warehouse Assistant</h4>
                <span className="px-2 py-0.5 rounded-full bg-blue-950 border border-blue-500/30 text-blue-300 text-[9px] font-extrabold">Verified</span>
              </div>
              <p className="text-xs text-slate-400">RapidLogistics • Tomorrow 8 AM - 4 PM</p>
              <p className="text-[11px] text-slate-500 mt-0.5">📍 2.1 km away • Dhanmondi</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-base font-black text-white">৳380<span className="text-xs font-normal text-slate-400">/hr</span></div>
            <Link href="/shifts" className="inline-block mt-1 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-sm transition">
              View
            </Link>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0E1626] border border-slate-800 hover:border-blue-500/50 transition flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center text-2xl shadow-inner">
              🏍️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white">Delivery Rider</h4>
                <span className="px-2 py-0.5 rounded-full bg-amber-950 border border-amber-500/30 text-amber-300 text-[9px] font-extrabold">Starts in 45 min</span>
              </div>
              <p className="text-xs text-slate-400">CityEats Express • Instant Shift</p>
              <p className="text-[11px] text-slate-500 mt-0.5">📍 0.9 km away • Mohammadpur</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-base font-black text-white">৳420<span className="text-xs font-normal text-slate-400">/hr</span></div>
            <Link href="/shifts" className="inline-block mt-1 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-sm transition">
              View
            </Link>
          </div>
        </div>
      </div>

      {/* Work Near You Interactive Map Card & Testimonial (5 cols) */}
      <div className="lg:col-span-5 space-y-4">
        <div className="relative h-60 rounded-2xl overflow-hidden bg-[#0A0F1D] border border-slate-800 shadow-xl flex flex-col justify-between p-4">
          <div className="absolute inset-0 bg-[radial-gradient(#1E293B_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>📍</span> Work Near You
            </span>
            <span className="text-[10px] text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
              328 Active Shifts
            </span>
          </div>

          {/* Map pins */}
          <div className="relative z-10 my-auto h-24">
            <div className="absolute left-[20%] top-[20%] w-6 h-6 rounded-full bg-blue-500/80 border border-white flex items-center justify-center text-xs shadow-lg animate-bounce">
              🍽️
            </div>
            <div className="absolute left-[65%] top-[30%] w-6 h-6 rounded-full bg-purple-500/80 border border-white flex items-center justify-center text-xs shadow-lg">
              📦
            </div>
            <div className="absolute left-[45%] top-[60%] w-6 h-6 rounded-full bg-emerald-500/80 border border-white flex items-center justify-center text-xs shadow-lg">
              🏍️
            </div>
            <div className="absolute left-[80%] top-[70%] w-6 h-6 rounded-full bg-amber-500/80 border border-white flex items-center justify-center text-xs shadow-lg">
              🧹
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Dhaka Metropolitan Area</span>
            <Link
              href="/workers"
              className="px-3.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-md transition"
            >
              Open Map →
            </Link>
          </div>
        </div>

        {/* Testimonial Quote */}
        <div className="p-3.5 rounded-2xl bg-[#0E1626] border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center text-lg font-bold text-white shrink-0">
            👨
          </div>
          <div className="text-xs">
            <p className="text-slate-300 italic">&quot;SkillHub gave me flexible work and helped me support my family.&quot;</p>
            <div className="text-slate-500 text-[10px] mt-0.5 font-semibold">— Rahim, Delivery Partner (Mirpur)</div>
          </div>
        </div>
      </div>
    </div>
  </section>

  {/* Dual Explorer Section: Services vs Shifts */}
  <section className="dual-explorer-section" id="services">
    <div className="section-container">
      <div className="dual-grid">
        
        {/* Left Panel: SkillHub Services */}
        <div className="explorer-panel orange-theme">
          <div className="panel-header">
            <div className="panel-icon orange">
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="#FF5A1F" strokeWidth="2" fill="none"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
            </div>
            <div>
              <h3>SkillHub Services</h3>
              <p>Outcome-based jobs. Fixed pricing. Quality guaranteed.</p>
            </div>
          </div>

          <div className="service-pills-row">
            <div className="service-pill" onClick={(e) => handleServiceClick(e.currentTarget.textContent || "")}>
              <span className="pill-icon">🔧</span>
              <span>Plumbing</span>
            </div>
            <div className="service-pill" onClick={(e) => handleServiceClick(e.currentTarget.textContent || "")}>
              <span className="pill-icon">⚡</span>
              <span>Electrical</span>
            </div>
            <div className="service-pill" onClick={(e) => handleServiceClick(e.currentTarget.textContent || "")}>
              <span className="pill-icon">🧹</span>
              <span>Cleaning</span>
            </div>
            <div className="service-pill" onClick={(e) => handleServiceClick(e.currentTarget.textContent || "")}>
              <span className="pill-icon">🛠️</span>
              <span>Handyman</span>
            </div>
            <div className="service-pill" onClick={(e) => handleServiceClick(e.currentTarget.textContent || "")}>
              <span className="pill-icon">📦</span>
              <span>Moving</span>
            </div>
          </div>

          <a href="#all-services" className="panel-link orange">View all services &rarr;</a>
        </div>

        {/* Right Panel: SkillHub Shifts */}
        <div className="explorer-panel blue-theme" id="shifts">
          <div className="panel-header">
            <div className="panel-icon blue">
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="#2563EB" strokeWidth="2" fill="none"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
            </div>
            <div>
              <h3>SkillHub Shifts</h3>
              <p>Time-based staffing. Flexible. Fill shifts fast, pay fairly.</p>
            </div>
          </div>

          <div className="service-pills-row">
            <div className="service-pill" onClick={(e) => handleServiceClick(e.currentTarget.textContent || "")}>
              <span className="pill-icon">☕</span>
              <span>Barista</span>
            </div>
            <div className="service-pill" onClick={(e) => handleServiceClick(e.currentTarget.textContent || "")}>
              <span className="pill-icon">🍳</span>
              <span>Kitchen Assistant</span>
            </div>
            <div className="service-pill" onClick={(e) => handleServiceClick(e.currentTarget.textContent || "")}>
              <span className="pill-icon">🏢</span>
              <span>Warehouse Assistant</span>
            </div>
            <div className="service-pill" onClick={(e) => handleServiceClick(e.currentTarget.textContent || "")}>
              <span className="pill-icon">🛍️</span>
              <span>Retail</span>
            </div>
            <div className="service-pill" onClick={(e) => handleServiceClick(e.currentTarget.textContent || "")}>
              <span className="pill-icon">🎪</span>
              <span>Events</span>
            </div>
          </div>

          <a href="#all-shifts" className="panel-link blue">View all shifts &rarr;</a>
        </div>

      </div>
    </div>
  </section>

  {/* How It Works Section (4 Steps) */}
  <section className="how-it-works-section" id="how-it-works">
    <div className="section-container">
      <h2 className="centered-title">How it works</h2>

      <div className="steps-row">
        <div className="step-box">
          <div className="step-badge">1</div>
          <div className="step-icon-circle">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <h4>Describe your need</h4>
          <p>Tell us what you need—service or shift—using words, voice or a photo.</p>
        </div>

        <div className="step-connector">&rsaquo;</div>

        <div className="step-box">
          <div className="step-badge">2</div>
          <div className="step-icon-circle">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/></svg>
          </div>
          <h4>We scope and match</h4>
          <p>Our AI scopes the job and matches you with verified pros or workers.</p>
        </div>

        <div className="step-connector">&rsaquo;</div>

        <div className="step-box">
          <div className="step-badge">3</div>
          <div className="step-icon-circle">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <h4>Book a pro or fill a shift</h4>
          <p>Confirm the match, price and time. We handle the rest.</p>
        </div>

        <div className="step-connector">&rsaquo;</div>

        <div className="step-box">
          <div className="step-badge">4</div>
          <div className="step-icon-circle">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h4>Work gets completed and tracked</h4>
          <p>We track quality, payments and feedback—every step of the way.</p>
        </div>
      </div>
    </div>
  </section>

  {/* Passports & Featured Shift Showcase */}
  <section className="passports-section">
    <div className="section-container">
      <div className="passports-grid">

        {/* Worker Passport Card */}
        <div className="passport-card">
          <div className="passport-header">
            <div className="shield-badge green">🛡️</div>
            <div>
              <h3>SkillHub Work Passport</h3>
            </div>
          </div>
          <div className="passport-profile">
            <Image src="/assets/maria_santos.jpg" alt="Maria Santos" width={44} height={44} className="passport-avatar" />
            <div>
              <h4>Maria Santos</h4>
              <p className="muted">Kitchen Assistant</p>
            </div>
          </div>
          <div className="passport-details">
            <div className="detail-row"><span>Identity verified</span><span className="val green">Verified</span></div>
            <div className="detail-row"><span>Right to work</span><span className="val green">Verified</span></div>
            <div className="detail-row"><span>Hospitality shifts</span><span className="val">126</span></div>
            <div className="detail-row"><span>Warehouse shifts</span><span className="val">28</span></div>
            <div className="detail-row"><span>Reliability</span><span className="val">4.9 ★</span></div>
            <div className="detail-row"><span>On-time</span><span className="val">96%</span></div>
            <div className="detail-row"><span>Languages</span><span className="val">English, Spanish</span></div>
            <div className="detail-row"><span>Training</span><span className="val">Food Hygiene, COSHH</span></div>
          </div>
        </div>

        {/* Employer Passport Card */}
        <div className="passport-card">
          <div className="passport-header">
            <div className="shield-badge blue">🛡️</div>
            <div>
              <h3>Employer Trust Passport</h3>
            </div>
          </div>
          <div className="passport-profile">
            <div className="employer-avatar">SOHO<br />CAFÉ</div>
            <div>
              <h4>Soho Café</h4>
              <p className="muted">Business</p>
            </div>
          </div>
          <div className="passport-details">
            <div className="detail-row"><span>Business verified</span><span className="val green">Verified</span></div>
            <div className="detail-row"><span>Worker rating</span><span className="val">4.8 ★</span></div>
            <div className="detail-row"><span>Shifts honored</span><span className="val">98%</span></div>
            <div className="detail-row"><span>Pays on time</span><span className="val">99%</span></div>
            <div className="detail-row"><span>Repeat workers</span><span className="val">86%</span></div>
            <div className="detail-row"><span>Member since</span><span className="val">Feb 2022</span></div>
            <div className="detail-row"><span>Industry</span><span className="val">Hospitality</span></div>
            <div className="detail-row"><span>Location</span><span className="val">London, UK</span></div>
          </div>
        </div>

        {/* Featured Shift Card */}
        <div className="featured-shift-card">
          <div className="shift-card-header">
            <span className="muted">Featured shift</span>
            <span className="badge-blue">Shifts</span>
          </div>
          <div className="shift-img-wrapper">
            <Image src="/assets/barista_shift.jpg" alt="Barista Shift" width={400} height={180} className="shift-img" />
          </div>
          <div className="shift-info">
            <h4>Barista</h4>
            <p className="muted">Soho Café</p>

            <div className="shift-meta-grid">
              <div className="meta-item"><span className="meta-label">📅 Date</span><span>Fri 16 May 2025</span></div>
              <div className="meta-item"><span className="meta-label">🕒 Time</span><span>16:00 – 21:00</span></div>
              <div className="meta-item"><span className="meta-label">⏱️ Hours</span><span>5 hrs</span></div>
              <div className="meta-item"><span className="meta-label">💷 Pay rate</span><span>£15.00 / hr</span></div>
              <div className="meta-item"><span className="meta-label">💰 Total (est.)</span><span><strong>£75.00</strong></span></div>
              <div className="meta-item"><span className="meta-label">📍 Distance</span><span>1.4 mi away</span></div>
              <div className="meta-item"><span className="meta-label">🎓 Experience</span><span>Beginner friendly</span></div>
              <div className="meta-item"><span className="meta-label">💳 Payment</span><span>Paid Friday</span></div>
            </div>

            <button className="btn-blue-action" onClick={handleShiftApply}>I&apos;m interested</button>
          </div>
        </div>

      </div>
    </div>
  </section>

  {/* For Businesses Dark Section & Dashboard Mockup */}
  <section className="business-section" id="business">
    <div className="section-container">
      <div className="business-grid">
        <div className="business-info">
          <span className="business-badge">For businesses</span>
          <h2>Run a reliable, flexible team</h2>
          <p className="business-sub">Everything you need to fill shifts, reduce risk and keep operations moving.</p>

          <div className="biz-feature-list">
            <div className="biz-feature">
              <div className="biz-feature-icon">⚙️</div>
              <div>
                <h4>My Flexible Team</h4>
                <p>Build and manage your team of trusted, rebookable workers.</p>
              </div>
            </div>

            <div className="biz-feature">
              <div className="biz-feature-icon">🛡️</div>
              <div>
                <h4>Auto Replacement</h4>
                <p>Smart backups reduce no-shows and last-minute gaps.</p>
              </div>
            </div>
          </div>

          <button className="btn-outline-light">Explore business tools</button>
        </div>

        {/* Dashboard UI Mockup */}
        <div className="dashboard-mockup">
          <div className="dash-header">
            <span className="dash-title">Soho Café Dashboard</span>
          </div>
          <div className="dash-stats-grid">
            <div className="dash-stat">
              <span className="stat-label">Shifts</span>
              <div className="stat-val">12</div>
              <span className="stat-sub">8 filled</span>
            </div>
            <div className="dash-stat">
              <span className="stat-label">Fill rate</span>
              <div className="stat-val">92%</div>
              <span className="stat-sub green">Target 90%</span>
            </div>
            <div className="dash-stat">
              <span className="stat-label">No-show risk</span>
              <div className="stat-val green">Low</div>
              <span className="stat-sub">2% predicted</span>
            </div>
            <div className="dash-stat">
              <span className="stat-label">Backups ready</span>
              <div className="stat-val">7</div>
              <span className="stat-sub">Available now</span>
            </div>
            <div className="dash-stat wide">
              <span className="stat-label">Rebook team</span>
              <div className="stat-val">86%</div>
              <button className="btn-dash-sm">Rebook team</button>
            </div>
          </div>

          {/* Upcoming Shifts Table */}
          <div className="dash-table">
            <div className="table-title">Upcoming shifts</div>
            
            <div className="table-row">
              <div className="col-role">
                <strong>Barista</strong>
              </div>
              <div className="col-time">Fri 16 May, 16:00–21:00</div>
              <div className="col-filled">4/4</div>
              <div className="col-risk"><span className="badge-risk low">Low</span></div>
              <div className="col-avatars">
                <span className="avatar-circle">🧑‍🍳</span>
                <span className="avatar-circle">☕</span>
                <span className="avatar-circle">👩‍🍳</span>
                <span className="avatar-circle">👨‍🍳</span>
              </div>
              <button className="btn-view-shift">View</button>
            </div>

            <div className="table-row">
              <div className="col-role">
                <strong>Kitchen Assistant</strong>
              </div>
              <div className="col-time">Sat 17 May, 10:00–18:00</div>
              <div className="col-filled">3/4</div>
              <div className="col-risk"><span className="badge-risk med">Medium</span></div>
              <div className="col-avatars">
                <span className="avatar-circle">👩‍🍳</span>
                <span className="avatar-circle">🧑‍🍳</span>
                <span className="avatar-circle">👨‍🍳</span>
              </div>
              <button className="btn-view-shift">View</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  {/* Career Growth Pathway */}
  <section className="career-section">
    <div className="section-container">
      <div className="career-box">
        <div className="career-content">
          <h3>Grow your career with SkillHub</h3>
          
          <div className="career-pathway">
            <div className="path-node">
              <span className="path-icon">🍳</span>
              <span>Kitchen Assistant</span>
            </div>
            <span className="path-arrow">&rarr;</span>
            <div className="path-node">
              <span className="path-icon">🍽️</span>
              <span>Experienced Kitchen Assistant</span>
            </div>
            <span className="path-arrow">&rarr;</span>
            <div className="path-node">
              <span className="path-icon">👨‍🍳</span>
              <span>Prep Cook</span>
            </div>
            <span className="path-arrow">&rarr;</span>
            <div className="path-node highlight">
              <span className="path-icon">👔</span>
              <span>Team Lead</span>
            </div>
          </div>
        </div>

        <div className="career-right">
          <p>Build experience, earn badges, and access better shifts and higher pay. Your career path starts here.</p>
          <a href="#growth" className="link-growth">Explore growth opportunities &rarr;</a>
        </div>
      </div>
    </div>
  </section>

  {/* Testimonials Section */}
  <section className="testimonials-section">
    <div className="section-container">
      <h2 className="centered-title">Loved by customers, workers and businesses</h2>

      <div className="reviews-grid">
        <div className="review-card">
          <div className="stars">★★★★★</div>
          <p className="review-text">&ldquo;Booked a plumber at 8am, fixed by 10am. Brilliant experience.&rdquo;</p>
          <div className="reviewer">
            <Image src="/assets/daniel_morgan.jpg" alt="James W." width={40} height={40} className="reviewer-img" />
            <div>
              <h5>James W.</h5>
              <p className="muted">Homeowner, London</p>
            </div>
          </div>
        </div>

        <div className="review-card">
          <div className="stars">★★★★★</div>
          <p className="review-text">&ldquo;I fill shifts fast and the payments are always on time. Great platform.&rdquo;</p>
          <div className="reviewer">
            <Image src="/assets/maria_santos.jpg" alt="Maria S." width={40} height={40} className="reviewer-img" />
            <div>
              <h5>Maria S.</h5>
              <p className="muted">Kitchen Assistant</p>
            </div>
          </div>
        </div>

        <div className="review-card">
          <div className="stars">★★★★★</div>
          <p className="review-text">&ldquo;SkillHub helps us run a tight operation with less stress and lower no-show rates.&rdquo;</p>
          <div className="reviewer">
            <div className="reviewer-logo">SOHO<br />CAFÉ</div>
            <div>
              <h5>Soho Café</h5>
              <p className="muted">Business</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  {/* Bottom AI Assistant Banner */}
  <section className="bottom-ask-section">
    <div className="section-container">
      <div className="ask-card">
        <div className="ask-text">
          <h3>Still not sure? Just ask.</h3>
          <p>Use our AI to describe your need—get matched in seconds.</p>
        </div>

        <div className="ask-composer">
          <input type="text" placeholder="What do you need help with?" className="bottom-input" />
          <button className="tool-icon-btn">🎤 Speak</button>
          <button className="tool-icon-btn">📷 Photo</button>
          <button className="btn-primary">Find help</button>
        </div>
      </div>
    </div>
  </section>

  {/* Footer */}
  <footer className="footer-v2">
    <div className="section-container">
      <div className="footer-grid-v2">
        <div className="footer-brand-v2">
          <a href="#" className="brand-logo light">
            <svg className="logo-icon" viewBox="0 0 32 32" fill="none">
              <circle cx="10" cy="16" r="6" fill="#FF5A1F"/>
              <circle cx="22" cy="10" r="4" fill="#FFFFFF"/>
              <circle cx="22" cy="22" r="4" fill="#FFFFFF"/>
              <line x1="14.5" y1="13.5" x2="18.5" y2="11.5" stroke="#FFFFFF" strokeWidth="2"/>
              <line x1="14.5" y1="18.5" x2="18.5" y2="20.5" stroke="#FFFFFF" strokeWidth="2"/>
            </svg>
            <span className="logo-text font-bold">WORVO <span className="text-xs font-normal text-slate-400">by SkillHub</span></span>
          </a>
          <p className="brand-sub">The verified platform for physical work. On-demand jobs, shifts and tasks powered by ATLAS Verified Workforce Infrastructure.</p>
          <div className="social-icons">
            <a href="#">FB</a>
            <a href="#">IG</a>
            <a href="#">LN</a>
            <a href="#">YT</a>
          </div>
        </div>

        <div className="footer-col">
          <h5>Platform</h5>
          <ul>
            <li><Link href="/jobs">Jobs</Link></li>
            <li><Link href="/shifts">Shifts</Link></li>
            <li><a href="#services">Services</a></li>
            <li><a href="#how-it-works">How it Works</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h5>For businesses</h5>
          <ul>
            <li><Link href="/onboarding/employer">Hire People</Link></li>
            <li><Link href="/onboarding/employer">Business Portal</Link></li>
            <li><a href="#">Pricing</a></li>
            <li><a href="#">Enterprise</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h5>For workers</h5>
          <ul>
            <li><Link href="/shifts">Find shifts</Link></li>
            <li><Link href="/onboarding/worker">WorkPass</Link></li>
            <li><Link href="/dashboard/worker">My Shifts</Link></li>
            <li><a href="#">Support</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h5>Company</h5>
          <ul>
            <li><a href="#">About us</a></li>
            <li><a href="#">Careers</a></li>
            <li><a href="#">Press</a></li>
            <li><a href="#">Contact</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h5>Legal</h5>
          <ul>
            <li><a href="#">Terms of service</a></li>
            <li><a href="#">Privacy policy</a></li>
            <li><a href="#">Cookie policy</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom-v2">
        <p>&copy; 2026 WORVO / SkillHub. All rights reserved.</p>
        <div className="bottom-controls">
          <span className="ctrl">📍 Dhaka, BD ▾</span>
          <span className="ctrl">🌐 EN ▾</span>
        </div>
      </div>
    </div>
  </footer>

  

    </>
  );
}
