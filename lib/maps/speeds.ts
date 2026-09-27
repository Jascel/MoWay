import type { Mode } from "@/data/mock";
import { estimatedPathMeters } from "@/lib/maps/geo";
import type { MapPosition } from "@/lib/maps/types";

/**
 * Typical on-campus speeds per mobility mode, in miles per hour.
 *
 * Google's walking directions assume roughly 3 mph for everyone and have no
 * wheelchair or scooter mode, so the app takes Google's route *distance* and
 * turns it into minutes with this table. Reasonable defaults, not measured.
 *
 * Driving and transit are not campus modes; they are included so the table is
 * total over `Mode`, but `minutesFor` is only meaningful for the first four.
 */
export const MODE_MPH: Readonly<Record<Mode, number>> = {
  walking: 3.0,
  wheelchair: 2.5,
  scooter: 8,
  bike: 9,
  driving: 20,
  transit: 12,
};

const METERS_PER_MILE = 1609.344;

/** Exact minutes (not rounded) to cover `distanceMeters` at the mode's speed. */
export function minutesForExact(distanceMeters: number, mode: Mode): number {
  if (!Number.isFinite(distanceMeters) || distanceMeters <= 0) return 0;
  const miles = distanceMeters / METERS_PER_MILE;
  return (miles / MODE_MPH[mode]) * 60;
}

/** Whole minutes to cover `distanceMeters` at the mode's speed (at least 1 for any real distance). */
export function minutesFor(distanceMeters: number, mode: Mode): number {
  const exact = minutesForExact(distanceMeters, mode);
  if (exact === 0) return 0;
  return Math.max(1, Math.round(exact));
}

export type LegEstimate = {
  readonly distanceMeters: number;
  /** Whole minutes as shown to the user. */
  readonly minutes: number;
  /** Unrounded minutes, for sorting and tie-breaking. */
  readonly exactMinutes: number;
};

/**
 * One campus leg without calling Google: straight-line distance times the detour
 * factor, then the mode's speed. Every place that shows or sums leg minutes
 * (timeline, Smart Park) goes through here so the numbers always agree.
 * Two stops in the same building count as 1 minute (walk down the hall).
 */
export function estimateLeg(from: MapPosition, to: MapPosition, mode: Mode): LegEstimate {
  const distanceMeters = Math.round(estimatedPathMeters(from, to));
  if (distanceMeters === 0) return { distanceMeters: 0, minutes: 1, exactMinutes: 1 };
  return {
    distanceMeters,
    minutes: minutesFor(distanceMeters, mode),
    exactMinutes: minutesForExact(distanceMeters, mode),
  };
}
