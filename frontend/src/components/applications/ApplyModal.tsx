"use client";

import { useState } from "react";

interface ApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetTitle: string;
  targetType: "JOB" | "SHIFT";
  defaultRatePence?: number;
  currency?: string;
  onSubmit: (coverNote: string, proposedRatePence?: number) => Promise<void>;
}

export default function ApplyModal({
  isOpen,
  onClose,
  targetTitle,
  targetType,
  defaultRatePence,
  currency = "GBP",
  onSubmit,
}: ApplyModalProps) {
  const [coverNote, setCoverNote] = useState("");
  const [proposedRate, setProposedRate] = useState(
    defaultRatePence ? (defaultRatePence / 100).toFixed(2) : ""
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const parsedRate = proposedRate.trim()
        ? Math.round(parseFloat(proposedRate) * 100)
        : undefined;

      if (parsedRate !== undefined && (isNaN(parsedRate) || parsedRate <= 0)) {
        setError("Please enter a valid positive rate.");
        setSubmitting(false);
        return;
      }

      await onSubmit(coverNote.trim(), parsedRate);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const symbol = currency === "GBP" ? "£" : currency === "EUR" ? "€" : "$";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
              Submit {targetType === "JOB" ? "Job" : "Shift"} Application
            </span>
            <h3 className="text-lg font-extrabold text-slate-900 truncate max-w-sm mt-0.5">
              {targetTitle}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
              ⚠️ {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Cover Note (Optional)
            </label>
            <textarea
              value={coverNote}
              onChange={(e) => setCoverNote(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="Introduce yourself, mention your trade experience, availability, or any relevant certifications..."
              className="w-full text-sm p-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder:text-slate-400"
            />
            <span className="text-[11px] text-slate-400 block text-right mt-1">
              {coverNote.length}/2000 characters
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Proposed Rate ({symbol})
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                {symbol}
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={proposedRate}
                onChange={(e) => setProposedRate(e.target.value)}
                placeholder="25.00"
                className="w-full text-sm p-3.5 pl-8 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {targetType === "SHIFT" ? "Hourly rate in " + currency : "Proposed rate or budget compensation"}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-orange-50/60 border border-orange-100 text-xs text-orange-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <span>🛡️</span> Verified WorkPass Sharing
            </p>
            <p className="text-orange-800 leading-relaxed">
              Your verified skills, credential records, and platform reputation will be securely shared with the employer.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-slate-200 text-slate-700 font-semibold rounded-xl text-sm hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 bg-orange-600 text-white font-bold rounded-xl text-sm hover:bg-orange-700 transition disabled:opacity-60 shadow-sm"
            >
              {submitting ? "Submitting..." : "Confirm & Apply"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
