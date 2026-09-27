import type { Mode, Report } from "@/data/mock";
import { distanceToPathMeters } from "@/lib/maps/geo";
import { minutesFor, minutesForExact } from "@/lib/maps/speeds";
import type { WalkingRouteResult } from "@/lib/maps/types";

export type RouteChoiceStatus = "unavailable" | "clear" | "watching" | "rerouted" | "unaffected" | "blocked";
export type RouteChoice = {
  readonly chosen: WalkingRouteResult | null;
  readonly rejected: readonly WalkingRouteResult[];
  readonly extraMinutes: number;
  readonly chips: readonly string[];
  readonly hazards: readonly Report[];
  readonly status: RouteChoiceStatus;
};

export function isBlockingForMe(report: Report, mode: Mode): boolean {
  const impact = report.impact;
  switch (impact) {
    case "blocks_all": return true;
    case "blocks_wheelchair": return mode === "wheelchair";
    case "blocks_walking": return mode === "walking";
    case "blocks_scooter": return mode === "scooter";
    case "inconvenience": return false;
    default: {
      const exhaustive: never = impact;
      return exhaustive;
    }
  }
}

export function hazardsOnRoute(route: WalkingRouteResult, reports: readonly Report[]): readonly Report[] {
  return reports.filter((report) => distanceToPathMeters(
    { lat: report.latitude, lng: report.longitude }, route.path,
  ) <= 25);
}

export function chooseRoute(candidates: readonly WalkingRouteResult[], reports: readonly Report[], myMode: Mode): RouteChoice {
  const uniqueReports = [...new Map(reports.map((report) => [report.id, report])).values()];
  const ranked = candidates.map((route, index) => {
    const hazards = hazardsOnRoute(route, uniqueReports);
    const blockers = hazards.filter((report) => report.status === "confirmed" && isBlockingForMe(report, myMode));
    const score = minutesForExact(route.distanceMeters, myMode)
      + 2 * hazards.filter((report) => report.impact === "inconvenience").length;
    return { route, index, hazards, blockers, score };
  }).sort((a, b) => a.blockers.length - b.blockers.length || a.score - b.score || a.index - b.index);
  const selected = ranked[0];
  const fastest = [...ranked].sort((a, b) => a.route.distanceMeters - b.route.distanceMeters || a.index - b.index)[0];
  if (!selected || !fastest) {
    return { chosen: null, rejected: [], extraMinutes: 0, chips: [], hazards: [], status: "unavailable" };
  }
  const hazards = uniqueReports.filter((report) => selected.hazards.includes(report) || fastest.hazards.includes(report));
  const extraMinutes = minutesFor(selected.route.distanceMeters, myMode) - minutesFor(fastest.route.distanceMeters, myMode);
  const watching = selected.hazards.some((report) => report.status === "unconfirmed" && isBlockingForMe(report, myMode));
  const rerouted = selected.index !== fastest.index;
  const status: RouteChoiceStatus = selected.blockers.length > 0 ? "blocked"
    : rerouted ? "rerouted" : watching ? "watching" : hazards.length > 0 ? "unaffected" : "clear";
  const chips: string[] = [];
  if (rerouted) chips.push(`+${extraMinutes} min`);
  if (status === "blocked") chips.push("All routes have confirmed barriers.");
  if (watching) chips.push("Watching a report.");
  for (const report of hazards) {
    const label = report.category.replace(/_/g, " ");
    if (!selected.hazards.includes(report)) chips.push(`Avoids ${label}`);
    else if (report.impact === "inconvenience" || (report.status === "confirmed" && isBlockingForMe(report, myMode))) {
      chips.push(`Passes reported ${label}`);
    }
  }
  if (status === "unaffected" && hazards.every((report) => report.impact !== "inconvenience")) {
    chips.push("Doesn't affect your route.");
  }
  return { chosen: selected.route, rejected: ranked.slice(1).map(({ route }) => route),
    extraMinutes, chips: [...new Set(chips)], hazards, status };
}
