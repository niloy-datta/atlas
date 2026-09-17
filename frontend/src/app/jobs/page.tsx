"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Navbar from "../../components/navigation/Navbar";
import Footer from "../../components/navigation/Footer";
import GoogleMapEmbed, { type GoogleMapMarker, type MapCoordinate } from "../../components/map/GoogleMapEmbed";
import { type MapPin } from "../../components/map/DhakaInteractiveMap";
import WorkspaceSidebar from "../../components/navigation/WorkspaceSidebar";
import { searchJobs } from "../../lib/api/jobs";

interface DemoJob {
  id: string;
  title: string;
  organizationName: string;
  locationName: string;
  jobType: string;
  budgetMin: number;
  budgetMax: number;
  distanceKm: number;
  latitude: number;
  longitude: number;
  tags: string[];
  description: string;
}

const DEMO_JOBS: DemoJob[] = [
  {
    id: "job-1",
    title: "Head Barista & Team Trainer",
    organizationName: "Artisan Coffee Guild",
    locationName: "Gulshan-2, Dhaka",
    jobType: "FULL_TIME",
    budgetMin: 35000,
    budgetMax: 45000,
    distanceKm: 2.5,
    latitude: 23.7925,
    longitude: 90.4147,
    tags: ["Verified", "Hospitality", "Tips & Food"],
    description: "Lead daily specialty espresso bar operations, dial-in seasonal single-origins, and train junior baristas.",
  },
  {
    id: "job-2",
    title: "Senior Industrial Electrician",
    organizationName: "Bengal Power & Automation",
    locationName: "Tejgaon Industrial Area, Dhaka",
    jobType: "CONTRACT",
    budgetMin: 40000,
    budgetMax: 55000,
    distanceKm: 3.8,
    latitude: 23.7658,
    longitude: 90.4005,
    tags: ["Trade Certified", "Safety Inspected", "Immediate"],
    description: "High-voltage switchgear maintenance, 3-phase plant troubleshooting, and automated PLC control checks.",
  },
  {
    id: "job-3",
    title: "Logistics Fleet Dispatcher",
    organizationName: "RapidCargo Bangladesh",
    locationName: "Uttara Sector 3, Dhaka",
    jobType: "FULL_TIME",
    budgetMin: 28000,
    budgetMax: 36000,
    distanceKm: 4.1,
    latitude: 23.8759,
    longitude: 90.3912,
    tags: ["Logistics", "Verified Business"],
    description: "Coordinate citywide van and motorbike deliveries, optimize route turnaround, and handle customer manifests.",
  },
  {
    id: "job-4",
    title: "Commercial Facility Maintenance Tech",
    organizationName: "Apex Facilities Management",
    locationName: "Motijheel C/A, Dhaka",
    jobType: "CONTRACT",
    budgetMin: 30000,
    budgetMax: 42000,
    distanceKm: 3.2,
    latitude: 23.7334,
    longitude: 90.4127,
    tags: ["HVAC", "Plumbing", "Verified"],
    description: "Oversee building plumbing lines, centralized HVAC filter cycles, and regular electrical safety inspections.",
  },
];

