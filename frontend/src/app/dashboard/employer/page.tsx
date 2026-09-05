"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../context/AuthContext";
import {
  listOrganizations,
  getOrganization,
  listOrganizationLocations,
  listOrganizationMembers,
  OrganizationSummary,
  OrganizationView,
  LocationRow,
  MemberRow,
} from "../../../lib/api/organizations";

export default function EmployerDashboardPage() {
  const { firebaseUser, atlasUser, loading: authLoading, signOut } = useAuth();
  const router = useRouter();

  const [orgs, setOrgs] = useState<OrganizationSummary[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<OrganizationView | null>(null);
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !firebaseUser) {
      router.push("/login");
      return;
    }

    async function loadEmployerData() {
      try {
        setLoading(true);
        const orgList = await listOrganizations().catch(() => []);
        setOrgs(orgList);

        if (orgList.length === 0) {
          router.push("/onboarding/employer");
          return;
        }

        const activeId = orgList[0].id;
        const [orgDetail, locs, mems] = await Promise.all([
          getOrganization(activeId).catch(() => null),
          listOrganizationLocations(activeId).catch(() => []),
          listOrganizationMembers(activeId).catch(() => []),
        ]);

        setSelectedOrg(orgDetail);
        setLocations(locs);
        setMembers(mems);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load employer dashboard");
      } finally {
        setLoading(false);
      }
    }

    if (firebaseUser) {
      loadEmployerData();
    }
  }, [firebaseUser, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-slate-100">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading employer dashboard...</p>
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
              <Link href="/dashboard/employer" className="text-blue-600 font-semibold">Dashboard</Link>
              <Link href="/organizations" className="hover:text-slate-900">Organizations</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs px-2.5 py-1 bg-blue-100 text-blue-700 font-semibold rounded-full">
              EMPLOYER{orgs.length > 1 ? ` (${orgs.length} orgs)` : ""}
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

        {/* Org Banner */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-slate-900">{selectedOrg?.name || "Organization"}</h1>
              <span className={`text-xs px-2.5 py-1 font-semibold rounded-full ${
                selectedOrg?.verificationStatus === "VERIFIED"
                  ? "bg-green-100 text-green-800"
                  : selectedOrg?.verificationStatus === "PENDING"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-slate-100 text-slate-700"
              }`}>
                {selectedOrg?.verificationStatus || "UNVERIFIED"}
              </span>
            </div>
            <p className="text-slate-600 text-sm">{selectedOrg?.description || "Workforce employer workspace"}</p>
            <p className="text-slate-400 text-xs mt-1">Slug: /{selectedOrg?.slug}</p>
          </div>

          <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
            <Link
              href="/organizations"
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 text-sm font-medium text-center"
            >
              Organization Settings
            </Link>
          </div>
        </div>

        {/* 2 Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Locations & Team */}
          <div className="lg:col-span-2 space-y-8">
            {/* Operating Locations */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4 border-b pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📍</span>
                  <h2 className="font-bold text-slate-900">Operating Locations &amp; Venues</h2>
                </div>
              </div>

              {locations.length > 0 ? (
                <div className="space-y-3">
                  {locations.map((loc) => (
                    <div key={loc.id} className="p-3.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-sm text-slate-900">{loc.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{loc.formattedAddress}</div>
                      </div>
                      <span className="text-xs font-mono text-slate-400">
                        {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-500 text-sm">
                  No operating locations configured yet.
                </div>
              )}
            </div>

            {/* Team Members */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4 border-b pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">👥</span>
                  <h2 className="font-bold text-slate-900">Team Members &amp; Administrators</h2>
                </div>
              </div>

              {members.length > 0 ? (
                <div className="space-y-3">
                  {members.map((m) => (
                    <div key={m.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-sm text-slate-900">{m.email}</div>
                        <div className="text-xs text-slate-500">Joined {new Date(m.joinedAt).toLocaleDateString()}</div>
                      </div>
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 font-medium rounded">
                        {m.role}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-500 text-sm">
                  No additional team members.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Quick Stats & Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4">Employer Actions</h3>
              <div className="space-y-2">
                <Link href="/organizations" className="block p-3 rounded-lg border border-slate-100 hover:bg-slate-50 text-sm font-medium text-slate-800">
                  🏢 Organization Details
                </Link>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
              <h4 className="font-bold text-blue-950 text-sm mb-1">Employer Trust Passport</h4>
              <p className="text-xs text-blue-800 leading-relaxed">
                Your business profile establishes trust with top verified workers. Operating venues are used for nearby shift discovery and matching.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
