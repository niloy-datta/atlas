"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/navigation/Navbar";
import WorkspaceSidebar from "../../components/navigation/WorkspaceSidebar";
import { useAuth } from "../../context/AuthContext";
import { listOrganizations } from "../../lib/api/organizations";
import { listOrganizationJobs, JobSummary } from "../../lib/api/jobs";
import { listOrganizationShifts, ShiftSummaryView } from "../../lib/api/shifts";
import {
  addWorkforcePoolMember,
  createWorkforcePool,
  listWorkforcePoolMembers,
  listWorkforcePools,
  removeWorkforcePoolMember,
  WorkforcePool,
  WorkforcePoolMember,
} from "../../lib/api/workforce";
import { getJobMatches, getShiftMatches, MatchCandidate, MatchResponse } from "../../lib/api/matching";
import { reserveWorker } from "../../lib/api/reservations";

export default function WorkforcePage() {
  const { firebaseUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [organizationId, setOrganizationId] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [pools, setPools] = useState<WorkforcePool[]>([]);
  const [selectedPoolId, setSelectedPoolId] = useState("");
  const [members, setMembers] = useState<WorkforcePoolMember[]>([]);
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [shifts, setShifts] = useState<ShiftSummaryView[]>([]);
  const [targetType, setTargetType] = useState<"JOB" | "SHIFT">("SHIFT");
  const [targetId, setTargetId] = useState("");
  const [matches, setMatches] = useState<MatchResponse | null>(null);
  const [poolName, setPoolName] = useState("");
  const [poolDescription, setPoolDescription] = useState("");
  const [busy, setBusy] = useState(true);
  const [actionBusy, setActionBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !firebaseUser) {
      router.push("/login");
      return;
    }
    if (!firebaseUser) return;

    (async () => {
      try {
        setBusy(true);
        const orgs = await listOrganizations();
        if (orgs.length === 0) {
          router.push("/onboarding/employer");
          return;
        }
        const org = orgs[0];
        setOrganizationId(org.id);
        setOrganizationName(org.name);

        const [poolRows, jobPage, shiftPage] = await Promise.all([
          listWorkforcePools(org.id),
          listOrganizationJobs(org.id, { size: 50 }),
          listOrganizationShifts(org.id, { size: 50 }),
        ]);
        setPools(poolRows);
        setJobs(jobPage.items);
        setShifts(shiftPage.items);

        const firstPool = poolRows[0]?.id ?? "";
        setSelectedPoolId(firstPool);
        if (firstPool) {
          setMembers(await listWorkforcePoolMembers(org.id, firstPool));
        }

        const firstShift = shiftPage.items.find((item) => item.status === "PUBLISHED")?.id
          ?? shiftPage.items[0]?.id
          ?? "";
        if (firstShift) {
          setTargetType("SHIFT");
          setTargetId(firstShift);
        } else if (jobPage.items[0]) {
          setTargetType("JOB");
          setTargetId(jobPage.items[0].id);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load workforce workspace.");
      } finally {
        setBusy(false);
      }
    })();
  }, [firebaseUser, authLoading, router]);

  useEffect(() => {
    if (!organizationId || !selectedPoolId) return;
    listWorkforcePoolMembers(organizationId, selectedPoolId)
      .then(setMembers)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load pool members."));
  }, [organizationId, selectedPoolId]);

  const targets = useMemo(
    () => targetType === "SHIFT" ? shifts : jobs,
    [targetType, shifts, jobs],
  );

  const handleCreatePool = async (event: FormEvent) => {
    event.preventDefault();
    if (!organizationId || !poolName.trim()) return;
    try {
      setActionBusy(true);
      setError(null);
      const created = await createWorkforcePool(organizationId, {
        name: poolName.trim(),
        description: poolDescription.trim() || undefined,
      });
      setPools((current) => [created, ...current]);
      setSelectedPoolId(created.id);
      setPoolName("");
      setPoolDescription("");
      setMessage(`Created workforce pool “${created.name}”.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create workforce pool.");
    } finally {
      setActionBusy(false);
    }
  };

  const handleLoadMatches = async () => {
    if (!organizationId || !targetId) return;
    try {
      setActionBusy(true);
      setError(null);
      setMessage(null);
      const result = targetType === "SHIFT"
        ? await getShiftMatches(organizationId, targetId, 30)
        : await getJobMatches(organizationId, targetId, 30);
      setMatches(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load matches.");
    } finally {
      setActionBusy(false);
    }
  };

  const handleAddToPool = async (candidate: MatchCandidate) => {
    if (!organizationId || !selectedPoolId) {
      setError("Create or select a workforce pool first.");
      return;
    }
    try {
      setActionBusy(true);
      const member = await addWorkforcePoolMember(
        organizationId,
        selectedPoolId,
        candidate.workerUserId,
        `Added from ${matches?.algorithmVersion ?? "MATCH_V1"} score ${candidate.score.total}`,
      );
      setMembers((current) =>
        current.some((item) => item.workerUserId === member.workerUserId)
          ? current
          : [member, ...current],
      );
      setMessage(`${candidate.fullName ?? "Worker"} added to the selected pool.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add worker to pool.");
    } finally {
      setActionBusy(false);
    }
  };

  const handleRemoveMember = async (workerId: string) => {
    if (!organizationId || !selectedPoolId) return;
    try {
      setActionBusy(true);
      await removeWorkforcePoolMember(organizationId, selectedPoolId, workerId);
      setMembers((current) => current.filter((item) => item.workerUserId !== workerId));
      setMessage("Worker removed from pool.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to remove worker.");
    } finally {
      setActionBusy(false);
    }
  };

  const handleReserve = async (candidate: MatchCandidate) => {
    if (!organizationId || targetType !== "SHIFT" || !targetId) return;
    try {
      setActionBusy(true);
      await reserveWorker(organizationId, targetId, candidate.workerUserId, crypto.randomUUID());
      setMessage(`${candidate.fullName ?? "Worker"} reserved for the selected shift.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to reserve worker.");
    } finally {
      setActionBusy(false);
    }
  };

  if (authLoading || busy) {
    return <div className="min-h-screen bg-[#080d1a] grid place-items-center text-slate-300">Loading workforce workspace…</div>;
  }

  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100">
      <Navbar />
      <div className="flex min-w-0">
        <WorkspaceSidebar />
        <main className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl space-y-6">
            <header className="rounded-2xl border border-slate-800 bg-[#0e1626] p-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">ATLAS workforce operations</p>
              <h1 className="mt-2 text-3xl font-extrabold text-white">{organizationName || "Employer"} Workforce</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-400">
                Reuse trusted crews, inspect deterministic match scores, and reserve workers without overbooking shifts.
              </p>
            </header>

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-950/30 p-4 text-sm text-red-200">
                {error}
                <button type="button" onClick={() => setError(null)} className="float-right font-bold">×</button>
              </div>
            )}
            {message && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-4 text-sm text-emerald-200">
                {message}
              </div>
            )}

            <section className="grid gap-6 xl:grid-cols-[360px_1fr]">
              <div className="space-y-6">
                <form onSubmit={handleCreatePool} className="rounded-2xl border border-slate-800 bg-[#0e1626] p-5">
                  <h2 className="text-lg font-bold text-white">Create reusable pool</h2>
                  <input
                    value={poolName}
                    onChange={(e) => setPoolName(e.target.value)}
                    placeholder="e.g. Trusted Weekend Crew"
                    className="mt-4 w-full rounded-xl border border-slate-700 bg-[#080d1a] px-3 py-2 text-sm outline-none focus:border-blue-500"
                    maxLength={120}
                  />
                  <textarea
                    value={poolDescription}
                    onChange={(e) => setPoolDescription(e.target.value)}
                    placeholder="What is this crew best used for?"
                    className="mt-3 min-h-24 w-full rounded-xl border border-slate-700 bg-[#080d1a] px-3 py-2 text-sm outline-none focus:border-blue-500"
                    maxLength={1000}
                  />
                  <button
                    disabled={actionBusy || !poolName.trim()}
                    className="mt-3 w-full rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                  >
                    Create Pool
                  </button>
                </form>

                <div className="rounded-2xl border border-slate-800 bg-[#0e1626] p-5">
                  <h2 className="text-lg font-bold text-white">Pool members</h2>
                  <select
                    value={selectedPoolId}
                    onChange={(e) => {
                      setSelectedPoolId(e.target.value);
                      if (!e.target.value) setMembers([]);
                    }}
                    className="mt-4 w-full rounded-xl border border-slate-700 bg-[#080d1a] px-3 py-2 text-sm"
                  >
                    <option value="">Select a pool</option>
                    {pools.map((pool) => <option key={pool.id} value={pool.id}>{pool.name}</option>)}
                  </select>
                  <div className="mt-4 space-y-2">
                    {members.length === 0 && <p className="text-xs text-slate-500">No workers in this pool yet.</p>}
                    {members.map((member) => (
                      <div key={member.workerUserId} className="rounded-xl border border-slate-800 bg-[#080d1a] p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold text-white">{member.fullName || member.publicHandle || "Worker"}</p>
                            <p className="text-xs text-slate-500">{member.headline || member.note || "Reusable workforce member"}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(member.workerUserId)}
                            className="text-xs font-semibold text-rose-400"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-[#0e1626] p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-end">
                  <label className="flex-1 text-xs font-semibold text-slate-400">
                    Match target type
                    <select
                      value={targetType}
                      onChange={(e) => {
                        const next = e.target.value as "JOB" | "SHIFT";
                        setTargetType(next);
                        setTargetId("");
                        setMatches(null);
                      }}
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-[#080d1a] px-3 py-2 text-sm text-white"
                    >
                      <option value="SHIFT">Shift</option>
                      <option value="JOB">Job</option>
                    </select>
                  </label>
                  <label className="flex-[2] text-xs font-semibold text-slate-400">
                    Opportunity
                    <select
                      value={targetId}
                      onChange={(e) => {
                        setTargetId(e.target.value);
                        setMatches(null);
                      }}
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-[#080d1a] px-3 py-2 text-sm text-white"
                    >
                      <option value="">Select {targetType.toLowerCase()}</option>
                      {targets.map((target) => (
                        <option key={target.id} value={target.id}>
                          {target.title} · {target.status}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    disabled={actionBusy || !targetId}
                    onClick={handleLoadMatches}
                    className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-extrabold text-white disabled:opacity-50"
                  >
                    Run MATCH_V1
                  </button>
                </div>

                <div className="mt-6 space-y-3">
                  {!matches && <p className="py-10 text-center text-sm text-slate-500">Choose an opportunity and run deterministic matching.</p>}
                  {matches?.candidates.length === 0 && <p className="py-10 text-center text-sm text-slate-500">No open-to-work candidates matched.</p>}
                  {matches?.candidates.map((candidate, index) => (
                    <article key={candidate.workerUserId} className="rounded-2xl border border-slate-800 bg-[#080d1a] p-4">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex items-center gap-3">
                            <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-600/20 text-xs font-black text-blue-300">#{index + 1}</span>
                            <div>
                              <h3 className="font-bold text-white">{candidate.fullName || candidate.publicHandle || "Verified Worker"}</h3>
                              <p className="text-xs text-slate-500">{candidate.headline || "Open to work"}</p>
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-300">
                            <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-emerald-300">Score {candidate.score.total.toFixed(1)}</span>
                            <span className="rounded-full bg-white/5 px-2 py-1">Skills {candidate.matchedRequiredSkills}/{candidate.requiredSkills}</span>
                            <span className="rounded-full bg-white/5 px-2 py-1">Verified {candidate.verifiedMatchedSkills}</span>
                            {candidate.distanceMeters != null && (
                              <span className="rounded-full bg-white/5 px-2 py-1">{(candidate.distanceMeters / 1000).toFixed(1)} km</span>
                            )}
                          </div>
                          <p className="mt-2 text-[11px] text-slate-500">{candidate.score.reasons.join(" · ") || "Baseline candidate"}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={actionBusy || !selectedPoolId}
                            onClick={() => handleAddToPool(candidate)}
                            className="rounded-lg border border-blue-500/40 px-3 py-2 text-xs font-bold text-blue-300 disabled:opacity-40"
                          >
                            + Pool
                          </button>
                          {targetType === "SHIFT" && (
                            <button
                              type="button"
                              disabled={actionBusy}
                              onClick={() => handleReserve(candidate)}
                              className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-40"
                            >
                              Reserve
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
