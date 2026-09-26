"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import StillThereCard from "@/components/StillThereCard";
import { reportCategories, categoryInfo } from "@/lib/reportCategories";
import { useStoredState } from "@/lib/useStoredState";
import { mockReport, type Report, type ReportCategory } from "@/data/mock";

export default function ReportPage() {
  // Reports you submit are saved on this device for now (later: Adriana's Supabase).
  const [myReports, saveMyReports] = useStoredState<Report[]>("moway.reports", []);
  const [category, setCategory] = useState<ReportCategory | null>(null);
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!category || !location.trim()) {
      setError("Pick what happened and where.");
      return;
    }
    setError("");
    const report: Report = {
      id: crypto.randomUUID(),
      category,
      location: location.trim(),
      note: note.trim() || undefined,
      minutesAgo: 0,
      confirmations: 1,
      affectsRoute: false,
    };
    saveMyReports([report, ...myReports]);
    setCategory(null);
    setLocation("");
    setNote("");
    setSent(true);
  }

  return (
    <>
      <PageHeader title="Report an issue" subtitle="Help others around campus" />
      <div className="space-y-6 p-4">
        {sent && (
          <p className="rounded-2xl bg-usf-green-light p-4 text-sm font-medium text-usf-green-dark">
            Thanks for reporting! Other people&apos;s routes will update. 🙌
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-lg font-bold">What&apos;s going on?</h2>
          <div className="grid grid-cols-2 gap-3">
            {reportCategories.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => {
                  setCategory(c.value);
                  setSent(false);
                }}
                className={`flex flex-col items-center gap-1 rounded-2xl border p-4 text-sm font-medium ${
                  category === c.value
                    ? "border-usf-green bg-usf-green text-white"
                    : "border-gray-200 bg-white text-gray-700"
                }`}
              >
                <span className="text-3xl">{c.icon}</span>
                {c.label}
              </button>
            ))}
          </div>

          <div>
            <label htmlFor="location" className="mb-1 block text-sm font-bold">Where?</label>
            <input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ramp by the Marshall Student Center"
              className="w-full rounded-xl border border-gray-300 bg-white p-3"
            />
          </div>

          <div>
            <label htmlFor="note" className="mb-1 block text-sm font-bold">Details (optional)</label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-gray-300 bg-white p-3"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            className="w-full rounded-xl bg-usf-green py-3 font-semibold text-white active:bg-usf-green-dark"
          >
            Submit report
          </button>
        </form>

        <section className="space-y-3">
          <h2 className="text-lg font-bold">Near you</h2>
          <StillThereCard report={mockReport} />
        </section>

        {myReports.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-lg font-bold">Your reports</h2>
            {myReports.map((r) => (
              <div key={r.id} className="rounded-2xl bg-white p-3 shadow-sm">
                <p className="font-semibold">
                  {categoryInfo(r.category).icon} {categoryInfo(r.category).label}
                </p>
                <p className="text-sm text-gray-600">{r.location}</p>
              </div>
            ))}
          </section>
        )}
      </div>
    </>
  );
}
