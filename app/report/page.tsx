"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import StillThereCard from "@/components/StillThereCard";
import { reportCategories, categoryInfo } from "@/lib/reportCategories";
import { useStoredState } from "@/lib/useStoredState";
import { mockReport, type Report, type ReportCategory, type RouteAlert } from "@/data/mock";
import { ALERT_KEY, alertFromReport } from "@/lib/alerts";

export default function ReportPage() {
  // Reports you submit are saved on this device for now (later: Adriana's Supabase).
  const [myReports, saveMyReports] = useStoredState<Report[]>("moway.reports", []);
  const [, saveAlert] = useStoredState<RouteAlert | null>(ALERT_KEY, null);
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
    saveAlert(alertFromReport(report));
    setCategory(null);
    setLocation("");
    setNote("");
    setSent(true);
  }

  return (
    <>
      <PageHeader title="Report an issue" subtitle="Help others around campus" tone="blush" />
      <div className="-mt-6 space-y-6 px-4">
        {sent && (
          <p className="flex items-center gap-2 rounded-3xl bg-mint p-4 text-sm font-semibold">
            <Check className="size-5 shrink-0 text-leaf" />
            Thanks for reporting! Other people&apos;s routes will update.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="font-display text-2xl font-extrabold">What&apos;s going on?</h2>
          <div className="grid grid-cols-2 gap-3">
            {reportCategories.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setCategory(value);
                  setSent(false);
                }}
                className={`flex flex-col items-center gap-2 rounded-2xl border p-4 text-sm font-semibold ${
                  category === value
                    ? "border-ink bg-ink text-white"
                    : "border-ink/10 bg-cream text-ink"
                }`}
              >
                <Icon className="size-7" strokeWidth={1.75} />
                {label}
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
              className="w-full rounded-2xl border border-ink/15 bg-cream p-3"
            />
          </div>

          <div>
            <label htmlFor="note" className="mb-1 block text-sm font-bold">Details (optional)</label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full rounded-2xl border border-ink/15 bg-cream p-3"
            />
          </div>

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}

          <button
            type="submit"
            className="w-full rounded-full bg-ink py-3.5 font-semibold text-white active:bg-ink/80"
          >
            Submit report
          </button>
        </form>

        <section className="space-y-3">
          <h2 className="font-display text-2xl font-extrabold">Near you</h2>
          <StillThereCard report={mockReport} />
        </section>

        {myReports.length > 0 && (
          <section className="space-y-2">
            <h2 className="font-display text-2xl font-extrabold">Your reports</h2>
            {myReports.map((r) => {
              const info = categoryInfo(r.category);
              const Icon = info.icon;
              return (
                <div key={r.id} className="rounded-3xl bg-white p-4 shadow-sm">
                  <p className="flex items-center gap-2 font-semibold">
                    <Icon className="size-4 text-leaf" />
                    {info.label}
                  </p>
                  <p className="text-sm text-ink/70">{r.location}</p>
                </div>
              );
            })}
          </section>
        )}
      </div>
    </>
  );
}
