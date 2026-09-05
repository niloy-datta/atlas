"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { getWorkerProfile, updateWorkerProfile, ProfileVisibility, JobTypePreference } from "../../lib/api/workers";

export default function ProfilePage() {
  const { firebaseUser, loading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [version, setVersion] = useState(0);
  const [handle, setHandle] = useState("");
  const [fullName, setFullName] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [experienceYears, setExperienceYears] = useState(1);
  const [visibility, setVisibility] = useState<ProfileVisibility>("PUBLIC");

  const [city, setCity] = useState("London");
  const [region, setRegion] = useState("Greater London");
  const [countryCode, setCountryCode] = useState("GB");
  const [latitude, setLatitude] = useState(51.5074);
  const [longitude, setLongitude] = useState(-0.1278);

  const [openToWork, setOpenToWork] = useState(true);
  const [maxDistanceKm, setMaxDistanceKm] = useState(25);
  const [jobTypes, setJobTypes] = useState<JobTypePreference[]>(["SHIFT", "SERVICE"]);

  useEffect(() => {
    if (!authLoading && !firebaseUser) {
      router.push("/login");
      return;
    }

    async function load() {
      try {
        setLoading(true);
        const p = await getWorkerProfile();
        setVersion(p.version);
        setHandle(p.handle || "");
        setFullName(p.fullName || "");
        setHeadline(p.headline || "");
        setBio(p.bio || "");
        setExperienceYears(p.experienceYears || 1);
        setVisibility(p.visibility || "PUBLIC");
        if (p.location) {
          setCity(p.location.city || "London");
          setRegion(p.location.region || "Greater London");
          setCountryCode(p.location.countryCode || "GB");
          setLatitude(p.location.latitude);
          setLongitude(p.location.longitude);
        }
        if (p.preferences) {
          setOpenToWork(p.preferences.openToWork);
          setMaxDistanceKm(p.preferences.maxDistanceKm);
          setJobTypes(p.preferences.jobTypes);
        }
      } catch {
        router.push("/onboarding/worker");
      } finally {
        setLoading(false);
      }
    }

    if (firebaseUser) {
      load();
    }
  }, [firebaseUser, authLoading, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const updated = await updateWorkerProfile({
        version,
        handle: handle.trim(),
        fullName: fullName.trim() || undefined,
        headline: headline.trim() || undefined,
        bio: bio.trim() || undefined,
        experienceYears,
        visibility,
        location: {
          latitude,
          longitude,
          city: city.trim(),
          region: region.trim(),
          countryCode: countryCode.trim().toUpperCase(),
        },
        preferences: {
          openToWork,
          maxDistanceKm,
          jobTypes,
        },
        privacy: {
          showCoarseLocation: true,
          showExperience: true,
        },
      });

      setVersion(updated.version);
      setSuccess("Profile successfully updated!");
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/dashboard/worker" className="text-sm font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1">
            ← Back to Dashboard
          </Link>
          <span className="font-bold text-slate-900">Edit Worker Profile</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-500 font-bold">✕</button>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm flex items-center justify-between">
            <span>{success}</span>
            <button onClick={() => setSuccess(null)} className="text-green-600 font-bold">✕</button>
          </div>
        )}

        <form onSubmit={handleSave} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
          <h2 className="text-lg font-bold text-slate-900 border-b pb-3">Basic Information</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Handle</label>
              <input
                type="text"
                required
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Headline</label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-slate-900"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Bio</label>
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Experience (Years)</label>
              <input
                type="number"
                min={0}
                max={60}
                value={experienceYears}
                onChange={(e) => setExperienceYears(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Visibility</label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as ProfileVisibility)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 bg-white"
              >
                <option value="PUBLIC">Public</option>
                <option value="EMPLOYERS_ONLY">Employers Only</option>
                <option value="UNLISTED">Unlisted</option>
              </select>
            </div>
          </div>

          <h2 className="text-lg font-bold text-slate-900 border-b pt-4 pb-3">Operating Location</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Region</label>
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Country (ISO-2)</label>
              <input
                type="text"
                maxLength={2}
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 uppercase"
              />
            </div>
          </div>

          <div className="pt-6 flex justify-end gap-3">
            <Link
              href="/dashboard/worker"
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary"
            >
              {saving ? "Saving Changes..." : "Save Profile"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
