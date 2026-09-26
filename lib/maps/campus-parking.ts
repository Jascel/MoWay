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
export const CAMPUS_GARAGES = [
  {
    id: "collins",
    name: "Collins Garage",
    // 12075 USF Mango Dr
    position: { lat: 28.06156, lng: -82.411987 },
  },
  {
    id: "crescent-hill",
    name: "Crescent Hill Garage",
    // 4119 USF Cedar Dr
    position: { lat: 28.065117, lng: -82.412076 },
  },
  {
    id: "beard",
    name: "Beard Garage",
    // 3800 USF Alumni Dr
    position: { lat: 28.058279, lng: -82.416952 },
  },
] as const satisfies readonly CampusGarage[];

export function findGarageById(
  garageId: string,
  garages: readonly CampusGarage[] = CAMPUS_GARAGES,
): CampusGarage | undefined {
  return garages.find(({ id }) => id === garageId);
}
