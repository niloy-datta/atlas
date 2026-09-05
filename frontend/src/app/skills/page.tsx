"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import {
  listWorkerSkills,
  declareWorkerSkill,
  removeWorkerSkill,
  listCategories,
  searchSkills,
  WorkerSkillView,
  SkillCategory,
  SkillItem,
  SkillProficiency,
} from "../../lib/api/skills";

export default function SkillsPage() {
  const { firebaseUser, loading: authLoading } = useAuth();
  const router = useRouter();

  const [skills, setSkills] = useState<WorkerSkillView[]>([]);
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [catalogue, setCatalogue] = useState<SkillItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const [declaringSkillId, setDeclaringSkillId] = useState("");
  const [declaringProficiency, setDeclaringProficiency] = useState<SkillProficiency>("INTERMEDIATE");

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
        const [userSkills, cats, catSkills] = await Promise.all([
          listWorkerSkills().catch(() => []),
          listCategories().catch(() => []),
          searchSkills("", undefined, 50).catch(() => []),
        ]);
        setSkills(userSkills);
        setCategories(cats);
        setCatalogue(catSkills);
        if (catSkills.length > 0) setDeclaringSkillId(catSkills[0].id);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load skills");
      } finally {
        setLoading(false);
      }
    }

    if (firebaseUser) {
      load();
    }
  }, [firebaseUser, authLoading, router]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const results = await searchSkills(searchQuery, selectedCategory || undefined, 50);
      setCatalogue(results);
      if (results.length > 0) setDeclaringSkillId(results[0].id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to search catalogue");
    }
  };

  const handleDeclare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!declaringSkillId) return;
    try {
      setActionLoading(true);
      setError(null);
      const declared = await declareWorkerSkill({
        skillId: declaringSkillId,
        proficiency: declaringProficiency,
      });
      setSkills((prev) => [...prev.filter((s) => s.id !== declared.id), declared]);
      setSuccess("Skill successfully added to your WorkPass!");
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to declare skill");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      setActionLoading(true);
      await removeWorkerSkill(id);
      setSkills((prev) => prev.filter((s) => s.id !== id));
      setSuccess("Skill removed from your profile.");
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to remove skill");
    } finally {
      setActionLoading(false);
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
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/dashboard/worker" className="text-sm font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1">
            ← Back to Dashboard
          </Link>
          <span className="font-bold text-slate-900">Manage Skills &amp; Proofs</span>
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

        {/* Current Skills */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Your Declared Skills</h2>

          {skills.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {skills.map((s) => (
                <div key={s.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">{s.skillName}</div>
                    <div className="text-xs text-slate-500">{s.categoryName} • {s.proficiency}</div>
                    <div className="mt-1">
                      <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-800 font-semibold rounded">
                        {s.status}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(s.id)}
                    disabled={actionLoading}
                    className="text-xs text-red-600 hover:text-red-800 font-semibold px-2 py-1 border border-red-200 rounded hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">No skills added yet. Use the form below to declare your skills.</p>
          )}
        </div>

        {/* Add Skill Form */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Add Skill from Catalogue</h2>

          <form onSubmit={handleSearch} className="flex gap-3 mb-6">
            <input
              type="text"
              placeholder="Search skill by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-slate-900"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 bg-white"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button type="submit" className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-lg text-sm">
              Search
            </button>
          </form>

          <form onSubmit={handleDeclare} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Select Skill</label>
                <select
                  value={declaringSkillId}
                  onChange={(e) => setDeclaringSkillId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 bg-white"
                >
                  {catalogue.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.categoryName})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Proficiency Level</label>
                <select
                  value={declaringProficiency}
                  onChange={(e) => setDeclaringProficiency(e.target.value as SkillProficiency)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 bg-white"
                >
                  <option value="BEGINNER">Beginner (1+ years)</option>
                  <option value="INTERMEDIATE">Intermediate (2–4 years)</option>
                  <option value="ADVANCED">Advanced (5+ years)</option>
                  <option value="EXPERT">Expert / Master</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={actionLoading || !declaringSkillId}
              className="btn-primary"
            >
              {actionLoading ? "Adding..." : "+ Declare Skill"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
