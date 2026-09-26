"use client";

import { useEffect, useState } from "react";
import type { Report } from "@/data/mock";
import { getActiveReports } from "@/lib/database/reports";
import { rowToReport } from "@/lib/database/mapReport";
import { subscribeToReports } from "@/lib/database/realtime";
import { isNearCampus } from "@/lib/campus";

// The newest active community report near campus, kept up to date live.
// Returns null when there's none, or when Supabase isn't set up (no keys yet).
export function useLiveReport(): Report | null {
  const [report, setReport] = useState<Report | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const rows = await getActiveReports();
        // Only reports near campus can change this student's day.
        const nearby = rows.filter((row) => isNearCampus(row.latitude, row.longitude));
        if (!cancelled) setReport(nearby.length > 0 ? rowToReport(nearby[0]) : null);
      } catch {
        // not configured, offline, or not signed in yet: keep what we have
      }
    }

    // Load after the first render, and once more in case the anonymous sign-in wasn't done yet.
    const first = setTimeout(load, 0);
    const retry = setTimeout(load, 3000);
    const stopListening = subscribeToReports(load);

    return () => {
      cancelled = true;
      clearTimeout(first);
      clearTimeout(retry);
      stopListening();
    };
  }, []);

  return report;
}
