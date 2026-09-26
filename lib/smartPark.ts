import type { ParkingRecommendation } from "@/data/mock";
import { estimatedPathMeters } from "@/lib/maps/geo";
import { estimateLeg, type LegEstimate } from "@/lib/maps/speeds";
import type { CampusBuilding, CampusGarage } from "@/lib/maps/types";
import { campusModeVerb, type CampusMode } from "@/lib/profileMode";

/**
 * Smart Park, small version. Pure functions: plain data in, plain data out.
 * No React, no Google, no Supabase, so this can run on every render for free.
 *
 * For each garage we add up the day's campus travel: garage to the first
 * building, between consecutive buildings, and from the last building back to
 * the garage. Distances are straight-line times a detour factor (see geo.ts),
 * converted to minutes with the per-mode speed table. Lowest total wins.
 */

export type GarageRanking = {
  readonly garage: CampusGarage;
  /** Whole minutes for the whole day, garage to garage. */
  readonly totalMinutes: number;
  readonly toFirstMinutes: number;
  readonly betweenMinutes: number;
  readonly fromLastMinutes: number;
};

export type SmartParkPlan = {
  readonly mode: CampusMode;
  /** Best first. Empty when there are no garages or no buildings. */
  readonly ranked: readonly GarageRanking[];
  readonly winner: GarageRanking | undefined;
  /** One line a judge can read: why this garage. */
  readonly reason: string;
};

type Place = CampusBuilding | CampusGarage;

/** One leg between two campus places. Same helper the timeline uses (see lib/dayLegs.ts). */
export function legEstimate(from: Place, to: Place, mode: CampusMode): LegEstimate {
  return estimateLeg(from.position, to.position, mode);
}

/** Legs between consecutive stops, summed. */
function betweenLegs(buildings: readonly CampusBuilding[], mode: CampusMode): LegEstimate {
  let minutes = 0;
  let exactMinutes = 0;
  let distanceMeters = 0;
  for (let i = 1; i < buildings.length; i += 1) {
    const leg = legEstimate(buildings[i - 1], buildings[i], mode);
    minutes += leg.minutes;
    exactMinutes += leg.exactMinutes;
    distanceMeters += leg.distanceMeters;
  }
  return { minutes, exactMinutes, distanceMeters };
}

export function rankGarages(
  garages: readonly CampusGarage[],
  dayBuildings: readonly CampusBuilding[],
  mode: CampusMode,
): readonly GarageRanking[] {
  if (garages.length === 0 || dayBuildings.length === 0) return [];

  const first = dayBuildings[0];
  const last = dayBuildings[dayBuildings.length - 1];
  const between = betweenLegs(dayBuildings, mode);

  // The displayed total is the sum of the whole-minute legs, exactly what the timeline
  // adds up. Sorting uses the unrounded sum so near-ties still order correctly.
  return garages
    .map((garage) => {
      const toFirst = legEstimate(garage, first, mode);
      const fromLast = legEstimate(last, garage, mode);
      const ranking: GarageRanking = {
        garage,
        totalMinutes: toFirst.minutes + between.minutes + fromLast.minutes,
        toFirstMinutes: toFirst.minutes,
        betweenMinutes: between.minutes,
        fromLastMinutes: fromLast.minutes,
      };
      return { exact: toFirst.exactMinutes + between.exactMinutes + fromLast.exactMinutes, ranking };
    })
    .sort((a, b) => a.exact - b.exact)
    .map(({ ranking }) => ranking);
}

/** Building codes ranked by how many stops the day has there, most first. */
function busiestBuildings(dayBuildings: readonly CampusBuilding[]): readonly CampusBuilding[] {
  const counts = new Map<string, { building: CampusBuilding; stops: number }>();
  for (const building of dayBuildings) {
    const entry = counts.get(building.id);
    if (entry) entry.stops += 1;
    else counts.set(building.id, { building, stops: 1 });
  }
  return [...counts.values()].sort((a, b) => b.stops - a.stops).map(({ building }) => building);
}

