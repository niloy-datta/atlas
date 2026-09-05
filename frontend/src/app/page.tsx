"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { firebaseUser, atlasUser, signOut } = useAuth();
  const [composerInput, setComposerInput] = useState("");
  const [activeMode, setActiveMode] = useState<"text" | "speak" | "photo">("text");
  const [interactiveNotice, setInteractiveNotice] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setInteractiveNotice(msg);
    setTimeout(() => setInteractiveNotice(null), 4000);
  };

  const handleModeClick = (mode: "speak" | "photo") => {
    setActiveMode(mode);
    if (mode === "speak") {
      setComposerInput("Voice preview: Leaking pipe under kitchen sink");
    } else if (mode === "photo") {
      setComposerInput("Photo attached: [broken_circuit_breaker.png]");
    }
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
            <circle cx="10" cy="16" r="6" fill="#FF5A1F"/>
            <circle cx="22" cy="10" r="4" fill="#0F172A"/>
            <circle cx="22" cy="22" r="4" fill="#0F172A"/>
            <line x1="14.5" y1="13.5" x2="18.5" y2="11.5" stroke="#0F172A" strokeWidth="2"/>
            <line x1="14.5" y1="18.5" x2="18.5" y2="20.5" stroke="#0F172A" strokeWidth="2"/>
          </svg>
          <span className="logo-text">SkillHub</span>
        </Link>
        <nav className="nav-links">
          <a href="#services" className="nav-link">Services</a>
          <a href="#shifts" className="nav-link">Shifts</a>
          <a href="#business" className="nav-link">Business</a>
          <a href="#how-it-works" className="nav-link">How it Works</a>
        </nav>
      </div>

      <div className="nav-right">
        <div className="location-picker">
          <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" strokeWidth="2" fill="none"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <span>London, UK</span>
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
              className="px-3 py-1.5 bg-orange-50 text-orange-700 hover:bg-orange-100 rounded-lg text-sm font-semibold transition-colors"
            >
              Go to Dashboard →
            </Link>
            <div className="user-badge" data-testid="user-profile-badge">
              <span>{atlasUser?.email || firebaseUser.email}</span>
              {atlasUser?.roles?.[0] && (
                <span className="role-tag">{atlasUser.roles[0].replace("ROLE_", "")}</span>
              )}
            </div>
            <button
              onClick={() => signOut()}
              className="btn-text"
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
        <h1 className="hero-title">Anything breaks.<br />We get it handled.</h1>
        <p className="hero-subtitle">
          One platform for physical work—home services and flexible shifts—built on verified trust and protected payments.
        </p>

        {/* AI Problem Composer */}
        <div className="composer-card">
          <div className="composer-header">
            <span className="sparkle-icon">✨</span>
            <span className="composer-title">AI problem composer</span>
          </div>
          <div className="composer-input-row">
            <input type="text" id="composerInput" placeholder="What do you need help with?" className="composer-input" value={composerInput} onChange={(e) => setComposerInput(e.target.value)} />
          </div>
          <div className="composer-actions">
            <div className="mode-buttons">
              <button className={`mode-btn ${activeMode === "speak" ? "active" : ""}`} onClick={() => handleModeClick("speak")}>
                <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" strokeWidth="2" fill="none"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                <span>Speak</span>
              </button>
              <button className={`mode-btn ${activeMode === "photo" ? "active" : ""}`} onClick={() => handleModeClick("photo")}>
                <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" strokeWidth="2" fill="none"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                <span>Photo</span>
              </button>
            </div>
            <button className="btn-find-help" id="heroSubmitBtn" onClick={handleHeroSubmit}>Find help</button>
          </div>
        </div>

        {/* 3 Pathway Cards */}
        <div className="pathway-grid">
          <div className="pathway-card orange">
            <div className="pathway-icon">
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="#FF5A1F" strokeWidth="2" fill="none"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
            </div>
            <div className="pathway-text">
              <h4>Get a service</h4>
              <p>Book trusted pros for any home or business job</p>
            </div>
            <span className="pathway-arrow">&rsaquo;</span>
          </div>

          <Link href="/register?role=employer" className="pathway-card blue">
            <div className="pathway-icon">
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="#2563EB" strokeWidth="2" fill="none"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div className="pathway-text">
              <h4>Hire workers</h4>
              <p>Fill shifts fast with verified local workers</p>
            </div>
            <span className="pathway-arrow">&rsaquo;</span>
          </Link>

          <Link href="/register?role=worker" className="pathway-card green">
            <div className="pathway-icon">
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="#059669" strokeWidth="2" fill="none"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
            </div>
            <div className="pathway-text">
              <h4>Find work</h4>
              <p>Discover shifts and build your career</p>
            </div>
            <span className="pathway-arrow">&rsaquo;</span>
          </Link>
        </div>

        {interactiveNotice && (
          <div className="mb-6 p-4 rounded-lg bg-orange-50 border border-orange-200 text-orange-800 text-sm flex items-center justify-between" role="status">
            <span>{interactiveNotice}</span>
            <button onClick={() => setInteractiveNotice(null)} className="text-orange-600 font-bold ml-4">✕</button>
          </div>
        )}

        {/* Pilot Indicators */}
        <div className="hero-indicators">
          <div className="indicator-item">
            <span className="dot-green"></span>
            <span>Workforce discovery • <strong>London pilot area</strong></span>
          </div>
          <div className="indicator-item">
            <span className="dot-green"></span>
            <span>SkillProof verification • <strong>Verified identities</strong></span>
          </div>
          <div className="indicator-item">
            <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span>Flexible scheduling • <strong>Shifts across active zones</strong></span>
          </div>
        </div>
      </div>

      {/* Hero Visuals & Floating Status Cards */}
      <div className="hero-visual">
        <div className="pro-image-container">
          <img src="/assets/electrician_hero.jpg" alt="SkillHub Professional" className="hero-bg-img" />

          {/* Card 1: Best Match */}
          <div className="floating-status-card top">
            <span className="status-card-label">Best match preview</span>
            <div className="status-card-body">
              <img src="/assets/daniel_morgan.jpg" alt="Daniel Morgan" className="mini-avatar" />
              <div>
                <h5>Daniel Morgan</h5>
                <p>Plumber</p>
                <div className="mini-rating">★ 4.9 <span className="muted">• Verified WorkPass</span></div>
                <span className="badge-verified">✔ Verified</span>
              </div>
            </div>
          </div>

          {/* Card 2: Shift Filled */}
          <div className="floating-status-card middle">
            <span className="status-card-label">Shift capacity preview</span>
            <div className="status-card-body">
              <div className="shift-icon-box">☕</div>
              <div>
                <h5>Barista shift</h5>
                <p>Fri, 16 May • 16:00–21:00</p>
                <p className="muted">Soho Café</p>
                <span className="badge-filled">Filled</span>
              </div>
            </div>
          </div>

          {/* Card 3: SkillProof Verified */}
          <div className="floating-status-card bottom">
            <span className="status-card-label">Verified Work Outcome</span>
            <div className="status-card-body">
              <div className="shield-icon-box">🛡️</div>
              <div>
                <h5>SkillProof Verified</h5>
                <p className="muted">Audited credentials and proof</p>
                <span className="badge-protected">Verified</span>
              </div>
            </div>
          </div>

          <div className="concept-note">Interactive preview &amp; pilot demonstration</div>
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
            <img src="/assets/maria_santos.jpg" alt="Maria Santos" className="passport-avatar" />
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
            <img src="/assets/barista_shift.jpg" alt="Barista Shift" className="shift-img" />
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
            <img src="/assets/daniel_morgan.jpg" alt="James W." className="reviewer-img" />
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
            <img src="/assets/maria_santos.jpg" alt="Maria S." className="reviewer-img" />
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
            <span className="logo-text">SkillHub</span>
          </a>
          <p className="brand-sub">The platform for physical work. Services and shifts. Powered by ATLAS Verified Workforce Infrastructure.</p>
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
            <li><a href="#">Services</a></li>
            <li><a href="#">Shifts</a></li>
            <li><a href="#">How it Works</a></li>
            <li><a href="#">Safety</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h5>For businesses</h5>
          <ul>
            <li><a href="#">Why SkillHub</a></li>
            <li><a href="#">Pricing</a></li>
            <li><a href="#">Resources</a></li>
            <li><a href="#">Enterprise</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h5>For workers</h5>
          <ul>
            <li><a href="#">Find shifts</a></li>
            <li><a href="#">Career growth</a></li>
            <li><a href="#">Resources</a></li>
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
        <p>&copy; 2026 SkillHub. All rights reserved.</p>
        <div className="bottom-controls">
          <span className="ctrl">📍 London, UK ▾</span>
          <span className="ctrl">🌐 EN ▾</span>
        </div>
      </div>
    </div>
  </footer>

  

    </>
  );
}
