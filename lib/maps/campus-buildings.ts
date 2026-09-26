import type { CampusBuilding } from "@/lib/maps/types";

/**
 * Static campus coordinates. Resolved once at development time and committed
 * here so the app never geocodes at runtime.
 *
 * Source per entry is noted inline:
 * - "Google": Google Maps Geocoder (ROOFTOP result) queried on 2026-09-26.
 * - "OSM": OpenStreetMap building centroid (Nominatim), used where Google
 *   could not resolve the building by name.
 * - "walkway": hand-picked outdoor pedestrian approach point from mapped
 *   walkways (see .omo/evidence/andres-usf-walking-map/coordinate-verification.md).
 *
 * These are approximate outdoor points, not verified accessible entrances.
 * Adjust a position here when the accessible entrance is known.
 */
export const CAMPUS_BUILDINGS = [
  {
    id: "msc",
    code: "MSC",
    name: "Marshall Student Center",
    // walkway approach point; Google ROOFTOP is 28.063945, -82.413396
    position: { lat: 28.063634, lng: -82.413211 },
  },
  {
    id: "cwy",
    code: "CWY",
    name: "C.W. Bill Young Hall",
    // Google
    position: { lat: 28.06137, lng: -82.408195 },
  },
  {
    id: "cis",
    code: "CIS",
    name: "Communication and Information Sciences",
    // OSM (Google resolves "CIS" to the generic USF address)
    position: { lat: 28.058472, lng: -82.411136 },
  },
  {
    id: "library",
    code: "LIB",
    name: "USF Tampa Library",
    aliases: ["USF Library", "Library"],
    // walkway approach point; Google ROOFTOP is 28.059579, -82.412251
    position: { lat: 28.059792, lng: -82.412157 },
  },
  {
    id: "rec-center",
    code: "REC",
    name: "Campus Recreation Center",
    aliases: ["USF Recreation Center", "Recreation Center", "Rec Center"],
    // Google (12301 USF Genshaft Dr)
    position: { lat: 28.060257, lng: -82.407593 },
  },
  {
    id: "enb",
    code: "ENB",
    name: "Engineering Building II",
    // Google (4220 E Fowler Ave)
    position: { lat: 28.058549, lng: -82.41561 },
  },
  {
    id: "juniper-poplar",
    code: "JP",
    name: "Juniper-Poplar Hall",
    // walkway approach point
    position: { lat: 28.059913, lng: -82.418602 },
  },
] as const satisfies readonly CampusBuilding[];

function normalizeLabel(label: string): string {
  return label.trim().toLowerCase();
}

/**
 * Resolve a schedule label ("CIS", "USF Library", "Engineering Building II")
 * to a campus building by code, name, or alias. Case-insensitive.
 */
export function findBuildingByLabel(
  label: string,
  buildings: readonly CampusBuilding[] = CAMPUS_BUILDINGS,
): CampusBuilding | undefined {
  const wanted = normalizeLabel(label);

  if (wanted === "") {
    return undefined;
  }

  return buildings.find(
    (building) =>
      normalizeLabel(building.code) === wanted ||
      normalizeLabel(building.name) === wanted ||
      normalizeLabel(building.id) === wanted ||
      (building.aliases ?? []).some((alias) => normalizeLabel(alias) === wanted),
  );
}
