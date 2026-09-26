// Turns the frontend data into the shapes
// expected by the Supabase backend functions.

import type { Profile, Report } from "@/data/mock";

// --------------------
// MOBILITY
// --------------------

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
  wellLit: boolean;
};

export function toMobilityProfileInput(
  profile: Profile
): MobilityProfileInput {
  const has = (p: Profile["prefs"][number]) =>
    profile.prefs.includes(p);

  return {
    availableModes: profile.modes,
    activeMode: profile.activeMode,
    stepFree: has("step_free"),
    pavedSurface: has("paved_surface"),
    accessibleEntrances: has(
      "accessible_entrances"
    ),
    willingExtraDistance: has(
      "willing_extra_distance"
    ),
    preferShade: has("prefer_shade"),
    preferCovered: has("prefer_covered"),
    avoidCrowds: has("avoid_crowds"),
    wellLit: has("well_lit"),
  };
}

// --------------------
// REPORTS
// --------------------

export type ReportInput = {
  reportType: Report["category"];
  impact: Report["impact"];
  conditionClass: Report["conditionClass"];

  latitude: number;
  longitude: number;

  userLatitude: number;
  userLongitude: number;

  locationName?: string;
  note?: string;
};

export function toReportInput(
  report: Report,
  user: {
    latitude: number;
    longitude: number;
  }
): ReportInput {
  return {
    reportType: report.category,
    impact: report.impact,
    conditionClass: report.conditionClass,

    latitude: report.latitude,
    longitude: report.longitude,

    userLatitude: user.latitude,
    userLongitude: user.longitude,

    locationName: report.location,
    note: report.note,
  };
}