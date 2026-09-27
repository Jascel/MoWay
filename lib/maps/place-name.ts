import { distanceKm } from "@/lib/campus";
import { CAMPUS_BUILDINGS } from "@/lib/maps/campus-buildings";

// The campus building closest to a point, and how far away it is in meters.
export function nearestBuilding(lat: number, lng: number): { name: string; meters: number } | null {
  let best: { name: string; meters: number } | null = null;
  for (const building of CAMPUS_BUILDINGS) {
    const meters = distanceKm({ lat, lng }, building.position) * 1000;
    if (best === null || meters < best.meters) best = { name: building.name, meters };
  }
  return best;
}

// "4202 E Fowler Ave, Tampa, FL 33620, USA" -> "4202 E Fowler Ave"
export function shortAddress(formatted: string): string {
  return formatted.split(",")[0].trim();
}

// A friendly name for a spot on the map: a campus building if one is close,
// otherwise the street address from Google.
export async function nameForPoint(geocoder: google.maps.Geocoder, lat: number, lng: number): Promise<string> {
  const near = nearestBuilding(lat, lng);
  if (near && near.meters <= 60) return near.name;
  if (near && near.meters <= 200) return `Near ${near.name}`;
  try {
    const { results } = await geocoder.geocode({ location: { lat, lng } });
    if (results[0]) return shortAddress(results[0].formatted_address);
  } catch {
    // the Geocoding API isn't available: fall through
  }
  return "Pinned location";
}
