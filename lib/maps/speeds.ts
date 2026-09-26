import type { Mode } from "@/data/mock";

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
