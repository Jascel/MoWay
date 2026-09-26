import type { ClassEvent, Leg } from "@/data/mock";
import { findBuildingByLabel } from "@/lib/maps/campus-buildings";
import type { CampusBuilding, CampusGarage } from "@/lib/maps/types";
import { campusModeVerb, type CampusMode } from "@/lib/profileMode";
import { legEstimate } from "@/lib/smartPark";

/**
 * The walking (or rolling) legs between today's stops, computed from the same
 * distance and speed math Smart Park uses, so the timeline and the garage card
 * always agree. Pure: events in, legs out.
 *
 * Distances are straight-line times a detour factor (see geo.ts), not Google
 * routes. The plan is for the first leg (garage to first class) to become a
 * real Google route later; the rest stay estimates.
 *
 * An event whose building we have no coordinates for gets no leg in or out of
 * it, so the timeline shows the card without a connector rather than a made-up
 * number.
 */

type Stop = { readonly event: ClassEvent; readonly building: CampusBuilding | undefined };

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function legBetween(
  from: CampusBuilding | CampusGarage,
  to: CampusBuilding | CampusGarage,
  mode: CampusMode,
): Pick<Leg, "minutes" | "distanceMeters"> {
  const { minutes, distanceMeters } = legEstimate(from, to, mode);
  return { minutes, distanceMeters };
}

export function buildDayLegs(
  events: readonly ClassEvent[],
  garage: CampusGarage | undefined,
  mode: CampusMode,
): Leg[] {
  const stops: Stop[] = events.map((event) => ({ event, building: findBuildingByLabel(event.building) }));
  const legs: Leg[] = [];
  const modeChip = `${capitalize(campusModeVerb(mode))} estimate`;

  // Garage to the first stop.
  const first = stops[0];
  if (garage && first?.building) {
    legs.push({
      fromEventId: "parking",
      toEventId: first.event.id,
      ...legBetween(garage, first.building, mode),
      tags: [`From ${garage.name}`, modeChip],
    });
  }

  // Between consecutive stops.
  for (let i = 1; i < stops.length; i += 1) {
    const from = stops[i - 1];
    const to = stops[i];
    if (!from.building || !to.building) continue;

    const sameBuilding = from.building.id === to.building.id;
    legs.push({
      fromEventId: from.event.id,
      toEventId: to.event.id,
      ...legBetween(from.building, to.building, mode),
      tags: sameBuilding ? ["Same building"] : [modeChip],
    });
  }

  return legs;
}

/** Minutes from the last stop back to the garage, for the trip-home footer. */
export function minutesBackToGarage(
  events: readonly ClassEvent[],
  garage: CampusGarage | undefined,
  mode: CampusMode,
): number | undefined {
  const last = events[events.length - 1];
  const building = last ? findBuildingByLabel(last.building) : undefined;
  if (!garage || !building) return undefined;
  return legBetween(building, garage, mode).minutes;
}
