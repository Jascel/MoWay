import { getSupabaseClient } from "@/lib/supabase/client";

// Calls onChange whenever a report or a confirmation is added, changed, or removed.
// Returns a function that stops listening. If Supabase isn't set up, it quietly does nothing.
export function subscribeToReports(onChange: () => void): () => void {
  try {
    const supabase = getSupabaseClient();
    const channel = supabase
      .channel("moway-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "report_confirmations" }, onChange)
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  } catch {
    return () => {};
  }
}
