"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import {
  listOrganizations,
  getOrganization,
  updateOrganization,
  listOrganizationLocations,
  addOrganizationLocation,
  listOrganizationMembers,
  inviteOrganizationMember,
  requestOrganizationVerification,
  OrganizationSummary,
  OrganizationView,
  LocationRow,
  MemberRow,
  OrganizationRole,
} from "../../lib/api/organizations";

export default function OrganizationsPage() {
  const { firebaseUser, loading: authLoading } = useAuth();
  const router = useRouter();

  const [orgs, setOrgs] = useState<OrganizationSummary[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<OrganizationView | null>(null);
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [members, setMembers] = useState<MemberRow[]>([]);

  // Update Org form
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");

  // Add Location form
  const [locName, setLocName] = useState("");
  const [locAddress, setLocAddress] = useState("");
  const [latitude, setLatitude] = useState(51.5074);
  const [longitude, setLongitude] = useState(-0.1278);

  // Invite form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"EMPLOYER_ADMIN" | "EMPLOYER_MEMBER">("EMPLOYER_MEMBER");

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !firebaseUser) {
      router.push("/login");
      return;
    }

    async function load() {
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
          getOrganization(activeId),
          listOrganizationLocations(activeId).catch(() => []),
          listOrganizationMembers(activeId).catch(() => []),
        ]);

        setSelectedOrg(orgDetail);
        setName(orgDetail.name);
        setSlug(orgDetail.slug);
        setDescription(orgDetail.description || "");
        setLocations(locs);
        setMembers(mems);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load organization settings");
      } finally {
        setLoading(false);
      }
    }

    if (firebaseUser) {
      load();
    }
  }, [firebaseUser, authLoading, router]);

  const handleUpdateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg) return;
    try {
      setActionLoading(true);
      setError(null);
      const updated = await updateOrganization(selectedOrg.id, {
        version: selectedOrg.version,
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        description: description.trim() || undefined,
      });
      setSelectedOrg(updated);
      setSuccess("Organization details updated successfully!");
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update organization");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg || !locName.trim() || !locAddress.trim()) return;
    try {
      setActionLoading(true);
      setError(null);
      const added = await addOrganizationLocation(selectedOrg.id, {
        name: locName.trim(),
        formattedAddress: locAddress.trim(),
        latitude,
        longitude,
      });
      setLocations((prev) => [...prev, added]);
      setLocName("");
      setLocAddress("");
      setSuccess("Operating location added!");
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add location");
    } finally {
      setActionLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg || !inviteEmail.trim()) return;
    try {
      setActionLoading(true);
      setError(null);
      await inviteOrganizationMember(selectedOrg.id, inviteEmail.trim().toLowerCase(), inviteRole);
      setInviteEmail("");
      setSuccess(`Invitation sent to ${inviteEmail}!`);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send invitation");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestVerification = async () => {
    if (!selectedOrg) return;
    try {
      setActionLoading(true);
      setError(null);
      const updated = await requestOrganizationVerification(selectedOrg.id);
      setSelectedOrg(updated);
      setSuccess("Verification request submitted!");
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit verification request");
    } finally {
      setActionLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/dashboard/employer" className="text-sm font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1">
            ← Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-900">Organization Settings</span>
            {orgs.length > 1 && (
              <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 font-medium rounded-full">
                {orgs.length} Organizations
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-500 font-bold">✕</button>
          </div>
        )}
        {success && (
          <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm flex items-center justify-between">
            <span>{success}</span>
            <button onClick={() => setSuccess(null)} className="text-green-600 font-bold">✕</button>
          </div>
        )}

        {/* Verification Status Banner */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg">🛡️</span>
              <h2 className="font-bold text-slate-900">Verification State:</h2>
              <span className={`text-xs px-2.5 py-1 font-semibold rounded-full ${
                selectedOrg?.verificationStatus === "VERIFIED"
                  ? "bg-green-100 text-green-800"
                  : selectedOrg?.verificationStatus === "PENDING"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-slate-100 text-slate-700"
              }`}>
                {selectedOrg?.verificationStatus}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Verified organizations receive verified badges and access priority workforce pools.
            </p>
          </div>

          {selectedOrg?.verificationStatus === "UNVERIFIED" && (
            <button
              onClick={handleRequestVerification}
              disabled={actionLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
            >
              Request Business Verification
            </button>
          )}
        </div>

        {/* General Details */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Organization Profile</h2>

          <form onSubmit={handleUpdateOrg} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Business Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Slug</label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
              />
            </div>

            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700"
            >
              {actionLoading ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>

        {/* Operating Locations */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Operating Locations &amp; Venues</h2>

          <div className="space-y-3 mb-6">
            {locations.map((loc) => (
              <div key={loc.id} className="p-3.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm text-slate-900">{loc.name}</div>
                  <div className="text-xs text-slate-500">{loc.formattedAddress}</div>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                </span>
              </div>
            ))}
          </div>

          <h3 className="text-md font-bold text-slate-800 mb-3">+ Add New Location</h3>
          <form onSubmit={handleAddLocation} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Venue / Branch Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Covent Garden Branch"
                  value={locName}
                  onChange={(e) => setLocName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Formatted Address</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 12 Long Acre, London WC2E 9LH"
                  value={locAddress}
                  onChange={(e) => setLocAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={latitude}
                  onChange={(e) => setLatitude(parseFloat(e.target.value) || 51.5074)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={longitude}
                  onChange={(e) => setLongitude(parseFloat(e.target.value) || -0.1278)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={actionLoading || !locName.trim() || !locAddress.trim()}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800"
            >
              {actionLoading ? "Adding..." : "+ Add Location"}
            </button>
          </form>
        </div>

        {/* Team Invitations */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Team Members &amp; Invitations</h2>

          <div className="space-y-3 mb-6">
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

          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              required
              placeholder="colleague@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as OrganizationRole)}
              className="px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 bg-white"
            >
              <option value="EMPLOYER_MEMBER">Team Member</option>
              <option value="EMPLOYER_ADMIN">Administrator</option>
            </select>
            <button
              type="submit"
              disabled={actionLoading || !inviteEmail.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
            >
              Invite Member
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
