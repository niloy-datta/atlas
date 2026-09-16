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

  const formatRate = (ratePence: number, currency: string = "BDT") => {
    const symbol = currency === "GBP" ? "£" : currency === "EUR" ? "€" : currency === "USD" ? "$" : "৳";
    const num = ratePence / 100;
    return `${symbol}${currency === "GBP" || num % 1 !== 0 ? num.toFixed(2) : num.toFixed(0)}`;
  };

  const formatTotalPayout = (ratePence: number, durationHours: number, currency: string = "BDT") => {
    const symbol = currency === "GBP" ? "£" : currency === "EUR" ? "€" : currency === "USD" ? "$" : "৳";
    const total = (ratePence / 100) * durationHours;
    return `${symbol}${currency === "GBP" || total % 1 !== 0 ? total.toFixed(2) : total.toFixed(0)}`;
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100">
      {/* Header */}
      <header className="bg-[#0b1120]/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-extrabold text-xl text-white tracking-tight flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 inline-block shadow-[0_0_10px_#10B981]" />
              WORVO <span className="text-xs font-normal text-slate-400">Shifts</span>
            </Link>
            <span className="text-xs px-2.5 py-0.5 bg-emerald-950/60 text-emerald-400 font-semibold rounded-full border border-emerald-800/60">
              Verified Marketplace
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/jobs"
              className="text-sm font-semibold text-slate-300 hover:text-white transition"
            >
              Jobs Marketplace
            </Link>
            <Link
              href="/dashboard/worker"
              className="text-sm font-semibold text-slate-300 hover:text-white transition"
            >
              Worker Portal
            </Link>
            <Link
              href="/shifts/create"
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg text-sm font-semibold hover:brightness-110 shadow-lg shadow-emerald-600/20 transition"
            >
              Post a Shift
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Search Section */}
      <section className="bg-gradient-to-b from-[#0e1626] to-[#070b14] border-b border-slate-800/80 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Discover Verified Hourly Shifts
          </h1>
          <p className="text-slate-400 text-base max-w-2xl mx-auto">
            Find guaranteed shifts in Dhaka, BD with clear pay, instant skill verification, and fast capacity booking.
          </p>

          <form onSubmit={handleSearchSubmit} className="bg-[#0b1120] border border-slate-800 p-2.5 rounded-2xl shadow-2xl flex flex-col sm:flex-row gap-2 mt-6">
            <div className="flex-1 flex items-center px-3 py-2 bg-[#070b14] border border-slate-800/80 rounded-xl">
              <span className="text-slate-500 mr-2">🔍</span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Shift title, trade, or role (e.g. Waiter, Warehouse)..."
                className="w-full bg-transparent text-slate-100 placeholder-slate-500 outline-none text-sm"
              />
            </div>

            <div className="flex items-center px-3 py-2 bg-[#070b14] border border-slate-800/80 rounded-xl">
              <span className="text-slate-400 text-xs font-semibold mr-1.5">Min ৳/hr:</span>
              <input
                type="number"
                min="0"
                step="50"
                value={minRatePounds}
                onChange={(e) => setMinRatePounds(e.target.value)}
                placeholder="350"
                className="w-20 bg-transparent text-slate-100 placeholder-slate-500 outline-none text-sm font-medium"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl text-sm hover:brightness-110 shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-1.5"
            >
              Search
            </button>
          </form>

          {/* Location Toggle */}
          <div className="flex items-center justify-center gap-4 text-xs text-slate-400 pt-2">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={useLocation}
                onChange={(e) => setUseLocation(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-emerald-500"
              />
              <span>Filter by Radius</span>
            </label>

            {useLocation && (
              <div className="flex items-center gap-2">
                <span>Within</span>
                <select
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(Number(e.target.value))}
                  className="bg-slate-900 text-slate-200 rounded px-2.5 py-1 border border-slate-800 outline-none text-xs"
                >
                  <option value={5}>5 km</option>
                  <option value={10}>10 km</option>
                  <option value={25}>25 km</option>
                  <option value={50}>50 km</option>
                </select>
                <span>of Dhaka City Center</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Results Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-400">
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
                    <span className="text-xs px-2.5 py-1 font-bold rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                        {shift.capacity} slot{shift.capacity === 1 ? "" : "s"}
                      </span>
                      {shift.distanceMeters !== undefined && shift.distanceMeters !== null && (
                        <span className="text-xs text-emerald-400 font-semibold">
                          📍 {(shift.distanceMeters / 1000).toFixed(1)} km away
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-white group-hover:text-emerald-400 transition line-clamp-2">
                      {shift.title}
                    </h3>

                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <span className="font-medium text-slate-300">{shift.organizationName}</span>
                      {shift.organizationVerificationStatus === "VERIFIED" && (
                        <span className="text-blue-400 font-bold" title="Verified Business">✓</span>
                      )}
                    </div>

                    {/* Shift Time Interval Box */}
                    <div className="bg-[#070b14] p-3 rounded-xl border border-slate-800/90 space-y-1">
                      <div className="text-xs font-bold text-slate-200 flex items-center justify-between">
                        <span>🗓️ {interval.dateStr}</span>
                        <span className="text-slate-400 font-normal">{interval.durationStr}</span>
                      </div>
                      <div className="text-xs text-slate-400 font-medium">
                        ⏰ {interval.timeStr} ({shift.timezone})
                      </div>
                    </div>

                    {shift.formattedAddress && (
                      <p className="text-xs text-slate-500 truncate">
                        📍 {shift.formattedAddress}
                      </p>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <div>
                      <span className="block text-slate-500 font-medium">Hourly Rate</span>
                      <span className="font-extrabold text-emerald-400 text-sm">
                        {formatRate(shift.hourlyRatePence, shift.currency)}/hr
                      </span>
                      <span className="block text-[11px] text-teal-300 font-semibold">
                        ~{formatTotalPayout(shift.hourlyRatePence, interval.durationHours, shift.currency)} est. pay
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="block text-slate-500 font-medium">Requirements</span>
                      <span className="font-semibold text-slate-300">
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
              className="px-4 py-2 border border-slate-800 rounded-lg text-sm font-semibold bg-[#0e1626] text-slate-200 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm font-semibold text-slate-400">
              Page {page + 1} of {Math.ceil(total / 12)}
            </span>
            <button
              disabled={(page + 1) * 12 >= total || loading}
              onClick={() => fetchShifts(page + 1)}
              className="px-4 py-2 border border-slate-800 rounded-lg text-sm font-semibold bg-[#0e1626] text-slate-200 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

