"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../context/AuthContext";
import { getWorkerProfile, getPrivateWorkPass, PrivateProfile, PrivateWorkPass } from "../../../lib/api/workers";

export default function WorkerDashboardPage() {
  const { firebaseUser, atlasUser, loading: authLoading, signOut } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<PrivateProfile | null>(null);
  const [workPass, setWorkPass] = useState<PrivateWorkPass | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !firebaseUser) {
      router.push("/login");
      return;
    }

    async function loadDashboard() {
      try {
        setLoading(true);
        const [prof, wp] = await Promise.all([
          getWorkerProfile().catch(() => null),
          getPrivateWorkPass().catch(() => null),
        ]);

        if (!prof) {
          router.push("/onboarding/worker");
          return;
        }

        setProfile(prof);
        setWorkPass(wp);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }

    if (firebaseUser) {
      loadDashboard();
    }
  }, [firebaseUser, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-slate-100">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading worker dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <svg className="w-7 h-7" viewBox="0 0 32 32" fill="none">
                <circle cx="10" cy="16" r="6" fill="#FF5A1F" />
                <circle cx="22" cy="10" r="4" fill="#0F172A" />
                <circle cx="22" cy="22" r="4" fill="#0F172A" />
                <line x1="14.5" y1="13.5" x2="18.5" y2="11.5" stroke="#0F172A" strokeWidth="2" />
                <line x1="14.5" y1="18.5" x2="18.5" y2="20.5" stroke="#0F172A" strokeWidth="2" />
              </svg>
              <span className="font-bold text-lg text-slate-900">SkillHub</span>
            </Link>
            <nav className="flex items-center gap-4 text-sm font-medium text-slate-600">
              <Link href="/dashboard/worker" className="text-orange-600 font-semibold">Dashboard</Link>
              <Link href="/shifts" className="hover:text-slate-900 font-medium">Browse Shifts ⏱️</Link>
              <Link href="/jobs" className="hover:text-slate-900">Browse Jobs</Link>
              <Link href="/profile" className="hover:text-slate-900">Profile</Link>
              <Link href="/skills" className="hover:text-slate-900">Skills</Link>
              <Link href="/credentials" className="hover:text-slate-900">Credentials</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs px-2.5 py-1 bg-orange-100 text-orange-700 font-semibold rounded-full">
              WORKER
            </span>
            <span className="text-sm text-slate-700 font-medium">{atlasUser?.email || firebaseUser?.email}</span>
            <button
              onClick={() => signOut()}
              className="text-sm text-slate-500 hover:text-slate-900 font-medium ml-2"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-500 font-bold">✕</button>
          </div>
        )}

        {/* Hero Banner */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-slate-900">{profile?.fullName || profile?.handle || "Worker"}</h1>
              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 font-semibold rounded">
                ✔ WorkPass Active
              </span>
            </div>
            <p className="text-slate-600 text-sm">{profile?.headline || "Physical work professional"}</p>
            <p className="text-slate-400 text-xs mt-1">
              Location: {profile?.location?.city || "London"}, {profile?.location?.countryCode || "GB"} • Handle: @{profile?.handle}
            </p>
          </div>

          <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
            <Link
              href="/shifts"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold text-center shadow-sm"
            >
              Browse Shifts ⏱️
            </Link>
            <Link
              href="/jobs"
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-semibold text-center shadow-sm"
            >
              Browse Jobs 💼
            </Link>
            {profile?.handle && (
              <Link
                href={`/workpass/${profile.handle}`}
                target="_blank"
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 text-sm font-medium text-center"
              >
                View Public WorkPass ↗
              </Link>
            )}
            <Link
              href="/profile"
              className="btn-primary text-sm text-center"
            >
              Edit Profile
            </Link>
          </div>
        </div>

        {/* Completion Bar */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-slate-800">Profile Completion</span>
            <span className="text-sm font-bold text-orange-600">{profile?.completionPercentage ?? 80}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 transition-all duration-500 rounded-full"
              style={{ width: `${profile?.completionPercentage ?? 80}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Add credentials and skill proofs to reach 100% and unlock priority nearby matching.
          </p>
        </div>

        {/* 2 Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Skills & Credentials */}
          <div className="lg:col-span-2 space-y-8">
            {/* Skills Card */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4 border-b pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">⚡</span>
                  <h2 className="font-bold text-slate-900">Declared Skills &amp; Proofs</h2>
                </div>
                <Link href="/skills" className="text-sm text-orange-600 hover:text-orange-700 font-semibold">
                  + Add Skills
                </Link>
              </div>

              {workPass?.skills && workPass.skills.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {workPass.skills.map((s) => (
                    <div key={s.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-sm text-slate-900">{s.skillName}</div>
                        <div className="text-xs text-slate-500">{s.category}</div>
                      </div>
                      <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-800 font-medium rounded">
                        {s.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-500 text-sm">
                  No skills declared yet. <Link href="/skills" className="text-orange-600 underline">Add your first skill</Link>.
                </div>
              )}
            </div>

            {/* Credentials Card */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4 border-b pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🛡️</span>
                  <h2 className="font-bold text-slate-900">Verified Credentials &amp; Certifications</h2>
                </div>
                <Link href="/credentials" className="text-sm text-orange-600 hover:text-orange-700 font-semibold">
                  + Upload Credential
                </Link>
              </div>

              {workPass?.credentials && workPass.credentials.length > 0 ? (
                <div className="space-y-3">
                  {workPass.credentials.map((c) => (
                    <div key={c.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
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
                <div className="text-center py-6 text-slate-500 text-sm">
                  No credentials uploaded yet. <Link href="/credentials" className="text-orange-600 underline">Upload right to work or licenses</Link>.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Quick Navigation & Preferences */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link href="/profile" className="block p-3 rounded-lg border border-slate-100 hover:bg-slate-50 text-sm font-medium text-slate-800">
                  ✏️ Edit Profile &amp; Bio
                </Link>
                <Link href="/skills" className="block p-3 rounded-lg border border-slate-100 hover:bg-slate-50 text-sm font-medium text-slate-800">
                  ⚡ Manage Skill Catalogue
                </Link>
                <Link href="/credentials" className="block p-3 rounded-lg border border-slate-100 hover:bg-slate-50 text-sm font-medium text-slate-800">
                  📁 Document &amp; ID Uploads
                </Link>
              </div>
            </div>

            <div className="bg-orange-50 rounded-xl p-5 border border-orange-200">
              <h4 className="font-bold text-orange-950 text-sm mb-1">WorkPass Identity</h4>
              <p className="text-xs text-orange-800 leading-relaxed">
                Your WorkPass is your portable workforce credential. Keep your skills and certifications updated to stand out to employers.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
