"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/navigation/Navbar";
import WorkspaceSidebar from "../../components/navigation/WorkspaceSidebar";
import { useAuth } from "../../context/AuthContext";
import {
  AvailabilityOverride,
  AvailabilityRule,
  ResolvedAvailability,
  createAvailabilityOverride,
  createAvailabilityRule,
  deleteAvailabilityOverride,
  deleteAvailabilityRule,
  listAvailabilityOverrides,
  listAvailabilityRules,
  resolveAvailability,
} from "../../lib/api/availability";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const today = () => new Date().toISOString().slice(0, 10);

export default function AvailabilityPage() {
  const { firebaseUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [overrides, setOverrides] = useState<AvailabilityOverride[]>([]);
  const [resolved, setResolved] = useState<ResolvedAvailability | null>(null);
  const [day, setDay] = useState(1);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("17:00");
  const [timezone, setTimezone] = useState("Asia/Dhaka");
  const [offDate, setOffDate] = useState(today());
  const [resolveDate, setResolveDate] = useState(today());
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !firebaseUser) {
      router.push("/login");
      return;
    }
    if (!firebaseUser) return;

    (async () => {
      try {
        const from = new Date();
        const until = new Date();
        until.setDate(until.getDate() + 60);
        const [r, o] = await Promise.all([
          listAvailabilityRules(),
          listAvailabilityOverrides(from.toISOString().slice(0, 10), until.toISOString().slice(0, 10)),
        ]);
        setRules(r);
        setOverrides(o);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load availability");
      } finally {
        setBusy(false);
      }
    })();
  }, [firebaseUser, authLoading, router]);

  async function addRule(event: FormEvent) {
    event.preventDefault();
    try {
      const row = await createAvailabilityRule({
        dayOfWeek: day,
        startLocal: start + ":00",
        endLocal: end + ":00",
        timezone,
      });
      setRules((current) => [...current, row].sort((a, b) => a.dayOfWeek - b.dayOfWeek));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create rule");
    }
  }

  async function addDayOff(event: FormEvent) {
    event.preventDefault();
    try {
      const row = await createAvailabilityOverride({
        date: offDate,
        type: "UNAVAILABLE",
        timezone,
      });
      setOverrides((current) => [...current, row].sort((a, b) => a.date.localeCompare(b.date)));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create override");
    }
  }

  if (authLoading || busy) {
    return <div className="grid min-h-screen place-items-center bg-[#080d1a] text-slate-300">Loading availability…</div>;
  }

  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100">
      <Navbar />
      <div className="flex min-w-0">
        <WorkspaceSidebar />
        <main className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl space-y-6">
            <header className="rounded-2xl border border-slate-800 bg-[#0e1626] p-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">Worker schedule</p>
              <h1 className="mt-2 text-3xl font-extrabold">Availability & Overrides</h1>
              <p className="mt-2 text-sm text-slate-400">Recurring local hours are resolved with IANA timezone and DST rules.</p>
            </header>

            {error && <div className="rounded-xl border border-red-500/30 bg-red-950/30 p-4 text-sm text-red-200">{error}</div>}

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-2xl border border-slate-800 bg-[#0e1626] p-5">
                <h2 className="text-lg font-bold">Recurring weekly hours</h2>
                <form onSubmit={addRule} className="mt-4 grid grid-cols-2 gap-3">
                  <select value={day} onChange={(e) => setDay(Number(e.target.value))}
                    className="col-span-2 rounded-xl border border-slate-700 bg-[#080d1a] px-3 py-2 text-sm">
                    {DAYS.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}
                  </select>
                  <input type="time" value={start} onChange={(e) => setStart(e.target.value)}
                    className="rounded-xl border border-slate-700 bg-[#080d1a] px-3 py-2 text-sm" />
                  <input type="time" value={end} onChange={(e) => setEnd(e.target.value)}
                    className="rounded-xl border border-slate-700 bg-[#080d1a] px-3 py-2 text-sm" />
                  <input value={timezone} onChange={(e) => setTimezone(e.target.value)}
                    className="col-span-2 rounded-xl border border-slate-700 bg-[#080d1a] px-3 py-2 text-sm"
                    placeholder="Asia/Dhaka" />
                  <button className="col-span-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold">Add Window</button>
                </form>

                <div className="mt-5 space-y-2">
                  {rules.length === 0 && <p className="text-sm text-slate-500">No recurring windows yet.</p>}
                  {rules.map((rule) => (
                    <div key={rule.id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-[#080d1a] p-3">
                      <div>
                        <p className="text-sm font-bold">{DAYS[rule.dayOfWeek - 1]}</p>
                        <p className="text-xs text-slate-400">{rule.startLocal.slice(0, 5)}–{rule.endLocal.slice(0, 5)} · {rule.timezone}</p>
                      </div>
                      <button type="button" className="text-xs font-bold text-rose-400"
                        onClick={async () => {
                          await deleteAvailabilityRule(rule.id);
                          setRules((current) => current.filter((item) => item.id !== rule.id));
                        }}>
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-800 bg-[#0e1626] p-5">
                <h2 className="text-lg font-bold">Day-off overrides</h2>
                <form onSubmit={addDayOff} className="mt-4 flex gap-3">
                  <input type="date" value={offDate} onChange={(e) => setOffDate(e.target.value)}
                    className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-[#080d1a] px-3 py-2 text-sm" />
                  <button className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold">Mark Unavailable</button>
                </form>
                <div className="mt-5 space-y-2">
                  {overrides.length === 0 && <p className="text-sm text-slate-500">No upcoming overrides.</p>}
                  {overrides.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-[#080d1a] p-3">
                      <div>
                        <p className="text-sm font-bold">{item.date}</p>
                        <p className="text-xs text-amber-300">{item.type} · {item.timezone}</p>
                      </div>
                      <button type="button" className="text-xs font-bold text-rose-400"
                        onClick={async () => {
                          await deleteAvailabilityOverride(item.id);
                          setOverrides((current) => current.filter((row) => row.id !== item.id));
                        }}>
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <section className="rounded-2xl border border-slate-800 bg-[#0e1626] p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <label className="flex-1 text-xs font-semibold text-slate-400">
                  Inspect resolved date
                  <input type="date" value={resolveDate} onChange={(e) => setResolveDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-[#080d1a] px-3 py-2 text-sm text-white" />
                </label>
                <button type="button"
                  onClick={async () => setResolved(await resolveAvailability(resolveDate))}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold">
                  Resolve
                </button>
              </div>
              {resolved && (
                <div className="mt-4 rounded-xl border border-slate-800 bg-[#080d1a] p-4">
                  <div className="flex justify-between gap-3">
                    <strong>{resolved.date}</strong>
                    <span className="text-xs font-bold text-blue-300">{resolved.source}</span>
                  </div>
                  {resolved.windows.length === 0 ? (
                    <p className="mt-3 text-sm text-slate-500">Unavailable on this date.</p>
                  ) : resolved.windows.map((window) => (
                    <div key={window.startsAt + window.endsAt} className="mt-3 rounded-lg bg-white/5 p-3 text-xs text-slate-300">
                      <p>{new Date(window.startsAt).toLocaleString()} → {new Date(window.endsAt).toLocaleString()}</p>
                      <p className="mt-1 text-slate-500">{window.timezone} · {window.durationMinutes} real minutes</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
