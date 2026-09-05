"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../context/AuthContext";
import { listOrganizations, listOrganizationLocations, OrganizationSummary, LocationRow } from "../../../lib/api/organizations";
import { searchSkills, SkillItem, SkillProficiency } from "../../../lib/api/skills";
import {
  createJobDraft,
  publishJob,
  addJobSkillRequirement,
  addJobCredentialRequirement,
  JobType,
} from "../../../lib/api/jobs";

export default function CreateJobPage() {
  const router = useRouter();
  const { firebaseUser, loading: authLoading } = useAuth();

  const [orgs, setOrgs] = useState<OrganizationSummary[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [skillCatalogue, setSkillCatalogue] = useState<SkillItem[]>([]);

  // Wizard Steps
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Basics
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [jobType, setJobType] = useState<JobType>("SHIFT");
  const [budgetMin, setBudgetMin] = useState<string>("200");
  const [budgetMax, setBudgetMax] = useState<string>("300");
  const [currency, setCurrency] = useState("GBP");

  // Step 2: Location
  const [locationName, setLocationName] = useState("Central London Depot");
  const [formattedAddress, setFormattedAddress] = useState("10 Berkeley Square, London W1J 6AA");
  const [latitude, setLatitude] = useState(51.5098);
  const [longitude, setLongitude] = useState(-0.1465);

  // Step 3: Skills & Credentials
  const [selectedSkillId, setSelectedSkillId] = useState("");
  const [selectedSkillProficiency, setSelectedSkillProficiency] = useState<SkillProficiency>("INTERMEDIATE");
  const [addedSkills, setAddedSkills] = useState<Array<{ skillId: string; name: string; proficiency: SkillProficiency }>>([]);

  const [credTitle, setCredTitle] = useState("");
  const [credType, setCredType] = useState("CERTIFICATE");
  const [credIssuer, setCredIssuer] = useState("");
  const [addedCredentials, setAddedCredentials] = useState<Array<{ title: string; credentialType: string; issuer: string }>>([]);

  useEffect(() => {
    if (!authLoading && !firebaseUser) {
      router.push("/login?redirect=/jobs/create");
      return;
    }

    async function init() {
      try {
        setLoading(true);
        const orgList = await listOrganizations().catch(() => []);
        setOrgs(orgList);
        if (orgList.length === 0) {
          router.push("/onboarding/employer");
          return;
        }

        const activeOrgId = orgList[0].id;
        setSelectedOrgId(activeOrgId);

        const [locs, skills] = await Promise.all([
          listOrganizationLocations(activeOrgId).catch(() => []),
          searchSkills("", undefined, 50).catch(() => []),
        ]);

        setLocations(locs);
        setSkillCatalogue(skills);
        if (skills.length > 0) {
          setSelectedSkillId(skills[0].id);
        }

        if (locs.length > 0) {
          setLocationName(locs[0].name);
          setFormattedAddress(locs[0].formattedAddress);
          setLatitude(locs[0].latitude);
          setLongitude(locs[0].longitude);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load job wizard");
      } finally {
        setLoading(false);
      }
    }

    if (firebaseUser) {
      init();
    }
  }, [firebaseUser, authLoading, router]);

  const handleSelectLocation = (loc: LocationRow) => {
    setLocationName(loc.name);
    setFormattedAddress(loc.formattedAddress);
    setLatitude(loc.latitude);
    setLongitude(loc.longitude);
  };

  const handleAddSkill = () => {
    const item = skillCatalogue.find((s) => s.id === selectedSkillId);
    if (!item) return;
    if (addedSkills.some((s) => s.skillId === selectedSkillId)) return;
    setAddedSkills((prev) => [
      ...prev,
      { skillId: item.id, name: item.name, proficiency: selectedSkillProficiency },
    ]);
  };

  const handleRemoveSkill = (skillId: string) => {
    setAddedSkills((prev) => prev.filter((s) => s.skillId !== skillId));
  };

  const handleAddCredential = () => {
    if (!credTitle.trim()) return;
    if (addedCredentials.some((c) => c.title.toLowerCase() === credTitle.trim().toLowerCase())) return;
    setAddedCredentials((prev) => [
      ...prev,
      { title: credTitle.trim(), credentialType: credType, issuer: credIssuer.trim() },
    ]);
    setCredTitle("");
    setCredIssuer("");
  };

  const handleRemoveCredential = (titleToRemove: string) => {
    setAddedCredentials((prev) => prev.filter((c) => c.title !== titleToRemove));
  };

  const handleSubmitJob = async (publishNow: boolean) => {
    if (!selectedOrgId) return;
    try {
      setSubmitting(true);
      setError(null);

      const minPence = budgetMin ? Math.round(parseFloat(budgetMin) * 100) : undefined;
      const maxPence = budgetMax ? Math.round(parseFloat(budgetMax) * 100) : undefined;

      // 1. Create Job Draft
      const draft = await createJobDraft(selectedOrgId, {
        title: title.trim(),
        description: description.trim(),
        jobType,
        locationName: locationName.trim() || undefined,
        formattedAddress: formattedAddress.trim() || undefined,
        latitude,
        longitude,
        budgetMinPence: minPence,
        budgetMaxPence: maxPence,
        currency,
      });

      // 2. Attach Required Skills
      for (const s of addedSkills) {
        await addJobSkillRequirement(selectedOrgId, draft.id, {
          skillId: s.skillId,
          minimumProficiency: s.proficiency,
          required: true,
        });
      }

      // 3. Attach Required Credentials
      for (const c of addedCredentials) {
        await addJobCredentialRequirement(selectedOrgId, draft.id, {
          title: c.title,
          credentialType: c.credentialType,
          issuer: c.issuer || undefined,
          required: true,
        });
      }

      // 4. Publish if requested
      if (publishNow) {
        await publishJob(selectedOrgId, draft.id, draft.version);
      }

      router.push(`/jobs/${draft.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create job");
      setSubmitting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/dashboard/employer" className="text-sm font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1">
            ← Back to Dashboard
          </Link>
          <span className="font-bold text-slate-900">Post New Workforce Engagement</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Step Indicator */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className={`flex items-center gap-2 text-sm font-bold ${step >= 1 ? "text-orange-600" : "text-slate-400"}`}>
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${step >= 1 ? "bg-orange-600 text-white" : "bg-slate-200 text-slate-600"}`}>1</span>
            <span>Basics</span>
          </div>
          <span className="text-slate-300">→</span>
          <div className={`flex items-center gap-2 text-sm font-bold ${step >= 2 ? "text-orange-600" : "text-slate-400"}`}>
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${step >= 2 ? "bg-orange-600 text-white" : "bg-slate-200 text-slate-600"}`}>2</span>
            <span>Location</span>
          </div>
          <span className="text-slate-300">→</span>
          <div className={`flex items-center gap-2 text-sm font-bold ${step >= 3 ? "text-orange-600" : "text-slate-400"}`}>
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${step >= 3 ? "bg-orange-600 text-white" : "bg-slate-200 text-slate-600"}`}>3</span>
            <span>Requirements</span>
          </div>
          <span className="text-slate-300">→</span>
          <div className={`flex items-center gap-2 text-sm font-bold ${step >= 4 ? "text-orange-600" : "text-slate-400"}`}>
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${step >= 4 ? "bg-orange-600 text-white" : "bg-slate-200 text-slate-600"}`}>4</span>
            <span>Review</span>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Step 1: Basics */}
        {step === 1 && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-xl font-bold text-slate-900">Step 1: Job Details & Compensation</h2>

            {orgs.length > 1 && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Hiring Organization</label>
                <select
                  value={selectedOrgId}
                  onChange={(e) => setSelectedOrgId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 bg-white"
                >
                  {orgs.map((o) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Job Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Commercial Electrician (NICEIC Qualified)"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Engagement Type</label>
                <select
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value as JobType)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 bg-white text-sm"
                >
                  <option value="SHIFT">Hourly Shift</option>
                  <option value="SERVICE">Fixed Service Call</option>
                  <option value="CONTRACT">Contract Project</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 bg-white text-sm"
                >
                  <option value="GBP">GBP (£)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Minimum Budget / Rate (£)</label>
                <input
                  type="number"
                  min={0}
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(e.target.value)}
                  placeholder="200"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Maximum Budget / Rate (£)</label>
                <input
                  type="number"
                  min={0}
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(e.target.value)}
                  placeholder="300"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Job Description & Responsibilities</label>
              <textarea
                required
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe project requirements, responsibilities, tools needed, and shift timetable..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 text-sm"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                disabled={!title.trim() || !description.trim()}
                onClick={() => setStep(2)}
                className="px-6 py-2.5 bg-orange-600 text-white font-semibold rounded-lg text-sm hover:bg-orange-700 disabled:opacity-50"
              >
                Next: Location →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Location */}
        {step === 2 && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-xl font-bold text-slate-900">Step 2: Operating Venue & Spatial Point</h2>

            {locations.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Select Saved Location</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {locations.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => handleSelectLocation(l)}
                      className={`p-3 text-left rounded-xl border transition text-xs ${
                        locationName === l.name
                          ? "border-orange-500 bg-orange-50 text-orange-950 font-semibold"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="font-bold text-slate-900">{l.name}</div>
                      <div className="text-slate-500 truncate">{l.formattedAddress}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Location Name</label>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="e.g. Mayfair Refurbishment Site"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Formatted Address</label>
                <input
                  type="text"
                  value={formattedAddress}
                  onChange={(e) => setFormattedAddress(e.target.value)}
                  placeholder="e.g. 10 Berkeley Square, London W1J 6AA"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={latitude}
                  onChange={(e) => setLatitude(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={longitude}
                  onChange={(e) => setLongitude(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 text-sm"
                />
              </div>
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg text-sm hover:bg-slate-50"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-6 py-2.5 bg-orange-600 text-white font-semibold rounded-lg text-sm hover:bg-orange-700"
              >
                Next: Requirements →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Requirements */}
        {step === 3 && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-xl font-bold text-slate-900">Step 3: Required Skills & Credentials</h2>

            {/* Add Skill */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Add Required Skill</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={selectedSkillId}
                  onChange={(e) => setSelectedSkillId(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 bg-white text-sm"
                >
                  {skillCatalogue.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.categoryName})</option>
                  ))}
                </select>

                <select
                  value={selectedSkillProficiency}
                  onChange={(e) => setSelectedSkillProficiency(e.target.value as SkillProficiency)}
                  className="px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 bg-white text-sm"
                >
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                  <option value="EXPERT">Expert</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleAddSkill}
                className="px-4 py-1.5 bg-slate-900 text-white font-semibold rounded-lg text-xs hover:bg-slate-800"
              >
                + Attach Skill
              </button>

              {addedSkills.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {addedSkills.map((s) => (
                    <span
                      key={s.skillId}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold"
                    >
                      {s.name} ({s.proficiency})
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(s.skillId)}
                        className="text-orange-600 hover:text-orange-950 font-bold"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Add Credential */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Add Mandatory Certification / License</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Card / Certification Title (e.g. CSCS Card)"
                  value={credTitle}
                  onChange={(e) => setCredTitle(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 text-sm"
                />

                <select
                  value={credType}
                  onChange={(e) => setCredType(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 bg-white text-sm"
                >
                  <option value="CERTIFICATE">Certificate</option>
                  <option value="LICENSE">License</option>
                  <option value="PERMIT">Permit</option>
                  <option value="OTHER">Other Card</option>
                </select>

                <input
                  type="text"
                  placeholder="Issuer (e.g. CITB, City & Guilds)"
                  value={credIssuer}
                  onChange={(e) => setCredIssuer(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 text-sm"
                />
              </div>

              <button
                type="button"
                onClick={handleAddCredential}
                className="px-4 py-1.5 bg-slate-900 text-white font-semibold rounded-lg text-xs hover:bg-slate-800"
              >
                + Attach Credential
              </button>

              {addedCredentials.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {addedCredentials.map((c) => (
                    <span
                      key={c.title}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold"
                    >
                      {c.title} ({c.credentialType})
                      <button
                        type="button"
                        onClick={() => handleRemoveCredential(c.title)}
                        className="text-blue-600 hover:text-blue-950 font-bold"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg text-sm hover:bg-slate-50"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="px-6 py-2.5 bg-orange-600 text-white font-semibold rounded-lg text-sm hover:bg-orange-700"
              >
                Next: Review & Publish →
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-xl font-bold text-slate-900">Step 4: Review & Publish Engagement</h2>

            <div className="space-y-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="font-semibold text-slate-500 text-xs block">Job Title</span>
                <span className="text-base font-bold text-slate-900">{title}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-semibold text-slate-500 text-xs block">Engagement Type</span>
                  <span className="font-medium text-slate-900">{jobType}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 text-xs block">Estimated Budget</span>
                  <span className="font-medium text-slate-900">£{budgetMin} – £{budgetMax}</span>
                </div>
              </div>

              <div>
                <span className="font-semibold text-slate-500 text-xs block">Operating Location</span>
                <span className="font-medium text-slate-900">{locationName} ({formattedAddress})</span>
              </div>

              <div>
                <span className="font-semibold text-slate-500 text-xs block">Required Skills ({addedSkills.length})</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {addedSkills.length === 0 ? (
                    <span className="text-slate-400 italic">None</span>
                  ) : (
                    addedSkills.map((s) => (
                      <span key={s.skillId} className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded text-xs">
                        {s.name} ({s.proficiency})
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div>
                <span className="font-semibold text-slate-500 text-xs block">Required Certifications ({addedCredentials.length})</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {addedCredentials.length === 0 ? (
                    <span className="text-slate-400 italic">None</span>
                  ) : (
                    addedCredentials.map((c) => (
                      <span key={c.title} className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                        {c.title}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setStep(3)}
                className="w-full sm:w-auto px-4 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-lg text-sm hover:bg-slate-50"
              >
                ← Back to Edit
              </button>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSubmitJob(false)}
                  className="flex-1 sm:flex-none px-4 py-2.5 border border-orange-600 text-orange-600 font-semibold rounded-lg text-sm hover:bg-orange-50"
                >
                  Save as Draft
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSubmitJob(true)}
                  className="flex-1 sm:flex-none px-6 py-2.5 bg-orange-600 text-white font-bold rounded-lg text-sm hover:bg-orange-700 shadow-sm"
                >
                  {submitting ? "Publishing..." : "Create & Publish"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

