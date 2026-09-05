"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { searchShifts, ShiftSummaryView } from "../../lib/api/shifts";

export default function ShiftMarketplacePage() {
  const [shifts, setShifts] = useState<ShiftSummaryView[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [query, setQuery] = useState("");
  const [minRatePounds, setMinRatePounds] = useState<string>("");
  const [useLocation, setUseLocation] = useState(false);
  const [radiusKm, setRadiusKm] = useState(25);
  const latitude = 51.5074;
  const longitude = -0.1278;

  const fetchShifts = useCallback(async (pageNum: number) => {
    try {
      setLoading(true);
      setError(null);
      const minPence = minRatePounds ? Math.round(parseFloat(minRatePounds) * 100) : undefined;
      const res = await searchShifts({
        query: query.trim() || undefined,
        minHourlyRatePence: minPence,
        lat: useLocation ? latitude : undefined,
        lon: useLocation ? longitude : undefined,
        radiusKm: useLocation ? radiusKm : undefined,
        page: pageNum,
        size: 12,
      });
      setShifts(res.items);
      setTotal(res.total);
      setPage(res.page);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load shifts");
    } finally {
      setLoading(false);
    }
  }, [query, minRatePounds, useLocation, radiusKm, latitude, longitude]);

  useEffect(() => {
    let active = true;
    async function init() {
      try {
        const minPence = minRatePounds ? Math.round(parseFloat(minRatePounds) * 100) : undefined;
        const res = await searchShifts({
          query: query.trim() || undefined,
          minHourlyRatePence: minPence,
          lat: useLocation ? latitude : undefined,
          lon: useLocation ? longitude : undefined,
          radiusKm: useLocation ? radiusKm : undefined,
          page: 0,
          size: 12,
        });
        if (active) {
          setShifts(res.items);
          setTotal(res.total);
          setPage(res.page);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load shifts");
          setLoading(false);
        }
      }
    }
    init();
    return () => {
      active = false;
    };
  }, [query, minRatePounds, useLocation, radiusKm, latitude, longitude]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchShifts(0);
  };

  const formatInterval = (startIso: string, endIso: string, timezone: string) => {
    try {
      const start = new Date(startIso);
      const end = new Date(endIso);
      const durationHours = Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60));

      const dateStr = start.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        timeZone: timezone || "UTC",
      });

      const timeStr = `${start.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: timezone || "UTC",
      })} – ${end.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: timezone || "UTC",
      })}`;

      return {
        dateStr,
        timeStr,
        durationStr: `${durationHours.toFixed(1).replace(/\.0$/, "")} hrs`,
        durationHours,
      };
    } catch {
      return { dateStr: startIso, timeStr: endIso, durationStr: "", durationHours: 0 };
    }
  };

  const formatRate = (ratePence: number, currency: string = "GBP") => {
    const symbol = currency === "GBP" ? "£" : currency === "EUR" ? "€" : "$";
    return `${symbol}${(ratePence / 100).toFixed(2)}`;
  };

  const formatTotalPayout = (ratePence: number, durationHours: number, currency: string = "GBP") => {
    const symbol = currency === "GBP" ? "£" : currency === "EUR" ? "€" : "$";
    const total = (ratePence / 100) * durationHours;
    return `${symbol}${total.toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-extrabold text-xl text-slate-900 tracking-tight flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 inline-block" />
              SkillHub
            </Link>
            <span className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 font-semibold rounded border border-emerald-200">
              Shift Roster & Marketplace
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/jobs"
              className="text-sm font-semibold text-slate-600 hover:text-slate-900"
            >
              Jobs Marketplace
            </Link>
            <Link
              href="/dashboard/worker"
              className="text-sm font-semibold text-slate-600 hover:text-slate-900"
            >
              Worker Portal
            </Link>
            <Link
              href="/shifts/create"
              className="px-3.5 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition"
            >
              Post a Shift
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Search Section */}
      <section className="bg-gradient-to-b from-slate-950 to-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Discover Verified Hourly Shifts
          </h1>
          <p className="text-slate-300 text-base max-w-2xl mx-auto">
            Find guaranteed shifts with clear pay, instant skill verification, and fast capacity booking.
          </p>

          <form onSubmit={handleSearchSubmit} className="bg-white p-3 rounded-2xl shadow-xl flex flex-col sm:flex-row gap-2 mt-6">
            <div className="flex-1 flex items-center px-3 py-2 bg-slate-50 rounded-xl">
              <span className="text-slate-400 mr-2">🔍</span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Shift title, trade, or role..."
                className="w-full bg-transparent text-slate-900 placeholder-slate-400 outline-none text-sm"
              />
            </div>

            <div className="flex items-center px-3 py-2 bg-slate-50 rounded-xl">
              <span className="text-slate-500 text-xs font-semibold mr-1.5">Min £/hr:</span>
              <input
                type="number"
                min="0"
                step="0.50"
                value={minRatePounds}
                onChange={(e) => setMinRatePounds(e.target.value)}
                placeholder="15.00"
                className="w-20 bg-transparent text-slate-900 placeholder-slate-400 outline-none text-sm font-medium"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl text-sm hover:bg-emerald-700 transition flex items-center justify-center gap-1.5"
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
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Filter by Radius</span>
            </label>

            {useLocation && (
              <div className="flex items-center gap-2">
                <span>Within</span>
                <select
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(Number(e.target.value))}
                  className="bg-slate-800 text-white rounded px-2 py-0.5 border border-slate-700 outline-none"
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
            {loading ? "Searching shifts..." : `${total} active shift${total === 1 ? "" : "s"} available`}
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : shifts.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
            <div className="text-4xl">⏱️</div>
            <h2 className="text-lg font-bold text-slate-900">No shifts match your search</h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Try adjusting your keywords, expanding your search radius, or lowering minimum rate filters.
            </p>
            <button
              onClick={() => {
                setQuery("");
                setMinRatePounds("");
                setUseLocation(false);
              }}
              className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 underline"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shifts.map((shift) => {
              const interval = formatInterval(shift.startTime, shift.endTime, shift.timezone);
              return (
                <Link
                  key={shift.id}
                  href={`/shifts/${shift.id}`}
                  className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs px-2.5 py-1 font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {shift.capacity} slot{shift.capacity === 1 ? "" : "s"}
                      </span>
                      {shift.distanceMeters !== undefined && shift.distanceMeters !== null && (
                        <span className="text-xs text-emerald-600 font-semibold">
                          📍 {(shift.distanceMeters / 1000).toFixed(1)} km away
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-slate-900 group-hover:text-emerald-600 transition line-clamp-2">
                      {shift.title}
                    </h3>

                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <span className="font-medium text-slate-800">{shift.organizationName}</span>
                      {shift.organizationVerificationStatus === "VERIFIED" && (
                        <span className="text-blue-600 font-bold" title="Verified Business">✓</span>
                      )}
                    </div>

                    {/* Shift Time Interval Box */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                      <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                        <span>🗓️ {interval.dateStr}</span>
                        <span className="text-slate-500 font-normal">{interval.durationStr}</span>
                      </div>
                      <div className="text-xs text-slate-600 font-medium">
                        ⏰ {interval.timeStr} ({shift.timezone})
                      </div>
                    </div>

                    {shift.formattedAddress && (
                      <p className="text-xs text-slate-500 truncate">
                        📍 {shift.formattedAddress}
                      </p>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="block text-slate-400 font-medium">Hourly Rate</span>
                      <span className="font-extrabold text-slate-900 text-sm">
                        {formatRate(shift.hourlyRatePence, shift.currency)}/hr
                      </span>
                      <span className="block text-[11px] text-emerald-700 font-semibold">
                        ~{formatTotalPayout(shift.hourlyRatePence, interval.durationHours, shift.currency)} est. pay
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="block text-slate-400 font-medium">Requirements</span>
                      <span className="font-semibold text-slate-700">
                        {shift.requiredSkillsCount} skill{shift.requiredSkillsCount === 1 ? "" : "s"}
                        {shift.requiredCredentialsCount > 0 && ` • ${shift.requiredCredentialsCount} cert`}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {total > 12 && (
          <div className="flex justify-center gap-2 pt-6">
            <button
              disabled={page === 0 || loading}
              onClick={() => fetchShifts(page - 1)}
              className="px-4 py-2 border rounded-lg text-sm font-semibold bg-white disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm font-semibold text-slate-600">
              Page {page + 1} of {Math.ceil(total / 12)}
            </span>
            <button
              disabled={(page + 1) * 12 >= total || loading}
              onClick={() => fetchShifts(page + 1)}
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

