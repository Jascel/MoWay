import type { Profile } from "@/data/mock";
import { toMobilityProfileInput } from "@/lib/backendMapping";
import { saveMobilityProfile } from "@/lib/database/mobility";
import { SupabaseConfigurationError } from "@/lib/supabase/client";

// Saves the profile to Supabase in the background. The profile is always saved in the browser too,
// so a failure here never blocks anything. Retries a couple of times in case the anonymous sign-in
// hasn't finished yet.
export async function syncProfile(profile: Profile): Promise<boolean> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await saveMobilityProfile(toMobilityProfileInput(profile));
      return true;
    } catch (error) {
      if (error instanceof SupabaseConfigurationError) return false; // no keys yet
      if (attempt === 2) console.error("Could not sync profile:", error);
      else await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }
  return false;
}
