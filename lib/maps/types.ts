export type MapPosition = {
  readonly lat: number;
  readonly lng: number;
};

export type CampusBuilding = {
  readonly id: string;
  /** USF building code as it appears on schedules, e.g. "CIS", "ENB". */
  readonly code: string;
  readonly name: string;
  /** Extra labels that should resolve to this building (see findBuildingByLabel). */
  readonly aliases?: readonly string[];
  readonly position: MapPosition;
  /** Where the coordinate came from, e.g. "Google Geocoder, 2026-09-26". */
  readonly source?: string;
};

export type CampusGarage = {
  readonly id: string;
  readonly name: string;
  readonly position: MapPosition;
  readonly source?: string;
};

export type WalkingRouteResult = {
  readonly originId: string;
  readonly destinationId: string;
  readonly durationMillis: number;
  readonly distanceMeters: number;
  readonly path: readonly MapPosition[];
  readonly warnings: readonly string[];
};
