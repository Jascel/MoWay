// Turns our screens' data into the exact shapes Adriana's Supabase functions expect.
// The types below mirror lib/database/mobility.ts and lib/database/reports.ts on the
// adriana/backend branch. When her branch is merged, import from there instead.
import type { Profile, Report } from "@/data/mock";

export type MobilityProfileInput = {
  availableModes: Profile["modes"];
  activeMode: Profile["activeMode"];
  stepFree: boolean;
  pavedSurface: boolean;
  accessibleEntrances: boolean;
  willingExtraDistance: boolean;
  preferShade: boolean;
  preferCovered: boolean;
  avoidCrowds: boolean;
};

// Input for saveMobilityProfile(). ("well_lit" has no backend field yet, so it isn't sent.)
export function toMobilityProfileInput(profile: Profile): MobilityProfileInput {
  const has = (p: Profile["prefs"][number]) => profile.prefs.includes(p);
  return {
    availableModes: profile.modes,
    activeMode: profile.activeMode,
    stepFree: has("step_free"),
    pavedSurface: has("paved_surface"),
    accessibleEntrances: has("accessible_entrances"),
    willingExtraDistance: has("willing_extra_distance"),
    preferShade: has("prefer_shade"),
    preferCovered: has("prefer_covered"),
    avoidCrowds: has("avoid_crowds"),
  };
}

export type ReportInput = {
  reportType: Report["category"];
  impact: Report["impact"];
  conditionClass: Report["conditionClass"];
  latitude: number;
  longitude: number;
  userLatitude: number;
  userLongitude: number;
};

// Input for createReport(). The report is placed where the user is standing.
export function toReportInput(
  report: Report,
  user: { latitude: number; longitude: number }
): ReportInput {
  return {
    reportType: report.category,
    impact: report.impact,
    conditionClass: report.conditionClass,
    latitude: report.latitude,
    longitude: report.longitude,
    userLatitude: user.latitude,
    userLongitude: user.longitude,
  };
}
