import campusLocations from "@/data/campus-locations.json";
import type { CampusBuilding } from "@/lib/maps/types";

/**
 * Static campus building coordinates, read from data/campus-locations.json.
 *
 * Coordinates are resolved once at development time and committed, so the app
 * never geocodes at runtime. Add or adjust entries with the dev tool at
 * /dev/campus-locations (search Google, pick the right result, drag the pin to
 * the accessible entrance, save). Each entry's `source` records where the
 * coordinate came from.
 *
 * These are approximate outdoor points, not verified accessible entrances.
 */
export const CAMPUS_BUILDINGS: readonly CampusBuilding[] =
  campusLocations.buildings;

function normalizeLabel(label: string): string {
  return label.trim().toLowerCase();
}

/**
 * Resolve a schedule label ("CIS", "USF Library", "Engineering Building II")
 * to a campus building by code, name, id, or alias. Case-insensitive.
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
