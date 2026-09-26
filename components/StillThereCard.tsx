"use client";

import { useState } from "react";
import type { Report } from "@/data/mock";
import { categoryInfo } from "@/lib/reportCategories";
import { ALERT_KEY, alertFromReport } from "@/lib/alerts";
import { useStoredState } from "@/lib/useStoredState";
import type { RouteAlert } from "@/data/mock";

// "Is it still there?" card. Shows someone else's report and asks YES or NO.
// `answer` remembers what you tapped. For now that's only in this component;
// later it will be sent to the database so everyone's routes update.
export default function StillThereCard({ report }: { report: Report }) {
  const [answer, setAnswer] = useState<"yes" | "no" | null>(null);
  const [, saveAlert] = useStoredState<RouteAlert | null>(ALERT_KEY, null);
  const info = categoryInfo(report.category);
  const confirmations = report.confirmations + (answer === "yes" ? 1 : 0);

  return (
    <section className="rounded-2xl border border-yellow-300 bg-warn-light p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-warn">Is it still there?</p>
      <p className="mt-1 text-lg font-bold">
        {info.icon} {info.label}
      </p>
      <p className="text-sm text-gray-800">{report.location}</p>
      {report.note && <p className="mt-1 text-sm text-gray-600">{report.note}</p>}
      <p className="mt-2 text-xs text-gray-500">
        Reported {report.minutesAgo} min ago · {confirmations} confirmed
      </p>

      {answer === null ? (
        <div className="mt-3 flex gap-3">
          <button
            onClick={() => {
              setAnswer("yes");
              saveAlert(alertFromReport(report));
            }}
            className="flex-1 rounded-xl bg-usf-green py-3 font-semibold text-white active:bg-usf-green-dark"
          >
            Yes, still there
          </button>
          <button
            onClick={() => {
              setAnswer("no");
              saveAlert(null);
            }}
            className="flex-1 rounded-xl border border-gray-300 bg-white py-3 font-semibold text-gray-700"
          >
            No, it&apos;s clear
          </button>
        </div>
      ) : (
        <p className="mt-3 rounded-xl bg-white p-3 text-sm font-medium text-usf-green-dark">
          Thanks! {answer === "yes" ? "We&apos;ll keep routing around it." : "We&apos;ll let others know it's clear."}
        </p>
      )}
    </section>
  );
}
