import campusLocations from "@/data/campus-locations.json";
import type { CampusGarage } from "@/lib/maps/types";

/**
 * Static garage coordinates, read from data/campus-locations.json.
 *
 * Resolved once at development time and committed, so the app never geocodes
 * at runtime. Add or adjust entries with the dev tool at /dev/campus-locations.
 * Points are the garage footprint unless the pin was dragged to a specific
 * pedestrian exit; each entry's `source` says which.
 */
export const CAMPUS_GARAGES: readonly CampusGarage[] = campusLocations.garages;

export function findGarageById(
  garageId: string,
  garages: readonly CampusGarage[] = CAMPUS_GARAGES,
): CampusGarage | undefined {
  return garages.find(({ id }) => id === garageId);
}
