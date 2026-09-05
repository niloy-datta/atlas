"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../context/AuthContext";
import { getPublicShift, ShiftDetailView } from "../../../lib/api/shifts";
import { applyToShift } from "../../../lib/api/applications";
import ApplyModal from "../../../components/applications/ApplyModal";

export default function ShiftDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const shiftId = params?.id as string;

  const [shift, setShift] = useState<ShiftDetailView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applySuccess, setApplySuccess] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  useEffect(() => {
    if (!shiftId) return;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await getPublicShift(shiftId);
        setShift(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Shift not found or no longer available.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [shiftId]);

  const formatInterval = (startIso: string, endIso: string, timezone: string) => {
    try {
      const start = new Date(startIso);
      const end = new Date(endIso);
      const durationHours = Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60));

      const dateStr = start.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
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
        durationStr: `${durationHours.toFixed(1).replace(/\.0$/, "")} hours`,
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

  const handleApplyClick = () => {
    if (!firebaseUser) {
      router.push(`/login?redirect=/shifts/${shiftId}`);
      return;
    }
    setIsApplyModalOpen(true);
  };

  const handleApplySubmit = async (coverNote: string, proposedRatePence?: number) => {
    await applyToShift(shiftId, { coverNote, proposedRatePence });
    setApplySuccess(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !shift) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-4">
          <div className="text-4xl">⚠️</div>
          <h1 className="text-xl font-bold text-slate-900">Shift Unavailable</h1>
          <p className="text-sm text-slate-500">{error || "The requested shift engagement does not exist or has closed."}</p>
          <Link
            href="/shifts"
            className="inline-block px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg text-sm hover:bg-emerald-700"
          >
            Browse All Shifts
          </Link>
        </div>
      </div>
    );
  }

  const interval = formatInterval(shift.startTime, shift.endTime, shift.timezone);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/shifts" className="text-sm font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1">
            ← Back to Shift Roster
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {shift.capacity} Capacity Slot{shift.capacity === 1 ? "" : "s"}
            </span>
            <span className="text-xs px-2.5 py-1 font-semibold rounded-full bg-green-50 text-green-700 border border-green-200">
              {shift.status}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Main Header Card */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {shift.title}
              </h1>

              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                <span className="font-semibold text-slate-900">{shift.organizationName}</span>
                {shift.organizationVerificationStatus === "VERIFIED" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
                    🛡️ Verified Employer
                  </span>
                )}
                {shift.jobTitle && (
                  <>
                    <span>•</span>
                    <span className="text-slate-500">Under job: <strong>{shift.jobTitle}</strong></span>
                  </>
                )}
                <span>•</span>
                <span>Posted {new Date(shift.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="sm:text-right bg-emerald-50 sm:bg-transparent p-4 sm:p-0 rounded-xl border border-emerald-100 sm:border-0">
              <span className="text-xs text-slate-500 block font-medium">Hourly Compensation</span>
              <span className="text-2xl font-extrabold text-emerald-800 sm:text-slate-900">
                {formatRate(shift.hourlyRatePence, shift.currency)}/hr
              </span>
              <span className="block text-xs text-emerald-700 font-bold mt-0.5">
                ~{formatTotalPayout(shift.hourlyRatePence, interval.durationHours, shift.currency)} estimated shift pay
              </span>
            </div>
          </div>

          {/* Quick Schedule & Location Details Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-100">
            <div>
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Date & Schedule</span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">
                {interval.dateStr}
              </p>
              <p className="text-xs text-slate-600 font-medium">
                {interval.timeStr} ({shift.timezone})
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                Duration: {interval.durationStr}
              </p>
            </div>

            <div>
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Work Location</span>
              <p className="text-sm font-medium text-slate-900 mt-0.5">
                {shift.formattedAddress || shift.locationName || "On-site / Exact address provided upon booking"}
              </p>
            </div>

            <div>
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Shift Capacity</span>
              <p className="text-sm font-medium text-slate-900 mt-0.5 flex items-center gap-1">
                👥 {shift.capacity} Worker Slot{shift.capacity === 1 ? "" : "s"}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Guaranteed escrow allocation
              </p>
            </div>
          </div>
        </div>

        {/* Two-Column Body */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Description & Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description Card */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-slate-900">Shift Brief & Duties</h2>
              <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                {shift.description || "No additional shift description provided. Standard trade obligations apply."}
              </div>
            </div>

            {/* Required Skills Card */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center justify-between">
                <span>Required Skills</span>
                <span className="text-xs font-normal text-slate-500">
                  {shift.requiredSkills.length} skill{shift.requiredSkills.length === 1 ? "" : "s"} required
                </span>
              </h2>

              {shift.requiredSkills.length === 0 ? (
                <p className="text-sm text-slate-500">No specific trade skill qualifications required for this shift.</p>
              ) : (
                <div className="space-y-3">
                  {shift.requiredSkills.map((req) => (
                    <div
                      key={req.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 text-sm">{req.skillName}</span>
                          <span className="text-xs text-slate-500">({req.categoryName})</span>
                        </div>
                        <span className="text-xs text-slate-500">
                          Minimum required: <strong className="text-slate-700">{req.minimumProficiency}</strong>
                        </span>
                      </div>
                      <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-800 font-semibold rounded">
                        Required
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Required Credentials Card */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center justify-between">
                <span>Mandatory Certifications & Licenses</span>
                <span className="text-xs font-normal text-slate-500">
                  {shift.requiredCredentials.length} required
                </span>
              </h2>

              {shift.requiredCredentials.length === 0 ? (
                <p className="text-sm text-slate-500">No mandatory license or card verification specified.</p>
              ) : (
                <div className="space-y-3">
                  {shift.requiredCredentials.map((req) => (
                    <div
                      key={req.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-semibold text-slate-900 text-sm block">{req.title}</span>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span>Type: {req.credentialType}</span>
                          {req.issuer && <span>• Issuer: {req.issuer}</span>}
                        </div>
                      </div>
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 font-semibold rounded">
                        Mandatory
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Apply CTA & Trust Signals */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 sticky top-24">
              <h3 className="font-bold text-slate-900 text-base">Book This Shift</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Confirm your availability for this exact time window. Your verified WorkPass will be submitted to{" "}
                <strong className="text-slate-900">{shift.organizationName}</strong>.
              </p>

              {applySuccess ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-1">
                  <p className="font-bold">Shift Request Submitted!</p>
                  <p>Employer notified. Reservation engine will allocate capacity slot in Phase 4.</p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleApplyClick}
                  className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl text-sm hover:bg-emerald-700 transition shadow-sm"
                >
                  {firebaseUser ? "Claim Shift Slot" : "Sign In to Book Shift"}
                </button>
              )}

              <div className="pt-4 border-t border-slate-100 space-y-2.5 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <span>⏱️</span>
                  <span>Instant timeslot locking</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🛡️</span>
                  <span>SkillProof automated compliance check</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>💰</span>
                  <span>Guaranteed rate escrow protection</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {shift && (
        <ApplyModal
          isOpen={isApplyModalOpen}
          onClose={() => setIsApplyModalOpen(false)}
          targetTitle={shift.title}
          targetType="SHIFT"
          currency={shift.currency}
          defaultRatePence={shift.hourlyRatePence}
          onSubmit={handleApplySubmit}
        />
      )}
    </div>
  );
}

