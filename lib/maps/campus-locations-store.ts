import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { CampusBuilding, CampusGarage, MapPosition } from "@/lib/maps/types";

/**
 * Server-only helpers that read and rewrite data/campus-locations.json.
 * Used by the development tool at /dev/campus-locations; never imported by
 * runtime app code, which reads the JSON directly at build time.
 */

export type CampusLocationsFile = {
  readonly buildings: readonly CampusBuilding[];
  readonly garages: readonly CampusGarage[];
};

export type CampusLocationKind = "building" | "garage";

export type CampusLocationInput = {
  readonly kind: CampusLocationKind;
  readonly id: string;
  readonly name: string;
  readonly code?: string;
  readonly aliases?: readonly string[];
  readonly position: MapPosition;
  readonly source?: string;
};

export class CampusLocationValidationError extends Error {
  readonly name = "CampusLocationValidationError";
}

const FILE_PATH = path.join(process.cwd(), "data", "campus-locations.json");

// Loose Tampa-area box. Anything outside is almost certainly a bad geocode.
const TAMPA_BOUNDS = { south: 27.9, north: 28.2, west: -82.6, east: -82.2 };

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function requireString(
  record: Record<string, unknown>,
  key: string,
  { optional = false }: { optional?: boolean } = {},
): string | undefined {
  const value = record[key];
  if (value === undefined || value === null || value === "") {
    if (optional) {
      return undefined;
    }
    throw new CampusLocationValidationError(`"${key}" is required.`);
  }
  if (typeof value !== "string") {
    throw new CampusLocationValidationError(`"${key}" must be a string.`);
  }
  return value.trim();
}

function parsePosition(value: unknown): MapPosition {
  if (!isRecord(value)) {
    throw new CampusLocationValidationError('"position" is required.');
  }
  const lat = Number(value.lat);
  const lng = Number(value.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new CampusLocationValidationError(
      '"position.lat" and "position.lng" must be numbers.',
    );
  }
  if (
    lat < TAMPA_BOUNDS.south ||
    lat > TAMPA_BOUNDS.north ||
    lng < TAMPA_BOUNDS.west ||
    lng > TAMPA_BOUNDS.east
  ) {
    throw new CampusLocationValidationError(
      "Position is outside the Tampa area. Pick a different search result.",
    );
  }
  return { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
}

export function parseCampusLocationInput(body: unknown): CampusLocationInput {
  if (!isRecord(body)) {
    throw new CampusLocationValidationError("Request body must be an object.");
  }

  const kind = body.kind;
  if (kind !== "building" && kind !== "garage") {
    throw new CampusLocationValidationError(
      '"kind" must be "building" or "garage".',
    );
  }

  const id = requireString(body, "id") ?? "";
  if (!ID_PATTERN.test(id)) {
    throw new CampusLocationValidationError(
      '"id" must be lowercase letters, numbers, and single hyphens (e.g. "rec-center").',
    );
  }

  const name = requireString(body, "name") ?? "";
  const position = parsePosition(body.position);
  const source = requireString(body, "source", { optional: true });

  if (kind === "garage") {
    return { kind, id, name, position, source };
  }

  const code = (requireString(body, "code") ?? "").toUpperCase();
  const rawAliases = body.aliases;
  let aliases: readonly string[] | undefined;
  if (rawAliases !== undefined) {
    if (
      !Array.isArray(rawAliases) ||
      !rawAliases.every((alias) => typeof alias === "string")
    ) {
      throw new CampusLocationValidationError(
        '"aliases" must be an array of strings.',
      );
    }
    const cleaned = rawAliases.map((alias) => alias.trim()).filter(Boolean);
    aliases = cleaned.length > 0 ? cleaned : undefined;
  }

  return { kind, id, code, name, aliases, position, source };
}

export async function readCampusLocations(): Promise<CampusLocationsFile> {
  const raw = await readFile(FILE_PATH, "utf8");
  const parsed: unknown = JSON.parse(raw);
  if (
    !isRecord(parsed) ||
    !Array.isArray(parsed.buildings) ||
    !Array.isArray(parsed.garages)
  ) {
    throw new Error("data/campus-locations.json is malformed.");
  }
  return parsed as CampusLocationsFile;
}

function upsertById<T extends { readonly id: string }>(
  items: readonly T[],
  next: T,
): readonly T[] {
  const index = items.findIndex(({ id }) => id === next.id);
  if (index === -1) {
    return [...items, next];
  }
  return items.map((item, i) => (i === index ? next : item));
}

/**
 * Insert or replace one location and rewrite the JSON file. Returns whether
 * an existing entry with the same id was replaced.
 */
export async function saveCampusLocation(
  input: CampusLocationInput,
): Promise<{ readonly replaced: boolean }> {
  const current = await readCampusLocations();

  let next: CampusLocationsFile;
  let replaced: boolean;

  if (input.kind === "garage") {
    const garage: CampusGarage = {
      id: input.id,
      name: input.name,
      position: input.position,
      ...(input.source ? { source: input.source } : {}),
    };
    replaced = current.garages.some(({ id }) => id === garage.id);
    next = { ...current, garages: upsertById(current.garages, garage) };
  } else {
    const building: CampusBuilding = {
      id: input.id,
      code: input.code ?? "",
      name: input.name,
      ...(input.aliases ? { aliases: input.aliases } : {}),
      position: input.position,
      ...(input.source ? { source: input.source } : {}),
    };
    replaced = current.buildings.some(({ id }) => id === building.id);
    next = { ...current, buildings: upsertById(current.buildings, building) };
  }

  await writeFile(FILE_PATH, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  return { replaced };
}
