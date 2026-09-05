"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../context/AuthContext";
import { listOrganizations, listOrganizationLocations, OrganizationSummary, LocationRow } from "../../../lib/api/organizations";
import { listOrganizationJobs, JobSummary } from "../../../lib/api/jobs";
import { searchSkills, SkillItem, SkillProficiency } from "../../../lib/api/skills";
import {
  createShiftDraft,
  publishShift,
  addShiftSkillRequirement,
  addShiftCredentialRequirement,
} from "../../../lib/api/shifts";

export default function CreateShiftPage() {
  const router = useRouter();
  const { firebaseUser, loading: authLoading } = useAuth();

  const [orgs, setOrgs] = useState<OrganizationSummary[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [orgJobs, setOrgJobs] = useState<JobSummary[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [inheritJobReqs, setInheritJobReqs] = useState<boolean>(true);
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
  const [capacity, setCapacity] = useState<number>(2);
  const [hourlyRatePounds, setHourlyRatePounds] = useState<string>("18.50");
  const [currency, setCurrency] = useState("GBP");

  // Step 2: Time Interval & Timezone
  const getDefaultDateTime = (daysFromNow: number, hour: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    d.setHours(hour, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  };

  const [startTimeLocal, setStartTimeLocal] = useState<string>(getDefaultDateTime(1, 8));
  const [endTimeLocal, setEndTimeLocal] = useState<string>(getDefaultDateTime(1, 16));
  const [timezone, setTimezone] = useState("Europe/London");

  // Step 3: Location
  const [locationName, setLocationName] = useState("Central Logistics Hub");
  const [formattedAddress, setFormattedAddress] = useState("10 Berkeley Square, London W1J 6AA");
  const [latitude, setLatitude] = useState(51.5098);
  const [longitude, setLongitude] = useState(-0.1465);

  // Step 4: Skills & Credentials
  const [selectedSkillId, setSelectedSkillId] = useState("");
  const [selectedSkillProficiency, setSelectedSkillProficiency] = useState<SkillProficiency>("INTERMEDIATE");
  const [addedSkills, setAddedSkills] = useState<Array<{ skillId: string; name: string; proficiency: SkillProficiency }>>([]);

  const [credTitle, setCredTitle] = useState("");
  const [credType, setCredType] = useState<"CERTIFICATE" | "LICENSE" | "PERMIT" | "OTHER">("CERTIFICATE");
  const [credIssuer, setCredIssuer] = useState("");
  const [addedCredentials, setAddedCredentials] = useState<Array<{ title: string; credentialType: "CERTIFICATE" | "LICENSE" | "PERMIT" | "OTHER"; issuer: string }>>([]);

  useEffect(() => {
    if (!authLoading && !firebaseUser) {
      router.push("/login?redirect=/shifts/create");
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

        const [jobsRes, locs, skills] = await Promise.all([
          listOrganizationJobs(activeOrgId, { size: 50 }).catch(() => ({ items: [], total: 0, page: 0, size: 50 })),
          listOrganizationLocations(activeOrgId).catch(() => []),
          searchSkills("", undefined, 50).catch(() => []),
        ]);

        setOrgJobs(jobsRes.items);
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
        setError(err instanceof Error ? err.message : "Failed to load shift wizard");
      } finally {
        setLoading(false);
      }
    }

    if (firebaseUser) {
      init();
    }
  }, [firebaseUser, authLoading, router]);

  const handleSelectJob = (jobId: string) => {
    setSelectedJobId(jobId);
    if (jobId) {
      const parent = orgJobs.find((j) => j.id === jobId);
      if (parent) {
        if (!title) setTitle(`${parent.title} - Shift`);
        if (parent.locationName) setLocationName(parent.locationName);
        if (parent.formattedAddress) setFormattedAddress(parent.formattedAddress);
        if (parent.latitude) setLatitude(parent.latitude);
        if (parent.longitude) setLongitude(parent.longitude);
      }
    }
  };

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

  const calculateDurationHours = () => {
    try {
      const s = new Date(startTimeLocal).getTime();
      const e = new Date(endTimeLocal).getTime();
      if (e > s) {
        return ((e - s) / (1000 * 60 * 60)).toFixed(1).replace(/\.0$/, "");
      }
      return "0";
    } catch {
      return "0";
    }
  };

  const handleSubmitShift = async (publishNow: boolean) => {
    if (!selectedOrgId) return;
    try {
      setSubmitting(true);
      setError(null);

      const ratePence = Math.round(parseFloat(hourlyRatePounds) * 100);
      const startIso = new Date(startTimeLocal).toISOString();
      const endIso = new Date(endTimeLocal).toISOString();

      // 1. Create Shift Draft
      const draft = await createShiftDraft(selectedOrgId, {
        jobId: selectedJobId || undefined,
        title: title.trim(),
        description: description.trim() || undefined,
        startTime: startIso,
        endTime: endIso,
        timezone,
        capacity,
        hourlyRatePence: ratePence,
        currency,
        locationName: locationName.trim() || undefined,
        formattedAddress: formattedAddress.trim() || undefined,
        latitude,
        longitude,
        inheritJobRequirements: Boolean(selectedJobId && inheritJobReqs),
      });

      // 2. Attach Custom Skills
      for (const s of addedSkills) {
        await addShiftSkillRequirement(selectedOrgId, draft.id, {
          skillId: s.skillId,
          minimumProficiency: s.proficiency,
          required: true,
        });
      }

      // 3. Attach Custom Credentials
      for (const c of addedCredentials) {
        await addShiftCredentialRequirement(selectedOrgId, draft.id, {
          title: c.title,
          credentialType: c.credentialType,
          issuer: c.issuer || undefined,
          required: true,
        });
      }

      // 4. Publish if requested
      if (publishNow) {
        await publishShift(selectedOrgId, draft.id, draft.version);
      }

      router.push(`/shifts/${draft.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create shift");
      setSubmitting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const durationHours = calculateDurationHours();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/dashboard/employer" className="text-sm font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1">
            ← Back to Dashboard
          </Link>
          <span className="font-bold text-slate-900">Create & Schedule New Shift</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Step Indicator */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className={`flex items-center gap-2 text-sm font-bold ${step >= 1 ? "text-emerald-600" : "text-slate-400"}`}>
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${step >= 1 ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"}`}>1</span>
            <span>Basics</span>
          </div>
          <span className="text-slate-300">→</span>
          <div className={`flex items-center gap-2 text-sm font-bold ${step >= 2 ? "text-emerald-600" : "text-slate-400"}`}>
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${step >= 2 ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"}`}>2</span>
            <span>Schedule</span>
          </div>
          <span className="text-slate-300">→</span>
          <div className={`flex items-center gap-2 text-sm font-bold ${step >= 3 ? "text-emerald-600" : "text-slate-400"}`}>
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${step >= 3 ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"}`}>3</span>
            <span>Location</span>
          </div>
          <span className="text-slate-300">→</span>
          <div className={`flex items-center gap-2 text-sm font-bold ${step >= 4 ? "text-emerald-600" : "text-slate-400"}`}>
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${step >= 4 ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"}`}>4</span>
            <span>Requirements</span>
          </div>
          <span className="text-slate-300">→</span>
          <div className={`flex items-center gap-2 text-sm font-bold ${step >= 5 ? "text-emerald-600" : "text-slate-400"}`}>
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${step >= 5 ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"}`}>5</span>
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
            <h2 className="text-xl font-bold text-slate-900">Step 1: Shift Title, Capacity & Compensation</h2>

            {orgs.length > 1 && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Hiring Organization</label>
                <select
                  value={selectedOrgId}
                  onChange={(e) => setSelectedOrgId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 bg-white"
                >
                  {orgs.map((o) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Optional Parent Job Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Link to Existing Job (Optional)</label>
              <select
                value={selectedJobId}
                onChange={(e) => handleSelectJob(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 bg-white text-sm"
              >
                <option value="">-- Standalone Shift (No Parent Job) --</option>
                {orgJobs.map((j) => (
                  <option key={j.id} value={j.id}>{j.title} ({j.jobType})</option>
                ))}
              </select>
              {selectedJobId && (
                <label className="flex items-center gap-2 mt-2 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inheritJobReqs}
                    onChange={(e) => setInheritJobReqs(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Automatically inherit skill & credential requirements from parent job</span>
                </label>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Shift Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Morning Warehouse Logistics Operative"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Worker Capacity Slots</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={capacity}
                  onChange={(e) => setCapacity(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Hourly Rate (£/hr)</label>
                <input
                  type="number"
                  step="0.50"
                  min={1}
                  required
                  value={hourlyRatePounds}
                  onChange={(e) => setHourlyRatePounds(e.target.value)}
                  placeholder="18.50"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 bg-white text-sm"
                >
                  <option value="GBP">GBP (£)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Shift Brief / Instructions (Optional)</label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Specific shift briefing, site entry instructions, PPE requirements..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 text-sm"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                disabled={!title.trim() || capacity < 1 || !hourlyRatePounds}
                onClick={() => setStep(2)}
                className="px-6 py-2.5 bg-emerald-600 text-white font-semibold rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50"
              >
                Next: Schedule & Time →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Schedule */}
        {step === 2 && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-xl font-bold text-slate-900">Step 2: Shift Date, Time & Timezone</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Start Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={startTimeLocal}
                  onChange={(e) => setStartTimeLocal(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">End Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={endTimeLocal}
                  onChange={(e) => setEndTimeLocal(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Timezone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 bg-white text-sm"
              >
                <option value="Europe/London">Europe/London (GMT/BST)</option>
                <option value="UTC">UTC</option>
                <option value="Europe/Dublin">Europe/Dublin</option>
                <option value="Europe/Paris">Europe/Paris</option>
                <option value="America/New_York">America/New_York (EST)</option>
              </select>
            </div>

            {/* Calculated summary */}
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-sm">
              <div>
                <span className="font-semibold text-emerald-950 block">Calculated Shift Duration</span>
                <span className="text-xs text-emerald-800">Total payable hours: {durationHours} hrs</span>
              </div>
              <div className="text-right">
                <span className="font-extrabold text-emerald-900 text-lg">
                  £{((parseFloat(hourlyRatePounds) || 0) * parseFloat(durationHours)).toFixed(2)}
                </span>
                <span className="block text-[11px] text-emerald-700">Estimated Total Worker Pay</span>
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
                disabled={parseFloat(durationHours) <= 0}
                onClick={() => setStep(3)}
                className="px-6 py-2.5 bg-emerald-600 text-white font-semibold rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50"
              >
                Next: Location →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Location */}
        {step === 3 && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-xl font-bold text-slate-900">Step 3: Operating Venue & Spatial Coordinates</h2>

            {locations.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Select Saved Organization Location</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {locations.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => handleSelectLocation(l)}
                      className={`p-3 text-left rounded-xl border transition text-xs ${
                        locationName === l.name
                          ? "border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold"
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
                <label className="block text-sm font-semibold text-slate-700 mb-1">Venue / Site Name</label>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="e.g. Central Logistics Hub"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Formatted Address</label>
                <input
                  type="text"
                  value={formattedAddress}
                  onChange={(e) => setFormattedAddress(e.target.value)}
                  placeholder="e.g. 10 Berkeley Square, London W1J 6AA"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 text-sm"
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={longitude}
                  onChange={(e) => setLongitude(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 text-sm"
                />
              </div>
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
                className="px-6 py-2.5 bg-emerald-600 text-white font-semibold rounded-lg text-sm hover:bg-emerald-700"
              >
                Next: Requirements →
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Requirements */}
        {step === 4 && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-xl font-bold text-slate-900">Step 4: Shift Skill & Credential Requirements</h2>

            {selectedJobId && inheritJobReqs && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
                ✨ <strong>Inheriting Job Requirements:</strong> All verified skills and mandatory credentials from the parent job will be automatically linked to this shift. You may also attach additional shift-specific requirements below.
              </div>
            )}

            {/* Add Skill */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Add Required Skill</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={selectedSkillId}
                  onChange={(e) => setSelectedSkillId(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 bg-white text-sm"
                >
                  {skillCatalogue.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.categoryName})</option>
                  ))}
                </select>

                <select
                  value={selectedSkillProficiency}
                  onChange={(e) => setSelectedSkillProficiency(e.target.value as SkillProficiency)}
                  className="px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 bg-white text-sm"
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
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold"
                    >
                      {s.name} ({s.proficiency})
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(s.skillId)}
                        className="text-emerald-600 hover:text-emerald-950 font-bold"
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
                  placeholder="License Title (e.g. SIA Card, CSCS Card)"
                  value={credTitle}
                  onChange={(e) => setCredTitle(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 text-sm"
                />

                <select
                  value={credType}
                  onChange={(e) => setCredType(e.target.value as "CERTIFICATE" | "LICENSE" | "PERMIT" | "OTHER")}
                  className="px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 bg-white text-sm"
                >
                  <option value="CERTIFICATE">Certificate</option>
                  <option value="LICENSE">License</option>
                  <option value="PERMIT">Permit</option>
                  <option value="OTHER">Other Card</option>
                </select>

                <input
                  type="text"
                  placeholder="Issuer (e.g. SIA, CITB)"
                  value={credIssuer}
                  onChange={(e) => setCredIssuer(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 text-sm"
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
                onClick={() => setStep(3)}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg text-sm hover:bg-slate-50"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setStep(5)}
                className="px-6 py-2.5 bg-emerald-600 text-white font-semibold rounded-lg text-sm hover:bg-emerald-700"
              >
                Next: Review & Schedule →
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Review */}
        {step === 5 && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-xl font-bold text-slate-900">Step 5: Review & Publish Shift</h2>

            <div className="space-y-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="font-semibold text-slate-500 text-xs block">Shift Title</span>
                <span className="text-base font-bold text-slate-900">{title}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-semibold text-slate-500 text-xs block">Capacity</span>
                  <span className="font-bold text-slate-900">{capacity} worker slots</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 text-xs block">Hourly Rate</span>
                  <span className="font-bold text-slate-900">£{hourlyRatePounds}/hr</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-semibold text-slate-500 text-xs block">Schedule Interval</span>
                  <span className="font-medium text-slate-900">{new Date(startTimeLocal).toLocaleString()} – {new Date(endTimeLocal).toLocaleString()}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 text-xs block">Duration</span>
                  <span className="font-medium text-slate-900">{durationHours} hours</span>
                </div>
              </div>

              <div>
                <span className="font-semibold text-slate-500 text-xs block">Operating Location</span>
                <span className="font-medium text-slate-900">{locationName} ({formattedAddress})</span>
              </div>

              <div>
                <span className="font-semibold text-slate-500 text-xs block">Shift Skills ({addedSkills.length})</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {addedSkills.length === 0 ? (
                    <span className="text-slate-400 italic">None specified (or inherited from job)</span>
                  ) : (
                    addedSkills.map((s) => (
                      <span key={s.skillId} className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-xs font-semibold">
                        {s.name} ({s.proficiency})
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div>
                <span className="font-semibold text-slate-500 text-xs block">Shift Mandatory Certifications ({addedCredentials.length})</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {addedCredentials.length === 0 ? (
                    <span className="text-slate-400 italic">None specified (or inherited from job)</span>
                  ) : (
                    addedCredentials.map((c) => (
                      <span key={c.title} className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
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
                onClick={() => setStep(4)}
                className="w-full sm:w-auto px-4 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-lg text-sm hover:bg-slate-50"
              >
                ← Back to Edit
              </button>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSubmitShift(false)}
                  className="flex-1 sm:flex-none px-4 py-2.5 border border-emerald-600 text-emerald-600 font-semibold rounded-lg text-sm hover:bg-emerald-50"
                >
                  Save as Draft
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSubmitShift(true)}
                  className="flex-1 sm:flex-none px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-lg text-sm hover:bg-emerald-700 shadow-sm"
                >
                  {submitting ? "Publishing..." : "Schedule & Publish Shift"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