/** Is `garage` the nearest of `garages` to `building`? */
function isNearestGarage(garage: CampusGarage, building: CampusBuilding, garages: readonly CampusGarage[]): boolean {
  const mine = estimatedPathMeters(garage.position, building.position);
  return garages.every((other) => estimatedPathMeters(other.position, building.position) >= mine);
}

function explainWinner(
  winner: GarageRanking,
  runnerUp: GarageRanking | undefined,
  dayBuildings: readonly CampusBuilding[],
  garages: readonly CampusGarage[],
  mode: CampusMode,
): string {
  const verb = campusModeVerb(mode);
  const first = dayBuildings[0];
  const last = dayBuildings[dayBuildings.length - 1];

  const saved = runnerUp ? runnerUp.totalMinutes - winner.totalMinutes : 0;
  const comparison =
    runnerUp === undefined
      ? ""
      : saved > 0
        ? ` ${saved} min less ${verb} than ${runnerUp.garage.name}.`
        : ` Ties with ${runnerUp.garage.name} on total ${verb}.`;

  // Say the true thing, in order of how convincing it is.
  const nearest = (building: CampusBuilding) => isNearestGarage(winner.garage, building, garages);
  const busiest = busiestBuildings(dayBuildings)[0];
  const busiestStops = dayBuildings.filter((b) => b.id === busiest.id).length;

  if (busiestStops > 1 && nearest(busiest)) {
    return `Closest to ${busiest.code}, where most of your day is.${comparison}`;
  }
  if (first.id !== last.id && nearest(first) && nearest(last)) {
    return `Closest to ${first.code} and ${last.code}, your first and last stops.${comparison}`;
  }
  if (nearest(first)) {
    return `Closest to ${first.code}, your first stop.${comparison}`;
  }
  if (nearest(last)) {
    return `Closest to ${last.code}, your last stop, so the trip back to the car is short.${comparison}`;
  }

  // Otherwise it wins on the round trip as a whole, so say that.
  const ends =
    first.id === last.id
      ? `${winner.toFirstMinutes} min to ${first.code} and back`
      : `${winner.toFirstMinutes} min to ${first.code} to start, ${winner.fromLastMinutes} min back from ${last.code}`;
  return `Least total ${verb} today: ${ends}.${comparison}`;
}

export function planSmartPark(
  garages: readonly CampusGarage[],
  dayBuildings: readonly CampusBuilding[],
  mode: CampusMode,
): SmartParkPlan {
  const ranked = rankGarages(garages, dayBuildings, mode);
  const winner = ranked[0];
  if (!winner) {
    return { mode, ranked, winner, reason: "Add a class with a campus building to get a garage pick." };
  }
  return { mode, ranked, winner, reason: explainWinner(winner, ranked[1], dayBuildings, garages, mode) };
}

/**
 * Shape a plan into the card's data contract. `spotsLeftPercent` stays mock:
 * we do not have live garage counts.
 */
export function toParkingRecommendation(
  plan: SmartParkPlan,
  { spotsLeftPercent }: { readonly spotsLeftPercent: number },
): ParkingRecommendation | undefined {
  const { winner, ranked } = plan;
  if (!winner) return undefined;

  const worst = ranked[ranked.length - 1];
  const alternatives = ranked.slice(1).map((r) => ({ garage: r.garage.name, totalWalkMinutes: r.totalMinutes }));

  return {
    garage: winner.garage.name,
    reason: plan.reason,
    savesWalkMinutes: Math.max(0, worst.totalMinutes - winner.totalMinutes),
    spotsLeftPercent,
    walkMinutesToFirstClass: winner.toFirstMinutes,
    walkMinutesFromLastClass: winner.fromLastMinutes,
    totalWalkMinutes: winner.totalMinutes,
    alternatives,
    modeVerb: campusModeVerb(plan.mode),
  };
}

