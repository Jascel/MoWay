import { loadRoutesLibrary } from "@/lib/maps/google-maps";
import type {
  CampusBuilding,
  MapPosition,
  WalkingRouteResult,
} from "@/lib/maps/types";

export class NoWalkingRouteError extends Error {
  readonly name = "NoWalkingRouteError";

  constructor() {
    super("Google did not return a walking route for these buildings.");
  }
}

export class InvalidWalkingRouteError extends Error {
  readonly name = "InvalidWalkingRouteError";

  constructor() {
    super("Google returned an incomplete walking route.");
  }
}

function isFinitePosition(position: MapPosition): boolean {
  return Number.isFinite(position.lat) && Number.isFinite(position.lng);
}

export async function computeWalkingRoute(
  apiKey: string,
  origin: CampusBuilding,
  destination: CampusBuilding,
): Promise<WalkingRouteResult> {
  const { Route } = await loadRoutesLibrary(apiKey);
  const response = await Route.computeRoutes({
    origin: origin.position,
    destination: destination.position,
    travelMode: "WALKING",
    fields: ["path", "durationMillis", "distanceMeters", "warnings"],
  });
  const route = response.routes?.[0];

  if (route === undefined) {
    throw new NoWalkingRouteError();
  }

  const path = route.path?.map(({ lat, lng }) => ({ lat, lng }));
  const durationMillis = route.durationMillis;
  const distanceMeters = route.distanceMeters;
  const hasValidMetrics =
    typeof durationMillis === "number" &&
    Number.isFinite(durationMillis) &&
    durationMillis >= 0 &&
    typeof distanceMeters === "number" &&
    Number.isFinite(distanceMeters) &&
    distanceMeters >= 0;

  if (
    path === undefined ||
    path.length < 2 ||
    !path.every(isFinitePosition) ||
    !hasValidMetrics
  ) {
    throw new InvalidWalkingRouteError();
  }

  return {
    originId: origin.id,
    destinationId: destination.id,
    durationMillis,
    distanceMeters,
    path,
    warnings: route.warnings ?? [],
  };
}
