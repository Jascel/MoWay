import type { Profile, Report } from "@/data/mock";
import type { MobilityProfileInput as BackendMobilityProfileInput } from "@/lib/database/mobility";
import type { ReportInput as BackendReportInput } from "@/lib/database/reports";

export type MobilityProfileInput = BackendMobilityProfileInput;

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

export type ReportInput = BackendReportInput;

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
