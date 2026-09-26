import type { MapPosition } from "@/lib/maps/types";

const EARTH_RADIUS_METERS = 6_371_008.8;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Great-circle ("as the crow flies") distance between two points, in meters. */
export function haversineMeters(a: MapPosition, b: MapPosition): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Campus paths are not straight lines. Multiply the straight-line distance by
 * this to get a rough on-the-ground walking distance without calling Google.
 */
export const WALKING_DETOUR_FACTOR = 1.3;

/** Estimated on-the-ground distance between two campus points, in meters. */
export function estimatedPathMeters(a: MapPosition, b: MapPosition): number {
  return haversineMeters(a, b) * WALKING_DETOUR_FACTOR;
}
