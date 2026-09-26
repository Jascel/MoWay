import type { CampusGarage } from "@/lib/maps/types";

/**
 * Static garage coordinates. Resolved once with the Google Maps Geocoder
 * (ROOFTOP "parking" results, queried 2026-09-26) and committed here so the
 * app never geocodes at runtime. Crescent Hill also matches the OpenStreetMap
 * feature within ~10 m.
 *
 * Points are the garage footprint, not a specific pedestrian exit. Adjust a
 * position here when the accessible exit toward campus is known.
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
