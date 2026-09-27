import type { Report, RouteAlert } from "@/data/mock";
import { categoryInfo } from "@/lib/reportCategories";
import type { CampusMode } from "@/lib/profileMode";
import { campusModeVerb } from "@/lib/profileMode";
import { isBlockingForMe, type RouteChoice } from "@/lib/maps/route-hazards";
import { minusMinutes } from "@/lib/time";

export type TodayAlertStatus = "watching" | "rerouted" | "unaffected" | "blocked" | "cleared";
export type DerivedAlert = RouteAlert & {
  readonly identity?: string;
  readonly status: TodayAlertStatus;
};

export function alertFromReport(report: Report): RouteAlert {
  const info = categoryInfo(report.category);
  return {
    reportId: report.id,
    message: `${info.label} at ${report.location}. We are watching this report.`,
    extraMinutes: 0,
  };
}

export function alertFromChoice(
  choice: RouteChoice,
  report: Report | null,
  mode: CampusMode,
): DerivedAlert | null {
  const reportId = report?.id ?? "cleared";
  const subject = report
    ? `${categoryInfo(report.category).label} at ${report.location}`
    : "This report";
  const verb = campusModeVerb(mode);
  const extraMinutes = Math.max(0, choice.extraMinutes);

  switch (choice.status) {
    case "watching":
      return {
        reportId,
        message: `Someone reported ${subject.toLowerCase()} on your route. We're watching it.`,
        extraMinutes: 0,
        status: "watching",
      };
    case "rerouted":
      return {
        reportId,
        message: `Confirmed ${subject.toLowerCase()}. We rerouted your ${verb} route, +${extraMinutes} min.`,
        extraMinutes,
        status: "rerouted",
      };
    case "blocked":
      return {
        reportId,
        message: `Confirmed ${subject.toLowerCase()}. All available routes have a barrier.`,
        extraMinutes,
        status: "blocked",
      };
    case "unaffected":
      return {
        reportId,
        message: `${subject} doesn't affect your ${verb} route.`,
        extraMinutes: 0,
        status: "unaffected",
      };
    case "clear":
    case "unavailable":
      return null;
    default: {
      const exhaustive: never = choice.status;
      return exhaustive;
    }
  }
}

export function alertFromClearedReport(reportId: string): DerivedAlert {
  return {
    reportId,
    message: "Cleared by the community. Your route is back to normal.",
    extraMinutes: 0,
    status: "cleared",
  };
}

export function alertFromUnaffectedReport(reportId: string): DerivedAlert {
  return {
    reportId,
    message: "This report is still active, but it no longer affects your route.",
    extraMinutes: 0,
    status: "unaffected",
  };
}

export function reportForChoice(choice: RouteChoice, mode: CampusMode): Report | null {
  const relevant = choice.hazards.filter((report) => isBlockingForMe(report, mode));
  switch (choice.status) {
    case "watching":
      return relevant.find((report) => report.status === "unconfirmed") ?? choice.hazards[0] ?? null;
    case "rerouted":
    case "blocked":
      return relevant.find((report) => report.status === "confirmed") ?? choice.hazards[0] ?? null;
    case "unaffected":
    case "clear":
    case "unavailable":
      return relevant[0] ?? choice.hazards[0] ?? null;
    default: {
      const exhaustive: never = choice.status;
      return exhaustive;
    }
  }
}

export type AlertTransitionInput = {
  readonly storedAlert: DerivedAlert | null;
  readonly seenIdentity: string | null;
  readonly reports: readonly Report[];
  readonly routeReport: Report | null;
  readonly choice: RouteChoice | null;
  readonly mode: CampusMode;
  readonly originId: string;
  readonly destinationId: string;
  readonly refresh: "pending" | "success" | "error";
};

export type AlertTransition = {
  readonly identity: string;
  readonly alert: DerivedAlert;
};

function reportIdFromIdentity(identity: string | null): string | null {
  if (identity === null) return null;
  const [prefix, value] = identity.split(":");
  return prefix === "cleared" || prefix === "unaffected" ? value ?? null : prefix ?? null;
}

function choiceIdentity(
  report: Report,
  choice: RouteChoice,
  mode: CampusMode,
  originId: string,
  destinationId: string,
): string {
  return [
    report.id,
    report.status,
    mode,
    choice.status,
    choice.extraMinutes,
    choice.chosen?.distanceMeters ?? 0,
    originId,
    destinationId,
  ].join(":");
}

export function reconcileAlert(input: AlertTransitionInput): AlertTransition | null {
  if (input.refresh !== "success" || input.choice === null) return null;

  if (input.routeReport !== null) {
    const identity = choiceIdentity(
      input.routeReport,
      input.choice,
      input.mode,
      input.originId,
      input.destinationId,
    );
    if (identity === input.seenIdentity || identity === input.storedAlert?.identity) return null;
    const alert = alertFromChoice(input.choice, input.routeReport, input.mode);
    return alert === null ? null : { identity, alert };
  }

  const reportId = input.storedAlert?.reportId ?? reportIdFromIdentity(input.seenIdentity);
  if (reportId === null) return null;

  const activeReport = input.reports.some((report) => report.id === reportId);
  if (!activeReport) {
    const identity = `cleared:${reportId}:${input.mode}:${input.originId}:${input.destinationId}`;
    if (identity === input.seenIdentity || identity === input.storedAlert?.identity) return null;
    return { identity, alert: alertFromClearedReport(reportId) };
  }

  const identity = `unaffected:${reportId}:${input.mode}:${input.originId}:${input.destinationId}`;
  if (identity === input.seenIdentity || identity === input.storedAlert?.identity) return null;
  return { identity, alert: alertFromUnaffectedReport(reportId) };
}

export function leaveByForFirstLeg(
  arriveBy: string,
  driveMinutes: number,
  firstLegMinutes: number,
): string {
  return minusMinutes(minusMinutes(arriveBy, driveMinutes), firstLegMinutes);
}

// Both screens read and write the alert under this localStorage key.
export const ALERT_KEY = "moway.activeAlert";
