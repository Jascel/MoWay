// Where "campus" is, for deciding which reports matter to a student's day.
// The Marshall Student Center stands in for the middle of the USF Tampa campus
// (coordinates from Andres's campus map data).
export const CAMPUS_CENTER = { lat: 28.063634, lng: -82.413211 };

// Reports farther than this from campus don't change the day.
export const NEARBY_RADIUS_KM = 3;

// Straight-line distance between two points on the Earth, in kilometers.
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

export function isNearCampus(latitude: number, longitude: number): boolean {
  return distanceKm(CAMPUS_CENTER, { lat: latitude, lng: longitude }) <= NEARBY_RADIUS_KM;
}
