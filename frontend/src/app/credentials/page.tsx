"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import {
  listCredentials,
  createCredential,
  deleteCredential,
  initiateDocumentUpload,
  completeDocumentUpload,
  submitCredentialForVerification,
  CredentialView,
  CredentialType,
  CredentialVisibility,
} from "../../lib/api/credentials";

export default function CredentialsPage() {
  const { firebaseUser, loading: authLoading } = useAuth();
  const router = useRouter();

  const [credentials, setCredentials] = useState<CredentialView[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // New Credential Form
  const [type, setType] = useState<CredentialType>("CERTIFICATION");
  const [title, setTitle] = useState("");
  const [issuer, setIssuer] = useState("");
  const [credentialNumber, setCredentialNumber] = useState("");
  const [visibility, setVisibility] = useState<CredentialVisibility>("EMPLOYERS_ONLY");

  // File Upload State
  const [selectedCredId, setSelectedCredId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (!authLoading && !firebaseUser) {
      router.push("/login");
      return;
    }

    async function load() {
      try {
        setLoading(true);
        const list = await listCredentials().catch(() => []);
        setCredentials(list);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load credentials");
      } finally {
        setLoading(false);
      }
    }

    if (firebaseUser) {
      load();
    }
  }, [firebaseUser, authLoading, router]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !issuer.trim()) return;
    try {
      setActionLoading(true);
      setError(null);
      const created = await createCredential({
        credentialType: type,
        title: title.trim(),
        issuer: issuer.trim(),
        credentialNumber: credentialNumber.trim() || undefined,
        visibility,
      });
      setCredentials((prev) => [created, ...prev]);
      setTitle("");
      setIssuer("");
      setCredentialNumber("");
      setSuccess("Credential entry created! You can now upload the certificate document.");
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create credential");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUploadDocument = async (credentialId: string) => {
    if (!file) return;
    try {
      setActionLoading(true);
      setError(null);

      // 1. Get signed upload URL from backend
      const auth = await initiateDocumentUpload(credentialId, file.name, file.type || "application/pdf", file.size);

      // 2. Upload file to signed URL
      const uploadRes = await fetch(auth.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "application/pdf",
        },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error(`Upload to storage returned status ${uploadRes.status}`);
      }

      // 3. Complete and confirm upload on backend
      await completeDocumentUpload(credentialId, auth.documentId);

      // Refresh list
      const refreshed = await listCredentials();
      setCredentials(refreshed);
      setFile(null);
      setSelectedCredId(null);
      setSuccess("Document uploaded and verified successfully!");
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to upload document");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitVerification = async (credentialId: string) => {
    try {
      setActionLoading(true);
      const updated = await submitCredentialForVerification(credentialId);
      setCredentials((prev) => prev.map((c) => (c.id === credentialId ? updated : c)));
      setSuccess("Credential submitted for verification review!");
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit credential");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (credentialId: string) => {
    try {
      setActionLoading(true);
      await deleteCredential(credentialId);
      setCredentials((prev) => prev.filter((c) => c.id !== credentialId));
      setSuccess("Credential removed.");
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete credential");
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
          <span className="font-bold text-slate-900">Manage Credentials &amp; Documents</span>
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

        {/* Existing Credentials */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Your Credentials &amp; Certifications</h2>

          {credentials.length > 0 ? (
            <div className="space-y-4">
              {credentials.map((c) => (
                <div key={c.id} className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900">{c.title}</h3>
                        <span className={`text-xs px-2 py-0.5 font-semibold rounded ${
                          c.status === "VERIFIED"
                            ? "bg-green-100 text-green-800"
                            : c.status === "SUBMITTED"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-slate-200 text-slate-700"
                        }`}>
                          {c.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Issued by {c.issuer} • Type: {c.credentialType} • Visibility: {c.visibility}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {c.status === "DRAFT" && (
                        <button
                          onClick={() => handleSubmitVerification(c.id)}
                          disabled={actionLoading}
                          className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded"
                        >
                          Submit for Review
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(c.id)}
                        disabled={actionLoading}
                        className="px-3 py-1 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Documents List & Upload trigger */}
                  <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-xs text-slate-600">
                      {c.documents.length > 0 ? (
                        <span>
                          📎 {c.documents.length} document(s) attached ({c.documents.map((d) => d.filename).join(", ")})
                        </span>
                      ) : (
                        <span className="text-amber-600">⚠️ No document file uploaded yet.</span>
                      )}
                    </div>

                    <div>
                      {selectedCredId === c.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            className="text-xs"
                          />
                          <button
                            onClick={() => handleUploadDocument(c.id)}
                            disabled={actionLoading || !file}
                            className="px-3 py-1 bg-slate-900 text-white text-xs rounded font-medium disabled:opacity-50"
                          >
                            Upload
                          </button>
                          <button
                            onClick={() => setSelectedCredId(null)}
                            className="text-xs text-slate-500"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedCredId(c.id)}
                          className="text-xs text-orange-600 font-semibold hover:underline"
                        >
                          + Upload File
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">No credentials uploaded yet. Add a credential below.</p>
          )}
        </div>

        {/* Create Credential Form */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Add Credential / Certificate</h2>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Credential Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as CredentialType)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 bg-white"
                >
                  <option value="CERTIFICATION">Professional Certification</option>
                  <option value="LICENSE">Trade License</option>
                  <option value="RIGHT_TO_WORK">Right to Work Document</option>
                  <option value="ID_DOCUMENT">Government ID</option>
                  <option value="BACKGROUND_CHECK">Background / DBS Check</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Credential Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. City &amp; Guilds Level 3 Plumbing"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Issuing Authority / Body</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. City &amp; Guilds"
                  value={issuer}
                  onChange={(e) => setIssuer(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Credential Number (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. CG-99281-PL"
                  value={credentialNumber}
                  onChange={(e) => setCredentialNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Privacy &amp; Visibility</label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as CredentialVisibility)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 bg-white"
              >
                <option value="EMPLOYERS_ONLY">Employers Only (Recommended)</option>
                <option value="PUBLIC">Public on WorkPass</option>
                <option value="PRIVATE">Private</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={actionLoading || !title.trim() || !issuer.trim()}
              className="btn-primary"
            >
              {actionLoading ? "Saving..." : "+ Create Credential Entry"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
