import type { CampusBuilding } from "@/lib/maps/types";

/**
 * Approximate outdoor pedestrian approach points picked from mapped walkways.
 * They are not survey-grade doors or verified accessible/public entrances.
 * Sources: https://maps.usf.edu/Campus_Maps/Tampa_Campus_11x17.pdf
 * and the reproducible OpenStreetMap views documented in
 * .omo/evidence/andres-usf-walking-map/coordinate-verification.md.
 */
export const CAMPUS_BUILDINGS = [
  {
    id: "msc",
    name: "Marshall Student Center",
    position: { lat: 28.063634, lng: -82.413211 },
  },
  {
    id: "library",
    name: "USF Tampa Library",
    position: { lat: 28.059792, lng: -82.412157 },
  },
  {
    id: "juniper-poplar",
    name: "Juniper-Poplar Hall",
    position: { lat: 28.059913, lng: -82.418602 },
  },
] as const satisfies readonly CampusBuilding[];
