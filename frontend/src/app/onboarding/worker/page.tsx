"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../context/AuthContext";
import { getWorkerProfile, updateWorkerProfile, ProfileVisibility, JobTypePreference } from "../../../lib/api/workers";
import { searchSkills, declareWorkerSkill, SkillItem, SkillProficiency } from "../../../lib/api/skills";

export default function WorkerOnboardingPage() {
  const { firebaseUser, loading: authLoading } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [version, setVersion] = useState(0);
  const [handle, setHandle] = useState("");
  const [fullName, setFullName] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [experienceYears, setExperienceYears] = useState(1);
  const [visibility, setVisibility] = useState<ProfileVisibility>("PUBLIC");

  // Location & Preferences
  const [city, setCity] = useState("London");
  const [region, setRegion] = useState("Greater London");
  const [countryCode, setCountryCode] = useState("GB");
  const [latitude, setLatitude] = useState(51.5074);
  const [longitude, setLongitude] = useState(-0.1278);
  const [openToWork, setOpenToWork] = useState(true);
  const [maxDistanceKm, setMaxDistanceKm] = useState(25);
  const [jobTypes, setJobTypes] = useState<JobTypePreference[]>(["SHIFT", "SERVICE"]);

  // Skills
  const [availableSkills, setAvailableSkills] = useState<SkillItem[]>([]);
  const [selectedSkillId, setSelectedSkillId] = useState("");
  const [selectedProficiency, setSelectedProficiency] = useState<"BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT">("INTERMEDIATE");
  const [addedSkills, setAddedSkills] = useState<Array<{ name: string; proficiency: string }>>([]);

  useEffect(() => {
    if (!authLoading && !firebaseUser) {
      router.push("/login");
      return;
    }

    async function loadData() {
      try {
        setLoading(true);
        // Load existing profile if present
        try {
          const profile = await getWorkerProfile();
          if (profile) {
            setVersion(profile.version);
            setHandle(profile.handle || "");
            setFullName(profile.fullName || "");
            setHeadline(profile.headline || "");
            setBio(profile.bio || "");
            setExperienceYears(profile.experienceYears || 1);
            setVisibility(profile.visibility || "PUBLIC");
            if (profile.location) {
              setCity(profile.location.city || "London");
              setRegion(profile.location.region || "Greater London");
              setCountryCode(profile.location.countryCode || "GB");
              setLatitude(profile.location.latitude);
              setLongitude(profile.location.longitude);
            }
            if (profile.preferences) {
              setOpenToWork(profile.preferences.openToWork);
              setMaxDistanceKm(profile.preferences.maxDistanceKm);
              setJobTypes(profile.preferences.jobTypes);
            }
          }
        } catch {
          // If no profile exists yet, generate initial handle from email
          if (firebaseUser?.email) {
            const initialHandle = firebaseUser.email.split("@")[0].replace(/[^a-zA-Z0-9-]/g, "").toLowerCase();
            setHandle(initialHandle.length >= 3 ? initialHandle : `worker-${Math.floor(Math.random() * 10000)}`);
          }
        }

        const skills = await searchSkills("", undefined, 50).catch(() => []);
        setAvailableSkills(skills);
        if (skills.length > 0) {
          setSelectedSkillId(skills[0].id);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load onboarding data");
      } finally {
        setLoading(false);
      }
    }

    if (firebaseUser) {
      loadData();
    }
  }, [firebaseUser, authLoading, router]);

  const handleSaveProfile = async (nextStep?: number) => {
    try {
      setSaving(true);
      setError(null);

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

      if (nextStep) {
        setStep(nextStep);
      } else {
        router.push("/dashboard/worker");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = async () => {
    if (!selectedSkillId) return;
    try {
      setSaving(true);
      const skill = availableSkills.find((s) => s.id === selectedSkillId);
      await declareWorkerSkill({
        skillId: selectedSkillId,
        proficiency: selectedProficiency,
      });
      if (skill) {
        setAddedSkills((prev) => [...prev, { name: skill.name, proficiency: selectedProficiency }]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add skill");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-slate-100">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading worker onboarding...</p>
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
          <h1 className="text-3xl font-bold text-slate-900">Worker Profile Setup</h1>
          <p className="text-slate-600 mt-2">Build your verified WorkPass to discover shifts and physical work.</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-8 bg-white p-4 rounded-xl border border-slate-200">
          <div className={`flex items-center gap-2 ${step >= 1 ? "text-orange-600 font-semibold" : "text-slate-400"}`}>
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm ${step >= 1 ? "bg-orange-100 text-orange-600" : "bg-slate-100"}`}>1</span>
            <span>Identity</span>
          </div>
          <div className="w-8 h-0.5 bg-slate-200" />
          <div className={`flex items-center gap-2 ${step >= 2 ? "text-orange-600 font-semibold" : "text-slate-400"}`}>
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm ${step >= 2 ? "bg-orange-100 text-orange-600" : "bg-slate-100"}`}>2</span>
            <span>Location</span>
          </div>
          <div className="w-8 h-0.5 bg-slate-200" />
          <div className={`flex items-center gap-2 ${step >= 3 ? "text-orange-600 font-semibold" : "text-slate-400"}`}>
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm ${step >= 3 ? "bg-orange-100 text-orange-600" : "bg-slate-100"}`}>3</span>
            <span>Skills</span>
          </div>
          <div className="w-8 h-0.5 bg-slate-200" />
          <div className={`flex items-center gap-2 ${step >= 4 ? "text-orange-600 font-semibold" : "text-slate-400"}`}>
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm ${step >= 4 ? "bg-orange-100 text-orange-600" : "bg-slate-100"}`}>4</span>
            <span>Review</span>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-500 font-bold">✕</button>
          </div>
        )}

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          {/* STEP 1: Basic Profile */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 border-b pb-3">Step 1: Your Public Handle &amp; Bio</h2>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">WorkPass Handle (Unique URL)</label>
                <div className="flex rounded-lg border border-slate-300 overflow-hidden focus-within:ring-2 focus-within:ring-orange-500">
                  <span className="bg-slate-100 px-3 py-2 text-slate-500 text-sm border-r flex items-center">skillhub.work/workpass/</span>
                  <input
                    type="text"
                    required
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder="daniel-morgan"
                    className="flex-1 px-3 py-2 outline-none text-slate-900"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">3–40 characters, letters, numbers, and hyphens.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Daniel Morgan"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Headline</label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="Experienced Plumber &amp; Heating Specialist"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Bio &amp; Background</label>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Over 6 years of experience across residential and commercial physical work..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Years of Physical Work Experience</label>
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(parseInt(e.target.value) || 0)}
                  className="w-32 px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-slate-900"
                />
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  disabled={saving || !handle.trim()}
                  onClick={() => handleSaveProfile(2)}
                  className="btn-primary"
                >
                  {saving ? "Saving..." : "Continue to Location →"}
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Location & Preferences */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 border-b pb-3">Step 2: Operating Location &amp; Preferences</h2>

              <div className="grid grid-cols-2 gap-4">
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Country Code (ISO-2)</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Max Travel Distance (km)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={maxDistanceKm}
                    onChange={(e) => setMaxDistanceKm(parseInt(e.target.value) || 25)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Work Preferences</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={openToWork}
                      onChange={(e) => setOpenToWork(e.target.checked)}
                      className="w-4 h-4 text-orange-600 rounded"
                    />
                    <div>
                      <span className="font-medium text-slate-900">Actively Open to Work</span>
                      <p className="text-xs text-slate-500">Allow employers and nearby matching engines to find your WorkPass.</p>
                    </div>
                  </label>
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
                  disabled={saving}
                  onClick={() => handleSaveProfile(3)}
                  className="btn-primary"
                >
                  {saving ? "Saving..." : "Continue to Skills →"}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Skills */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 border-b pb-3">Step 3: Declare Your Skills</h2>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Select Skill from Catalogue</label>
                <select
                  value={selectedSkillId}
                  onChange={(e) => setSelectedSkillId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 bg-white"
                >
                  {availableSkills.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.categoryName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Proficiency Level</label>
                <select
                  value={selectedProficiency}
                  onChange={(e) => setSelectedProficiency(e.target.value as SkillProficiency)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 bg-white"
                >
                  <option value="BEGINNER">Beginner (1+ years)</option>
                  <option value="INTERMEDIATE">Intermediate (2–4 years)</option>
                  <option value="ADVANCED">Advanced (5+ years)</option>
                  <option value="EXPERT">Expert / Master</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleAddSkill}
                disabled={saving || !selectedSkillId}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-sm font-medium"
              >
                + Add Skill to WorkPass
              </button>

              {addedSkills.length > 0 && (
                <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Added Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {addedSkills.map((s, idx) => (
                      <span key={idx} className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-800 flex items-center gap-1.5 shadow-sm">
                        <span>{s.name}</span>
                        <span className="text-orange-600 font-bold">• {s.proficiency}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

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
                  onClick={() => setStep(4)}
                  className="btn-primary"
                >
                  Review &amp; Complete →
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Review & Complete */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 border-b pb-3">Step 4: Privacy &amp; WorkPass Review</h2>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">WorkPass Visibility</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setVisibility("PUBLIC")}
                    className={`p-3 rounded-lg border text-left transition-all ${visibility === "PUBLIC" ? "border-orange-500 bg-orange-50 text-orange-950 font-semibold ring-2 ring-orange-500" : "border-slate-200 hover:bg-slate-50"}`}
                  >
                    <div className="font-bold">Public</div>
                    <div className="text-xs text-slate-500 mt-1">Visible on shareable link &amp; search</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisibility("EMPLOYERS_ONLY")}
                    className={`p-3 rounded-lg border text-left transition-all ${visibility === "EMPLOYERS_ONLY" ? "border-orange-500 bg-orange-50 text-orange-950 font-semibold ring-2 ring-orange-500" : "border-slate-200 hover:bg-slate-50"}`}
                  >
                    <div className="font-bold">Employers Only</div>
                    <div className="text-xs text-slate-500 mt-1">Verified employers only</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisibility("UNLISTED")}
                    className={`p-3 rounded-lg border text-left transition-all ${visibility === "UNLISTED" ? "border-orange-500 bg-orange-50 text-orange-950 font-semibold ring-2 ring-orange-500" : "border-slate-200 hover:bg-slate-50"}`}
                  >
                    <div className="font-bold">Unlisted</div>
                    <div className="text-xs text-slate-500 mt-1">Only accessible via direct link</div>
                  </button>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Handle:</span>
                  <span className="font-mono font-medium text-slate-900">@{handle}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Location:</span>
                  <span className="font-medium text-slate-900">{city}, {region} ({countryCode})</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Experience:</span>
                  <span className="font-medium text-slate-900">{experienceYears} years</span>
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSaveProfile()}
                  className="btn-primary"
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
