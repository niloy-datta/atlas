"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../context/AuthContext";
import {
  createOrganization,
  addOrganizationLocation,
  requestOrganizationVerification,
  listOrganizations,
} from "../../../lib/api/organizations";

export default function EmployerOnboardingPage() {
  const { firebaseUser, loading: authLoading } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Organization State
  const [orgId, setOrgId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");

  // Location State
  const [locationName, setLocationName] = useState("Headquarters / Main Venue");
  const [formattedAddress, setFormattedAddress] = useState("45 Dean Street, Soho, London W1D 4QB");
  const [latitude, setLatitude] = useState(51.5134);
  const [longitude, setLongitude] = useState(-0.1332);

  useEffect(() => {
    if (!authLoading && !firebaseUser) {
      router.push("/login");
      return;
    }

    async function checkExisting() {
      try {
        setLoading(true);
        const orgs = await listOrganizations().catch(() => []);
        if (orgs.length > 0) {
          setOrgId(orgs[0].id);
          setName(orgs[0].name);
          setSlug(orgs[0].slug);
          setStep(2);
        } else if (firebaseUser?.email) {
          const emailPrefix = firebaseUser.email.split("@")[0].replace(/[^a-zA-Z0-9-]/g, "").toLowerCase();
          setSlug(`${emailPrefix}-org`);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load organization data");
      } finally {
        setLoading(false);
      }
    }

    if (firebaseUser) {
      checkExisting();
    }
  }, [firebaseUser, authLoading, router]);

  const handleCreateOrg = async () => {
    if (!name.trim() || !slug.trim()) return;
    try {
      setSaving(true);
      setError(null);
      const created = await createOrganization({
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        description: description.trim() || undefined,
      });
      setOrgId(created.id);
      setStep(2);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create organization");
    } finally {
      setSaving(false);
    }
  };

  const handleAddLocation = async () => {
    if (!orgId || !locationName.trim() || !formattedAddress.trim()) return;
    try {
      setSaving(true);
      setError(null);
      await addOrganizationLocation(orgId, {
        name: locationName.trim(),
        formattedAddress: formattedAddress.trim(),
        latitude,
        longitude,
      });
      setStep(3);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add location");
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteAndVerify = async () => {
    if (!orgId) return;
    try {
      setSaving(true);
      setError(null);
      await requestOrganizationVerification(orgId).catch(() => {});
      router.push("/dashboard/employer");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to finalize organization setup");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-slate-100">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading employer onboarding...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
              <circle cx="10" cy="16" r="6" fill="#FF5A1F" />
              <circle cx="22" cy="10" r="4" fill="#0F172A" />
              <circle cx="22" cy="22" r="4" fill="#0F172A" />
              <line x1="14.5" y1="13.5" x2="18.5" y2="11.5" stroke="#0F172A" strokeWidth="2" />
              <line x1="14.5" y1="18.5" x2="18.5" y2="20.5" stroke="#0F172A" strokeWidth="2" />
            </svg>
            <span className="font-bold text-xl text-slate-900">SkillHub</span>
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Employer Organization Setup</h1>
          <p className="text-slate-600 mt-2">Establish your business workspace to manage shifts and hire verified workers.</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-8 bg-white p-4 rounded-xl border border-slate-200">
          <div className={`flex items-center gap-2 ${step >= 1 ? "text-blue-600 font-semibold" : "text-slate-400"}`}>
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm ${step >= 1 ? "bg-blue-100 text-blue-600" : "bg-slate-100"}`}>1</span>
            <span>Business</span>
          </div>
          <div className="w-8 h-0.5 bg-slate-200" />
          <div className={`flex items-center gap-2 ${step >= 2 ? "text-blue-600 font-semibold" : "text-slate-400"}`}>
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm ${step >= 2 ? "bg-blue-100 text-blue-600" : "bg-slate-100"}`}>2</span>
            <span>Location</span>
          </div>
          <div className="w-8 h-0.5 bg-slate-200" />
          <div className={`flex items-center gap-2 ${step >= 3 ? "text-blue-600 font-semibold" : "text-slate-400"}`}>
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm ${step >= 3 ? "bg-blue-100 text-blue-600" : "bg-slate-100"}`}>3</span>
            <span>Verification</span>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-500 font-bold">✕</button>
          </div>
        )}

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          {/* STEP 1: Organization details */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 border-b pb-3">Step 1: Create Organization</h2>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Company / Trading Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!orgId) {
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-"));
                    }
                  }}
                  placeholder="Soho Café &amp; Bakery"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Organization Slug (URL identifier)</label>
                <div className="flex rounded-lg border border-slate-300 overflow-hidden focus-within:ring-2 focus-within:ring-blue-600">
                  <span className="bg-slate-100 px-3 py-2 text-slate-500 text-sm border-r flex items-center">skillhub.work/org/</span>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="soho-cafe"
                    className="flex-1 px-3 py-2 outline-none text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Business Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Artisanal café and bakery located in central London..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
                />
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  disabled={saving || !name.trim() || !slug.trim()}
                  onClick={handleCreateOrg}
                  className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Save &amp; Add Location →"}
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Operating Location */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 border-b pb-3">Step 2: Operating Location</h2>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Venue / Branch Name</label>
                <input
                  type="text"
                  required
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="Main Branch"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Physical Address</label>
                <input
                  type="text"
                  required
                  value={formattedAddress}
                  onChange={(e) => setFormattedAddress(e.target.value)}
                  placeholder="45 Dean Street, Soho, London W1D 4QB"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={latitude}
                    onChange={(e) => setLatitude(parseFloat(e.target.value) || 51.5134)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={longitude}
                    onChange={(e) => setLongitude(parseFloat(e.target.value) || -0.1332)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  disabled={saving || !locationName.trim() || !formattedAddress.trim()}
                  onClick={handleAddLocation}
                  className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Continue to Verification →"}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Verification */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 border-b pb-3">Step 3: Verification &amp; Trust Badge</h2>

              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🛡️</span>
                  <div>
                    <h3 className="font-bold text-blue-900">Employer Trust Passport</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      Verified businesses attract 4x more verified applicants and unlock instant shift bookings.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Business Name:</span>
                  <span className="font-semibold text-slate-900">{name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Slug:</span>
                  <span className="font-mono text-slate-900">/{slug}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Operating Venue:</span>
                  <span className="text-slate-900">{locationName} ({formattedAddress})</span>
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleCompleteAndVerify}
                  className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {saving ? "Finalizing..." : "Complete Setup & Launch Dashboard 🎉"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

