import campusLocations from "@/data/campus-locations.json";
import usfBuildings from "@/data/usf-buildings.json";
import type { CampusBuilding, CampusPlace } from "@/lib/maps/types";

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

/**
 * Every USF Tampa building we know, for search and schedule lookups. The hand-checked
 * ones above come first, then the rest from data/usf-buildings.json (OpenStreetMap
 * centroids). The map only draws pins for buildings on your schedule plus your From and To.
 */
export const ALL_CAMPUS_BUILDINGS: readonly CampusBuilding[] = [
  ...CAMPUS_BUILDINGS,
  ...usfBuildings.buildings,
];

function normalizeLabel(label: string): string {
  return label.trim().toLowerCase();
}

/**
 * Resolve a schedule label ("CIS", "USF Library", "Engineering Building II")
 * to a campus building by code, name, id, or alias. Case-insensitive.
 */
export function findBuildingByLabel(
  label: string,
  buildings: readonly CampusBuilding[] = ALL_CAMPUS_BUILDINGS,
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

function codeOf(place: CampusPlace): string {
  return "code" in place && place.code ? place.code : "";
}

function aliasesOf(place: CampusPlace): readonly string[] {
  return "aliases" in place ? place.aliases ?? [] : [];
}

/** Places (buildings, and garages when given) that match what someone typed, best matches first. */
export function searchBuildings<T extends CampusPlace>(
  query: string,
  places: readonly T[] = ALL_CAMPUS_BUILDINGS as readonly T[],
  limit = 8,
): T[] {
  const wanted = normalizeLabel(query);
  if (wanted === "") return places.slice(0, limit);

  const scored: { place: T; score: number }[] = [];
  for (const place of places) {
    const code = normalizeLabel(codeOf(place));
    const name = normalizeLabel(place.name);
    const aliases = aliasesOf(place).map(normalizeLabel);
    let score = -1;
    if (code !== "" && code === wanted) score = 0;
    else if (code !== "" && code.startsWith(wanted)) score = 1;
    else if (name.startsWith(wanted) || aliases.some((a) => a.startsWith(wanted))) score = 2;
    else if (name.split(/\s+/).some((word) => word.startsWith(wanted))) score = 3;
    else if (name.includes(wanted) || aliases.some((a) => a.includes(wanted))) score = 4;
    if (score >= 0) scored.push({ place, score });
  }
  return scored.sort((a, b) => a.score - b.score).slice(0, limit).map(({ place }) => place);
}