export default function JobMarketplacePage() {
  const [jobs, setJobs] = useState<DemoJob[]>(DEMO_JOBS);
  const [userLocation, setUserLocation] = useState<MapCoordinate>({ lat: 23.8103, lng: 90.4125 });

  // Filters
  const [query, setQuery] = useState("");
  const [jobType, setJobType] = useState<string>("");

  const fetchJobsData = useCallback(async () => {
    try {
      const res = await searchJobs({
        query: query.trim() || undefined,
        jobType: jobType || undefined,
        lat: userLocation.lat,
        lon: userLocation.lng,
        radiusKm: 25,
        page: 0,
        size: 12,
      });
      if (res.items && res.items.length > 0) {
        // Map API items
        const mapped = res.items.map((j) => ({
          id: j.id,
          title: j.title,
          organizationName: j.organizationName,
          locationName: j.locationName || "Dhaka, BD",
          jobType: j.jobType,
          budgetMin: j.budgetMinPence ? Math.round(j.budgetMinPence / 100) : 25000,
          budgetMax: j.budgetMaxPence ? Math.round(j.budgetMaxPence / 100) : 35000,
          distanceKm: j.distanceMeters ? Number((j.distanceMeters / 1000).toFixed(1)) : 2.0,
          latitude: j.latitude ?? userLocation.lat,
          longitude: j.longitude ?? userLocation.lng,
          tags: ["Verified Employer", j.jobType],
          description: "Verified role on WORVO workforce platform with secure escrow payment.",
        }));
        setJobs(mapped);
      }
    } catch {
      // Graceful fallback to demo jobs
      setJobs(DEMO_JOBS);
    }
  }, [query, jobType, userLocation]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchJobsData();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [fetchJobsData]);

  const filteredJobs = jobs.filter((job) => {
    if (query && !job.title.toLowerCase().includes(query.toLowerCase()) && !job.organizationName.toLowerCase().includes(query.toLowerCase())) {
      return false;
    }
    if (jobType && job.jobType !== jobType) {
      return false;
    }
    return true;
  });

  const mapMarkers: GoogleMapMarker[] = filteredJobs.map((job) => ({
    id: job.id,
    title: job.title,
    subtitle: job.locationName,
    lat: job.latitude,
    lng: job.longitude,
  }));

  const mapPins: MapPin[] = filteredJobs.map((job, index) => ({
    id: job.id,
    title: job.title,
    area: job.locationName,
    rate: `৳${Math.round(job.budgetMin / 1000)}k+`,
    distanceKm: job.distanceKm,
    x: [68, 79, 42, 58][index % 4],
    y: [34, 52, 63, 43][index % 4],
    type: "job",
  }));

  const sidebarItems = [
    ["⌂", "Dashboard", "/dashboard/worker"],
    ["⌕", "Find Work", "/jobs"],
    ["▣", "My Shifts", "/my-shifts"],
    ["♡", "Saved Jobs", "/jobs"],
    ["✧", "Skills & Certificates", "/skills"],
    ["▤", "Work Passport", "/workpass"],
    ["▣", "Messages", "/messages"],
    ["▥", "Earnings", "/earnings"],
    ["◫", "Career Growth", "/dashboard/worker"],
    ["⚙", "Settings", "/settings"],
  ] as const;

  const categories = ["All", "Hospitality", "Warehouse", "Cleaning", "Logistics", "Construction", "Driving"];

  return (
    <div className="min-h-screen flex flex-col bg-[#050a14] text-slate-100">
      <Navbar />

      <div className="flex flex-1 min-w-0">
        <WorkspaceSidebar />
        <aside className="hidden">
          <nav className="space-y-1" aria-label="Workforce navigation">
            {sidebarItems.map(([icon, label, href]) => (
              <Link
                key={label}
                href={href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition ${label === "Find Work" ? "bg-gradient-to-r from-[#5b19ff] to-[#2563eb] text-white shadow-lg shadow-indigo-900/30" : "text-slate-400 hover:bg-[#102442] hover:text-white"}`}
              >
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/5 text-lg leading-none">{icon}</span>
                <span>{label}</span>
                {label === "Messages" && <span className="ml-auto grid h-5 w-5 place-items-center rounded-full bg-rose-500 text-[10px] text-white">3</span>}
              </Link>
            ))}
          </nav>

          <div className="mt-auto rounded-2xl border border-indigo-500/50 bg-gradient-to-br from-[#151d50] via-[#11153a] to-[#09152b] p-4 shadow-xl shadow-indigo-950/20">
            <div className="mb-3 text-3xl">♛</div>
            <h2 className="text-base font-extrabold text-white">Upgrade to Pro</h2>
            <p className="mt-2 text-[11px] leading-5 text-slate-400">Get priority access to high-paying opportunities.</p>
            <ul className="mt-3 space-y-2 text-[11px] text-slate-300">
              <li>✅ Higher earning potential</li>
              <li>✅ Priority shift access</li>
              <li>✅ Exclusive job alerts</li>
            </ul>
            <button type="button" className="mt-4 w-full rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-3 py-2 text-xs font-bold text-white shadow-lg shadow-violet-900/40">Upgrade Now →</button>
          </div>
        </aside>

        <main id="main-content" className="min-w-0 flex-1 bg-[radial-gradient(circle_at_80%_0%,rgba(36,99,235,.12),transparent_32%),#050a14]">
          <section className="border-b border-[#1b2b46] px-4 pb-5 pt-7 sm:px-6 xl:px-8">
            <div className="mx-auto max-w-[1420px]">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[11px] font-bold text-emerald-300"><span className="h-2 w-2 rounded-full bg-emerald-400" /> DHaka verified marketplace</span>
                  <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Find the right workers.</h1>
                  <p className="mt-2 max-w-2xl text-sm text-slate-400">Discover verified people for every job, shift and local task across Dhaka.</p>
                </div>
                <Link href="/shifts" className="rounded-lg border border-blue-500/40 bg-blue-500/10 px-3 py-2 text-xs font-bold text-blue-300 hover:bg-blue-500/20">Browse hourly shifts →</Link>
              </div>

              <div className="flex flex-col gap-2 rounded-2xl border border-[#233b61] bg-[#09172b]/90 p-2 shadow-2xl shadow-blue-950/20 sm:flex-row">
                <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-[#1f385e] bg-[#061221] px-3 py-2.5 focus-within:border-blue-400">
                  <span className="text-lg text-blue-300">⌕</span>
                  <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search jobs, skills or companies..." className="min-w-0 w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500" />
                </label>
                <select value={jobType} onChange={(e) => setJobType(e.target.value)} className="rounded-xl border border-[#1f385e] bg-[#061221] px-3 py-2.5 text-sm font-semibold text-slate-200 outline-none">
                  <option value="">All Job Types</option><option value="FULL_TIME">Full Time</option><option value="CONTRACT">Contract Work</option><option value="SHIFT">Hourly Shifts</option>
                </select>
                <button type="button" onClick={fetchJobsData} className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-blue-900/30 transition hover:brightness-110">Search</button>
              </div>

              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {categories.map((category, index) => <button key={category} type="button" className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-bold ${index === 0 ? "border-violet-400 bg-violet-600 text-white" : "border-[#294364] bg-[#0b1b32] text-slate-400 hover:text-white"}`}>{category}</button>)}
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-[1420px] px-4 py-5 sm:px-6 xl:px-8">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div><p className="text-sm font-bold text-white">{filteredJobs.length} opportunities near you</p><p className="text-[11px] text-slate-500">Verified jobs matched to your location and skills</p></div>
              <button type="button" className="rounded-lg border border-[#294364] bg-[#0b1b32] px-3 py-2 text-[11px] font-bold text-slate-300">Sort by: <span className="text-white">Best Match⌄</span></button>
            </div>

            <div className="grid items-start gap-4 lg:grid-cols-[minmax(320px,0.9fr)_minmax(420px,1.2fr)] xl:grid-cols-[190px_minmax(330px,0.9fr)_minmax(430px,1.3fr)]">
              <aside className="hidden rounded-2xl border border-[#1f385e] bg-[#081427] p-4 xl:block">
                <div className="mb-4 flex items-center justify-between"><h2 className="text-xs font-extrabold text-white">Filters</h2><button type="button" className="text-[10px] font-bold text-violet-300">Reset</button></div>
                <div className="space-y-5 text-[11px]">
                  <div><p className="mb-2 font-bold text-slate-300">Work type</p><label className="flex gap-2 text-slate-400"><input type="checkbox" defaultChecked /> Shifts <span className="ml-auto">328</span></label><label className="mt-2 flex gap-2 text-slate-400"><input type="checkbox" /> Jobs <span className="ml-auto">142</span></label><label className="mt-2 flex gap-2 text-slate-400"><input type="checkbox" /> Tasks <span className="ml-auto">86</span></label></div>
                  <div><p className="mb-2 font-bold text-slate-300">Category</p>{["Hospitality", "Warehouse", "Cleaning", "Logistics", "Construction"].map((item, i) => <label key={item} className="mt-2 flex gap-2 text-slate-400"><input type="checkbox" defaultChecked={i === 1} /> {item}</label>)}</div>
                  <div><p className="mb-2 font-bold text-slate-300">Distance</p><input type="range" className="w-full accent-violet-500" defaultValue="65" /><div className="mt-1 flex justify-between text-[10px] text-slate-500"><span>Within 10 km</span><span>25 km</span></div></div>
                </div>
                <button type="button" className="mt-5 w-full rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-3 py-2 text-[11px] font-bold text-white">Apply Filters</button>
              </aside>

              <div className="space-y-3">
                {filteredJobs.map((job, index) => (
                  <article key={job.id} className="group rounded-2xl border border-[#203b63] bg-[#0a172b] p-3.5 shadow-lg shadow-black/10 transition hover:border-violet-400/70 hover:bg-[#0d1d36]">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl text-2xl ${["bg-orange-500/20", "bg-blue-500/20", "bg-rose-500/20", "bg-emerald-500/20"][index % 4]}`}>{["☕", "⚡", "🚚", "🛠"][index % 4]}</div>
                      <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-1.5"><span className="text-[9px] font-extrabold uppercase text-slate-400">{job.jobType.replace("_", " ")}</span><span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold text-emerald-300">✓ Verified</span></div><h3 className="mt-1 truncate text-sm font-extrabold text-white group-hover:text-blue-300">{job.title}</h3><p className="truncate text-[11px] text-slate-400">{job.organizationName}</p></div>
                    </div>
                    <p className="mt-3 line-clamp-2 text-[11px] leading-5 text-slate-400">{job.description}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">{job.tags.slice(0, 3).map((tag) => <span key={tag} className="rounded-md border border-blue-400/20 bg-blue-400/10 px-1.5 py-0.5 text-[9px] font-bold text-blue-300">{tag}</span>)}</div>
                    <div className="mt-3 flex items-end justify-between gap-2 border-t border-[#1c3150] pt-3"><div><p className="text-[9px] uppercase text-slate-500">Monthly salary</p><p className="text-sm font-extrabold text-emerald-400">৳{job.budgetMin.toLocaleString()} – ৳{job.budgetMax.toLocaleString()}</p><p className="mt-0.5 text-[10px] text-slate-500">⌖ {job.distanceKm} km • {job.locationName}</p></div><Link href={`/jobs/demo`} className="shrink-0 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-3 py-2 text-[10px] font-extrabold text-white shadow-md shadow-blue-950/30">View Details →</Link></div>
                  </article>
                ))}
              </div>

              <div className="min-w-0"><GoogleMapEmbed query="Your location and nearby jobs" initialCenter={userLocation} markers={mapMarkers} fallbackPins={mapPins} onLocationChange={setUserLocation} heightClass="h-[500px] sm:h-[560px]" /><div className="mt-2 flex items-center justify-between text-[10px] text-slate-500"><span>● Nearby jobs around your location</span><span className="font-bold text-blue-300">{filteredJobs.length} opportunities</span></div></div>
            </div>
          </section>
        </main>
      </div>

      <Footer />
    </div>
  );
}
