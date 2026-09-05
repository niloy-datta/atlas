"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getPublicWorkPass, PublicWorkPass } from "../../../lib/api/workers";

export default function PublicWorkPassPage() {
  const params = useParams();
  const handle = params?.handle as string;

  const [workPass, setWorkPass] = useState<PublicWorkPass | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!handle) return;
    async function load() {
      try {
        setLoading(true);
        const wp = await getPublicWorkPass(handle);
        setWorkPass(wp);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "WorkPass not found or not public");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [handle]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !workPass) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
          <div className="text-4xl mb-3">🛡️</div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">WorkPass Unavailable</h1>
          <p className="text-sm text-slate-600 mb-6">{error || "This WorkPass is either unlisted or does not exist."}</p>
          <Link href="/" className="btn-primary">
            Return to SkillHub Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Brand */}
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2">
            <svg className="w-7 h-7" viewBox="0 0 32 32" fill="none">
              <circle cx="10" cy="16" r="6" fill="#FF5A1F" />
              <circle cx="22" cy="10" r="4" fill="#0F172A" />
              <circle cx="22" cy="22" r="4" fill="#0F172A" />
              <line x1="14.5" y1="13.5" x2="18.5" y2="11.5" stroke="#0F172A" strokeWidth="2" />
              <line x1="14.5" y1="18.5" x2="18.5" y2="20.5" stroke="#0F172A" strokeWidth="2" />
            </svg>
            <span className="font-bold text-lg text-slate-900">SkillHub</span>
          </Link>
          <span className="text-xs px-2.5 py-1 bg-green-100 text-green-800 font-semibold rounded-full flex items-center gap-1">
            <span>✔</span> Verified WorkPass
          </span>
        </div>

        {/* Passport Card */}
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{workPass.displayName || workPass.handle}</h1>
              <p className="text-slate-600 font-medium text-sm mt-0.5">{workPass.headline || "Physical Work Professional"}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                <span>📍 {workPass.coarseLocation || "London, UK"}</span>
                <span>•</span>
                <span>⏱️ {workPass.experienceYears || 1} years experience</span>
                <span>•</span>
                <span className="font-mono">@{workPass.handle}</span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-500 mb-1">Trust Score Level</div>
              <div className="text-2xl font-bold text-orange-600">{workPass.completionPercentage}%</div>
            </div>
          </div>

          {workPass.bio && (
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">About</h3>
              <p className="text-sm text-slate-700 leading-relaxed">{workPass.bio}</p>
            </div>
          )}

          {/* Verified Skills */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">SkillProof Verified Skills</h3>
            {workPass.skills.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {workPass.skills.map((s, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-sm text-slate-900">{s.name}</div>
                      <div className="text-xs text-slate-500">{s.category}</div>
                    </div>
                    <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-800 font-medium rounded">
                      {s.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No public skills listed.</p>
            )}
          </div>

          {/* Verified Credentials */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Credentials &amp; Licenses</h3>
            {workPass.credentials.length > 0 ? (
              <div className="space-y-2">
                {workPass.credentials.map((c, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-sm text-slate-900">{c.title}</div>
                      <div className="text-xs text-slate-500">Issued by {c.issuer} • {c.credentialType}</div>
                    </div>
                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 font-medium rounded">
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No public credentials listed.</p>
            )}
          </div>
        </div>

        {/* Platform footer */}
        <div className="text-center text-xs text-slate-400">
          WorkPass verified by ATLAS Verified Workforce Infrastructure.
        </div>
      </div>
    </div>
  );
}
