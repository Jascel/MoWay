import type { Mode, Profile } from "@/data/mock";

/** Modes you can use on campus paths. Driving and transit get you *to* campus. */
export type CampusMode = Exclude<Mode, "driving" | "transit">;

export function isCampusMode(mode: Mode): mode is CampusMode {
  return mode !== "driving" && mode !== "transit";
}

/**
 * The mode the user moves around campus with today.
 *
 * A driver's profile lists ["driving", "wheelchair"]; the wheelchair is what
 * matters for walking legs and garage choice. Prefer the profile's active mode
 * when it is a campus mode, otherwise the first campus mode in the list, and
 * fall back to walking.
 */
export function campusMode(profile: Pick<Profile, "modes" | "activeMode">): CampusMode {
  if (isCampusMode(profile.activeMode)) return profile.activeMode;
  const first = profile.modes.find(isCampusMode);
  return first ?? "walking";
}

/** "6 min of rolling" / "6 min of walking": the verb for copy about a campus leg. */
export function campusModeVerb(mode: CampusMode): string {
  switch (mode) {
    case "wheelchair":
      return "rolling";
    case "scooter":
      return "riding";
    case "bike":
      return "biking";
    default:
      return "walking";
  }
}
