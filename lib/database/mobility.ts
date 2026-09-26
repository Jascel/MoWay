import { supabase } from "@/lib/supabase/client";

export type MobilityMode =
  | "walking"
  | "scooter"
  | "wheelchair"
  | "bike"
  | "driving"
  | "transit";

export type MobilityProfileInput = {
  availableModes: MobilityMode[];
  activeMode: MobilityMode;
  stepFree: boolean;
  pavedSurface: boolean;
  accessibleEntrances: boolean;
  willingExtraDistance: boolean;
  preferShade: boolean;
  preferCovered: boolean;
  avoidCrowds: boolean;
};

export async function saveMobilityProfile(
  input: MobilityProfileInput
) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("You must be logged in to save mobility preferences.");
  }

  if (!input.availableModes.includes(input.activeMode)) {
    throw new Error("Active mode must be one of the available modes.");
  }

  const { data, error } = await supabase
    .from("mobility_profiles")
    .upsert({
      id: user.id,
      available_modes: input.availableModes,
      active_mode: input.activeMode,
      step_free: input.stepFree,
      paved_surface: input.pavedSurface,
      accessible_entrances: input.accessibleEntrances,
      willing_extra_distance: input.willingExtraDistance,
      prefer_shade: input.preferShade,
      prefer_covered: input.preferCovered,
      avoid_crowds: input.avoidCrowds,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}