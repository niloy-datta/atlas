"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { searchJobs, JobSummary } from "../../lib/api/jobs";

export default function JobMarketplacePage() {
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [query, setQuery] = useState("");
  const [jobType, setJobType] = useState<string>("");
  const [useLocation, setUseLocation] = useState(false);
  const [radiusKm, setRadiusKm] = useState(25);
  const latitude = 51.5074;
  const longitude = -0.1278;

  const fetchJobs = useCallback(async (pageNum: number) => {
    try {
      setLoading(true);
      setError(null);
      const res = await searchJobs({
        query: query.trim() || undefined,
        jobType: jobType || undefined,
        lat: useLocation ? latitude : undefined,
        lon: useLocation ? longitude : undefined,
        radiusKm: useLocation ? radiusKm : undefined,
        page: pageNum,
        size: 12,
      });
      setJobs(res.items);
      setTotal(res.total);
      setPage(res.page);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }, [query, jobType, useLocation, radiusKm, latitude, longitude]);

  useEffect(() => {
    let active = true;
    async function init() {
      try {
        const res = await searchJobs({
          query: query.trim() || undefined,
          jobType: jobType || undefined,
          lat: useLocation ? latitude : undefined,
          lon: useLocation ? longitude : undefined,
          radiusKm: useLocation ? radiusKm : undefined,
          page: 0,
          size: 12,
        });
        if (active) {
          setJobs(res.items);
          setTotal(res.total);
          setPage(res.page);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load jobs");
          setLoading(false);
        }
      }
    }
    init();
    return () => {
      active = false;
    };
  }, [query, jobType, useLocation, radiusKm, latitude, longitude]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs(0);
  };

  const formatBudget = (min?: number, max?: number, currency: string = "GBP") => {
    const symbol = currency === "GBP" ? "£" : currency === "EUR" ? "€" : "$";
    if (min && max) {
      return `${symbol}${(min / 100).toFixed(2)} – ${symbol}${(max / 100).toFixed(2)}`;
    }
    if (min) return `From ${symbol}${(min / 100).toFixed(2)}`;
    if (max) return `Up to ${symbol}${(max / 100).toFixed(2)}`;
    return "Rate Negotiable";
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-extrabold text-xl text-slate-900 tracking-tight flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-orange-600 inline-block" />
              SkillHub
            </Link>
            <span className="text-xs px-2 py-0.5 bg-orange-50 text-orange-700 font-semibold rounded border border-orange-200">
              Verified Marketplace
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/worker"
              className="text-sm font-semibold text-slate-600 hover:text-slate-900"
            >
              Worker Portal
            </Link>
            <Link
              href="/jobs/create"
              className="px-3.5 py-2 bg-orange-600 text-white rounded-lg text-sm font-semibold hover:bg-orange-700 transition"
            >
              Post a Job
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Search Section */}
      <section className="bg-gradient-to-b from-slate-900 to-slate-800 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Find Verified Workforce Engagements
          </h1>
          <p className="text-slate-300 text-base max-w-2xl mx-auto">
            Discover verified shifts, service calls, and contracting opportunities with instant skill matching.
          </p>

          <form onSubmit={handleSearchSubmit} className="bg-white p-3 rounded-2xl shadow-xl flex flex-col sm:flex-row gap-2 mt-6">
            <div className="flex-1 flex items-center px-3 py-2 bg-slate-50 rounded-xl">
              <span className="text-slate-400 mr-2">🔍</span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Job title, trade, or keyword..."
                className="w-full bg-transparent text-slate-900 placeholder-slate-400 outline-none text-sm"
              />
            </div>

            <select
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
              className="px-3 py-2 bg-slate-50 text-slate-900 rounded-xl outline-none text-sm font-medium border-0"
            >
              <option value="">All Job Types</option>
              <option value="SHIFT">Hourly Shifts</option>
              <option value="SERVICE">Service Calls</option>
              <option value="CONTRACT">Contract Work</option>
            </select>

            <button
              type="submit"
              className="px-6 py-2.5 bg-orange-600 text-white font-semibold rounded-xl text-sm hover:bg-orange-700 transition flex items-center justify-center gap-1.5"
            >
              Search
            </button>
          </form>

          {/* Location Toggle */}
          <div className="flex items-center justify-center gap-4 text-xs text-slate-300 pt-2">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={useLocation}
                onChange={(e) => setUseLocation(e.target.checked)}
                className="rounded text-orange-600 focus:ring-orange-500"
              />
              <span>Filter by Radius</span>
            </label>

            {useLocation && (
              <div className="flex items-center gap-2">
                <span>Within</span>
                <select
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(Number(e.target.value))}
                  className="bg-slate-700 text-white rounded px-2 py-0.5 border border-slate-600 outline-none"
                >
                  <option value={10}>10 km</option>
                  <option value={25}>25 km</option>
                  <option value={50}>50 km</option>
                  <option value={100}>100 km</option>
                </select>
                <span>of Greater London</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Results Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-600">
            {loading ? "Searching..." : `${total} open engagement${total === 1 ? "" : "s"} found`}
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
            <div className="text-4xl">🔍</div>
            <h2 className="text-lg font-bold text-slate-900">No jobs match your search</h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Try adjusting your keywords, expanding your search radius, or clearing job type filters.
            </p>
            <button
              onClick={() => {
                setQuery("");
                setJobType("");
                setUseLocation(false);
              }}
              className="text-sm font-semibold text-orange-600 hover:text-orange-700 underline"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-orange-500 hover:shadow-md transition flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs px-2.5 py-1 font-semibold rounded-full bg-slate-100 text-slate-700">
                      {job.jobType}
                    </span>
                    {job.distanceMeters !== undefined && job.distanceMeters !== null && (
                      <span className="text-xs text-orange-600 font-semibold">
                        📍 {(job.distanceMeters / 1000).toFixed(1)} km away
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-slate-900 group-hover:text-orange-600 transition line-clamp-2">
                    {job.title}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <span className="font-medium text-slate-800">{job.organizationName}</span>
                    {job.organizationVerificationStatus === "VERIFIED" && (
                      <span className="text-blue-600 font-bold" title="Verified Business">✓</span>
                    )}
                  </div>

                  {job.formattedAddress && (
                    <p className="text-xs text-slate-500 truncate">
                      📍 {job.formattedAddress}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="block text-slate-400 font-medium">Compensation</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {formatBudget(job.budgetMinPence, job.budgetMaxPence, job.currency)}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="block text-slate-400 font-medium">Requirements</span>
                    <span className="font-semibold text-slate-700">
                      {job.requiredSkillsCount} skill{job.requiredSkillsCount === 1 ? "" : "s"}
                      {job.requiredCredentialsCount > 0 && ` • ${job.requiredCredentialsCount} cert`}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > 12 && (
          <div className="flex justify-center gap-2 pt-6">
            <button
              disabled={page === 0 || loading}
              onClick={() => fetchJobs(page - 1)}
              className="px-4 py-2 border rounded-lg text-sm font-semibold bg-white disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm font-semibold text-slate-600">
              Page {page + 1} of {Math.ceil(total / 12)}
            </span>
            <button
              disabled={(page + 1) * 12 >= total || loading}
              onClick={() => fetchJobs(page + 1)}
              className="px-4 py-2 border rounded-lg text-sm font-semibold bg-white disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
