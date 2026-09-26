"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import type { Report, RouteAlert } from "@/data/mock";
import { categoryInfo } from "@/lib/reportCategories";
import { ALERT_KEY, alertFromReport } from "@/lib/alerts";
import { useStoredState } from "@/lib/useStoredState";

// "Is it still there?" card. Shows someone else's report and asks YES or NO.
// `answer` remembers what you tapped. For now that's only in this component;
// later it will be sent to the database so everyone's routes update.
export default function StillThereCard({ report }: { report: Report }) {
  const [answer, setAnswer] = useState<"yes" | "no" | null>(null);
  const [, saveAlert] = useStoredState<RouteAlert | null>(ALERT_KEY, null);
  const info = categoryInfo(report.category);
  const Icon = info.icon;
  const confirmations = report.confirmations + (answer === "yes" ? 1 : 0);

  return (
    <section className="rounded-3xl border border-blush bg-blush/25 p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-leaf">Is it still there?</p>
      <p className="mt-1 flex items-center gap-2 text-xl font-bold">
        <Icon className="size-5" />
        {info.label}
      </p>
      <p className="text-sm">{report.location}</p>
      {report.note && <p className="mt-1 text-sm text-ink/70">{report.note}</p>}
      <p className="mt-2 text-xs text-ink/60">
        Reported {report.minutesAgo} min ago · {confirmations} confirmed
      </p>

      {answer === null ? (
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => {
              setAnswer("yes");
              saveAlert(alertFromReport(report));
            }}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-ink py-3 font-semibold text-white active:bg-ink/80"
          >
            <Check className="size-4" /> Yes, still there
          </button>
          <button
            onClick={() => {
              setAnswer("no");
              saveAlert(null);
            }}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-ink/20 bg-white py-3 font-semibold"
          >
            <X className="size-4" /> No, it&apos;s clear
          </button>
        </div>
      ) : (
        <p className="mt-4 rounded-2xl bg-white p-3 text-sm font-medium text-ink">
          Thanks! {answer === "yes" ? "We'll keep routing around it." : "We'll let others know it's clear."}
        </p>
      )}
    </section>
  );
}
