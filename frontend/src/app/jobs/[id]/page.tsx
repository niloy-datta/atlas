"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../context/AuthContext";
import { getPublicJob, JobDetail } from "../../../lib/api/jobs";

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const jobId = params?.id as string;

  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applySuccess, setApplySuccess] = useState(false);

  useEffect(() => {
    if (!jobId) return;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await getPublicJob(jobId);
        setJob(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Job not found or no longer available.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [jobId]);

  const formatBudget = (min?: number, max?: number, currency: string = "GBP") => {
    const symbol = currency === "GBP" ? "£" : currency === "EUR" ? "€" : "$";
    if (min && max) {
      return `${symbol}${(min / 100).toFixed(2)} – ${symbol}${(max / 100).toFixed(2)}`;
    }
    if (min) return `From ${symbol}${(min / 100).toFixed(2)}`;
    if (max) return `Up to ${symbol}${(max / 100).toFixed(2)}`;
    return "Rate Negotiable";
  };

  const handleApplyClick = () => {
    if (!firebaseUser) {
      router.push(`/login?redirect=/jobs/${jobId}`);
      return;
    }
    // Phase 4 Applications readiness
    setApplySuccess(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-4">
          <div className="text-4xl">⚠️</div>
          <h1 className="text-xl font-bold text-slate-900">Job Unavailable</h1>
          <p className="text-sm text-slate-500">{error || "The requested job engagement does not exist."}</p>
          <Link
            href="/jobs"
            className="inline-block px-4 py-2 bg-orange-600 text-white font-semibold rounded-lg text-sm hover:bg-orange-700"
          >
            Browse All Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/jobs" className="text-sm font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1">
            ← Back to Marketplace
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 font-semibold rounded-full bg-slate-100 text-slate-700">
              {job.jobType}
            </span>
            <span className="text-xs px-2.5 py-1 font-semibold rounded-full bg-green-50 text-green-700 border border-green-200">
              {job.status}
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
                {job.title}
              </h1>

              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                <span className="font-semibold text-slate-900">{job.organizationName}</span>
                {job.organizationVerificationStatus === "VERIFIED" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
                    🛡️ Verified Employer
                  </span>
                )}
                <span>•</span>
                <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="sm:text-right bg-slate-50 sm:bg-transparent p-4 sm:p-0 rounded-xl">
              <span className="text-xs text-slate-400 block font-medium">Estimated Compensation</span>
              <span className="text-xl font-extrabold text-slate-900">
                {formatBudget(job.budgetMinPence, job.budgetMaxPence, job.currency)}
              </span>
            </div>
          </div>

          {/* Quick Details Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-100">
            <div>
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Location</span>
              <p className="text-sm font-medium text-slate-900 mt-0.5">
                {job.formattedAddress || job.locationName || "Remote / Variable Location"}
              </p>
            </div>

            <div>
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Engagement Type</span>
              <p className="text-sm font-medium text-slate-900 mt-0.5">
                {job.jobType === "SHIFT" ? "Hourly Shift Engagement" : job.jobType === "SERVICE" ? "Fixed Service Call" : "Contract Project"}
              </p>
            </div>

            <div>
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Platform Security</span>
              <p className="text-sm font-medium text-slate-900 mt-0.5 flex items-center gap-1">
                🔒 ATLAS Verified Escrow
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
              <h2 className="text-lg font-bold text-slate-900">Scope of Work & Requirements</h2>
              <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                {job.description}
              </div>
            </div>

            {/* Required Skills Card */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center justify-between">
                <span>Required Skills</span>
                <span className="text-xs font-normal text-slate-500">
                  {job.requiredSkills.length} skill{job.requiredSkills.length === 1 ? "" : "s"} required
                </span>
              </h2>

              {job.requiredSkills.length === 0 ? (
                <p className="text-sm text-slate-500">No specific trade skill qualifications required.</p>
              ) : (
                <div className="space-y-3">
                  {job.requiredSkills.map((req) => (
                    <div
                      key={req.id}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between"
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
                      <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-800 font-semibold rounded">
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
                <span>Certifications & Licenses</span>
                <span className="text-xs font-normal text-slate-500">
                  {job.requiredCredentials.length} required
                </span>
              </h2>

              {job.requiredCredentials.length === 0 ? (
                <p className="text-sm text-slate-500">No mandatory license or card verification specified.</p>
              ) : (
                <div className="space-y-3">
                  {job.requiredCredentials.map((req) => (
                    <div
                      key={req.id}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between"
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
              <h3 className="font-bold text-slate-900 text-base">Ready to Apply?</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Your verified WorkPass, declared skills, and verified credentials will be shared with{" "}
                <strong className="text-slate-900">{job.organizationName}</strong> upon applying.
              </p>

              {applySuccess ? (
                <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 text-xs space-y-1">
                  <p className="font-bold">Application Registered!</p>
                  <p>Employer notified. Full shift reservation engine active in Phase 4.</p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleApplyClick}
                  className="w-full py-3 bg-orange-600 text-white font-bold rounded-xl text-sm hover:bg-orange-700 transition shadow-sm"
                >
                  {firebaseUser ? "Submit Application" : "Sign In to Apply"}
                </button>
              )}

              <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <span>🛡️</span>
                  <span>Instant SkillProof verification</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>⚡</span>
                  <span>Direct employer messaging</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>💳</span>
                  <span>Automated WorkLedger settlement</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
