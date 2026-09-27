import { mockDay } from "@/data/mock";
import { planSmartPark } from "@/lib/smartPark";
import { CAMPUS_GARAGES } from "@/lib/maps/campus-parking";
import { CAMPUS_BUILDINGS, findBuildingByLabel } from "@/lib/maps/campus-buildings";
import { distanceToPathMeters } from "@/lib/maps/geo";
import { DEMO_SPOT } from "@/lib/maps/demo-spot";

const buildings = mockDay.events.map((event) => findBuildingByLabel(event.building)).filter(Boolean);
const plan = planSmartPark(CAMPUS_GARAGES, buildings, "wheelchair");
const origin = plan.winner.garage;
const destination = CAMPUS_BUILDINGS.find((building) => building.id === (process.argv[2] ?? "cis"));
const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
if (!key || !destination) throw new Error("Maps key or destination missing");
console.log(JSON.stringify({ winner: origin, rankings: plan.ranked, destination }));
const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Referer": "http://localhost:3000/",
    "X-Goog-Api-Key": key,
    "X-Goog-FieldMask": "routes.distanceMeters,routes.polyline.geoJsonLinestring",
  },
  body: JSON.stringify({
    origin: { location: { latLng: { latitude: origin.position.lat, longitude: origin.position.lng } } },
    destination: { location: { latLng: { latitude: destination.position.lat, longitude: destination.position.lng } } },
    travelMode: "WALK", computeAlternativeRoutes: true, polylineEncoding: "GEO_JSON_LINESTRING",
  }),
});
const body = await response.json();
if (!response.ok) {
  console.error(JSON.stringify({ httpStatus: response.status, status: body.error?.status,
    message: body.error?.message?.replaceAll(key, "[redacted]") }));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({ routeCount: body.routes?.length ?? 0, demoSpot: DEMO_SPOT,
    routes: body.routes?.map((route) => ({ distanceMeters: route.distanceMeters,
      distanceFromSpot: distanceToPathMeters(DEMO_SPOT,
        route.polyline.geoJsonLinestring.coordinates.map(([lng, lat]) => ({ lat, lng }))),
    })),
  }));
}
