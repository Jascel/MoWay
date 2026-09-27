"use client";

import { useCallback, useEffect, useState } from "react";

import { getSupabaseClient } from "@/lib/supabase/client";
import { subscribeToReports } from "@/lib/database/realtime";

// How many different people reported or confirmed something today (since local midnight).
// Updates live through the same Realtime channel as the reports.
export function useHelpersToday(): number | null {
  const [count, setCount] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      const supabase = getSupabaseClient();
      const midnight = new Date();
      midnight.setHours(0, 0, 0, 0);
      const since = midnight.toISOString();

      const [reports, confirmations] = await Promise.all([
        supabase.from("reports").select("reporter_id").gte("created_at", since),
        supabase.from("report_confirmations").select("user_id").gte("created_at", since),
      ]);
      if (reports.error || confirmations.error) return;

      const people = new Set<string>();
      reports.data.forEach((row) => people.add(row.reporter_id));
      confirmations.data.forEach((row) => people.add(row.user_id));
      setCount(people.size);
    } catch {
      // Supabase isn't set up or we're offline: just don't show the line.
    }
  }, []);

  useEffect(() => {
    let active = true;
    const load = () => {
      if (active) void refresh();
    };
    load();
    // The guest sign-in may still be finishing on first load, so try once more.
    const retry = window.setTimeout(load, 3000);
    const unsubscribe = subscribeToReports(load);
    return () => {
      active = false;
      window.clearTimeout(retry);
      unsubscribe();
    };
  }, [refresh]);

  return count;
}
